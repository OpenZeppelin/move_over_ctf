import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { parseRunConfigMap, renderRunConfigFile } from "./lib/run-config.mjs";

const root = process.cwd();
const contractsDir = path.join(root, "public", "contracts");
const contentDir = path.join(root, "src", "data", "levels", "content");
const metaConfigPath = path.join(root, "src", "data", "levels", "meta.config.json");
const runConfigPath = path.join(root, "src", "data", "levels", "runConfig.ts");
const enContentPath = path.join(contentDir, "en.json");
const syncMetaScript = path.join(root, "scripts", "sync-meta-from-public.mjs");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function levelModulesFromMetaEntry(entry) {
  const primary = String(entry?.module ?? "").trim();
  const modules = Array.isArray(entry?.modules)
    ? entry.modules
        .map((moduleName) => String(moduleName ?? "").trim())
        .filter(Boolean)
    : [];
  if (primary && !modules.includes(primary)) modules.unshift(primary);
  return [...new Set(modules)];
}

function dropLevelById(levelEntries, removedId) {
  return levelEntries.filter((entry) => String(entry.id) !== removedId);
}

function dropFromRunConfig(configMap, removedId) {
  const out = {};
  for (const [id, cfg] of Object.entries(configMap)) {
    if (id === removedId) continue;
    out[id] = cfg;
  }
  return out;
}

function dropFromContentMap(contentMap, removedId) {
  const next = {};
  for (const [key, value] of Object.entries(contentMap || {})) {
    if (key === removedId) continue;
    next[key] = value;
  }
  return next;
}

function printHelp() {
  output.write("Delete an existing level interactively.\n\n");
  output.write("Usage:\n");
  output.write("  node scripts/delete-level.mjs\n\n");
  output.write("What it updates:\n");
  output.write("  - public/contracts/<module>.move (delete)\n");
  output.write("  - src/data/levels/meta.config.json\n");
  output.write("  - src/data/levels/runConfig.ts\n");
  output.write("  - src/data/levels/content/*.json\n");
  output.write("  - src/data/levels/meta.ts (via sync-meta script)\n");
}

async function askRequired(rl, label, validate) {
  while (true) {
    const value = (await rl.question(label)).trim();
    const error = validate ? validate(value) : value ? null : "Value is required.";
    if (!error) return value;
    output.write(`${error}\n`);
  }
}

async function run() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    return;
  }

  const metaConfigRaw = await fs.readFile(metaConfigPath, "utf8");
  const metaConfig = JSON.parse(metaConfigRaw);
  assert(Array.isArray(metaConfig), "meta.config.json must contain an array.");
  assert(metaConfig.length > 0, "No levels found.");
  assert(metaConfig.length > 1, "Cannot delete the last remaining level.");

  const enContentRaw = await fs.readFile(enContentPath, "utf8");
  const enContent = JSON.parse(enContentRaw);
  assert(enContent && typeof enContent === "object", "Invalid en.json.");

  const levels = metaConfig.map((entry) => ({
    id: String(entry.id),
    module: String(entry.module ?? ""),
    modules: levelModulesFromMetaEntry(entry),
    difficulty: String(entry.difficulty),
    name:
      typeof enContent[String(entry.id)]?.name === "string"
        ? enContent[String(entry.id)].name
        : "(missing name)",
  }));

  output.write("Available levels:\n");
  for (const level of levels) {
    output.write(
      `- ${level.id}: ${level.name} (modules: ${level.modules.join(", ") || level.module}, difficulty: ${level.difficulty})\n`
    );
  }
  output.write("\n");

  const rl = readline.createInterface({ input, output });
  let levelId;
  try {
    const idInput = await askRequired(rl, "Level id (slug) to delete: ", (value) =>
      levels.some((level) => level.id === value)
        ? null
        : `Level id '${value}' does not exist.`
    );
    levelId = idInput;

    const target = levels.find((level) => level.id === levelId);
    assert(target, `Level id ${levelId} not found.`);

    output.write(`\nThis will delete level '${levelId}' (${target.name}).\n`);
    const confirm = await askRequired(
      rl,
      'Type "delete" to confirm: ',
      (value) => (value.toLowerCase() === "delete" ? null : 'Please type exactly "delete".')
    );
    if (confirm.toLowerCase() !== "delete") return;
  } finally {
    rl.close();
  }

  const targetMeta = metaConfig.find((entry) => String(entry.id) === levelId);
  assert(targetMeta, `Level id ${levelId} not found in meta config.`);
  const targetModules = levelModulesFromMetaEntry(targetMeta);
  const targetModuleLabel = targetModules.join(", ");

  const runConfigRaw = await fs.readFile(runConfigPath, "utf8");
  const runConfigMap = parseRunConfigMap(runConfigRaw);
  assert(runConfigMap[levelId], `runConfig.ts does not contain level id ${levelId}.`);

  const nextMeta = dropLevelById(metaConfig, levelId);
  const nextRunConfig = dropFromRunConfig(runConfigMap, levelId);

  await fs.writeFile(metaConfigPath, `${JSON.stringify(nextMeta, null, 2)}\n`, "utf8");
  await fs.writeFile(runConfigPath, renderRunConfigFile(nextRunConfig), "utf8");

  const contentEntries = await fs.readdir(contentDir, { withFileTypes: true });
  const localeFiles = contentEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(contentDir, entry.name));

  for (const localeFile of localeFiles) {
    const raw = await fs.readFile(localeFile, "utf8");
    const parsed = JSON.parse(raw);
    assert(parsed && typeof parsed === "object" && !Array.isArray(parsed), `Invalid JSON at ${localeFile}`);
    const stripped = dropFromContentMap(parsed, levelId);
    await fs.writeFile(localeFile, `${JSON.stringify(stripped, null, 2)}\n`, "utf8");
  }

  for (const moduleName of targetModules) {
    const moduleStillUsed = nextMeta.some((entry) =>
      levelModulesFromMetaEntry(entry).includes(moduleName)
    );
    if (moduleStillUsed) continue;
    const contractPath = path.join(contractsDir, `${moduleName}.move`);
    try {
      await fs.unlink(contractPath);
    } catch (err) {
      if (err?.code !== "ENOENT") throw err;
    }
  }

  const sync = spawnSync("node", [syncMetaScript], { cwd: root, stdio: "inherit" });
  if (sync.status !== 0) {
    throw new Error("Failed to sync meta.ts from public/contracts.");
  }

  output.write("\nLevel deleted successfully.\n");
  output.write(`- removed id: ${levelId}\n`);
  output.write(`- removed modules: move_over::${targetModuleLabel}\n`);
}

run().catch((err) => {
  output.write(`\nError: ${String(err?.message || err)}\n`);
  process.exitCode = 1;
});
