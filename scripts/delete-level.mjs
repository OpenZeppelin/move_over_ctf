import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

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

function parseRunConfigMap(fileText) {
  const marker = "export const LEVEL_RUN_CONFIG: Record<number, LevelRunConfig> = ";
  const markerIndex = fileText.indexOf(marker);
  assert(markerIndex >= 0, "Could not find LEVEL_RUN_CONFIG in runConfig.ts.");

  const objectStart = fileText.indexOf("{", markerIndex + marker.length);
  assert(objectStart >= 0, "Could not parse LEVEL_RUN_CONFIG object start.");

  let depth = 0;
  let objectEnd = -1;
  for (let i = objectStart; i < fileText.length; i += 1) {
    const ch = fileText[i];
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        objectEnd = i;
        break;
      }
    }
  }
  assert(objectEnd >= 0, "Could not parse LEVEL_RUN_CONFIG object end.");

  const objectLiteral = fileText.slice(objectStart, objectEnd + 1);
  let parsed;
  try {
    parsed = Function(`"use strict"; return (${objectLiteral});`)();
  } catch (err) {
    throw new Error(`Failed to parse existing runConfig.ts map: ${String(err?.message || err)}`);
  }

  const out = {};
  for (const [key, raw] of Object.entries(parsed)) {
    const id = Number(key);
    assert(Number.isInteger(id) && id >= 0, `Invalid runConfig key '${key}'.`);
    assert(raw && typeof raw === "object", `Invalid runConfig entry for id ${id}.`);
    out[id] = {
      module: String(raw.module ?? ""),
      typeName: String(raw.typeName ?? ""),
      solutionModule: String(raw.solutionModule ?? ""),
      ...(raw.cleanupFunction ? { cleanupFunction: String(raw.cleanupFunction) } : {}),
    };
  }
  return out;
}

function renderRunConfigFile(configMap) {
  const ids = Object.keys(configMap)
    .map(Number)
    .filter((id) => Number.isInteger(id) && id >= 0)
    .sort((a, b) => a - b);

  const entries = ids
    .map((id) => {
      const cfg = configMap[id];
      const lines = [
        `  ${id}: {`,
        `    module: ${JSON.stringify(cfg.module)},`,
        `    typeName: ${JSON.stringify(cfg.typeName)},`,
        `    solutionModule: ${JSON.stringify(cfg.solutionModule)},`,
      ];
      if (cfg.cleanupFunction) {
        lines.push(`    cleanupFunction: ${JSON.stringify(cfg.cleanupFunction)},`);
      }
      lines.push("  },");
      return lines.join("\n");
    })
    .join("\n");

  return `/**
 * Config for the browser level runner: module and return type per level.
 * Each level has its own solution module: move_over::level_N_solution.
 */

export interface LevelRunConfig {
  module: string;
  typeName: string;
  /** Solution module name (e.g. level_0_solution) for building/writing the solution file. */
  solutionModule: string;
  /** Cleanup function called inside browser verifier. Defaults to "delete". */
  cleanupFunction?: string;
}

export const LEVEL_RUN_CONFIG: Record<number, LevelRunConfig> = {
${entries}
};

export const SUPPORTED_LEVEL_IDS = Object.keys(LEVEL_RUN_CONFIG).map(Number);
`;
}

function shiftLevelIds(levelEntries, removedId) {
  return levelEntries
    .filter((entry) => Number(entry.id) !== removedId)
    .map((entry) => {
      const id = Number(entry.id);
      const nextId = id > removedId ? id - 1 : id;
      return {
        ...entry,
        id: nextId,
      };
    })
    .sort((a, b) => Number(a.id) - Number(b.id));
}

function shiftRunConfig(configMap, removedId) {
  const out = {};
  const ids = Object.keys(configMap).map(Number).sort((a, b) => a - b);

  for (const oldId of ids) {
    if (oldId === removedId) continue;
    const newId = oldId > removedId ? oldId - 1 : oldId;
    const oldCfg = configMap[oldId];
    const cfg = { ...oldCfg };

    if (cfg.solutionModule === `level_${oldId}_solution`) {
      cfg.solutionModule = `level_${newId}_solution`;
    }
    out[newId] = cfg;
  }
  return out;
}

function shiftContentMap(contentMap, removedId) {
  const next = {};
  for (const [key, value] of Object.entries(contentMap || {})) {
    const id = Number(key);
    if (!Number.isInteger(id) || id < 0) continue;
    if (id === removedId) continue;
    const newId = id > removedId ? id - 1 : id;
    next[String(newId)] = value;
  }
  return Object.fromEntries(
    Object.entries(next).sort((a, b) => Number(a[0]) - Number(b[0]))
  );
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

  const levels = metaConfig
    .map((entry) => ({
      id: Number(entry.id),
      module: String(entry.module),
      difficulty: String(entry.difficulty),
      name:
        typeof enContent[String(entry.id)]?.name === "string"
          ? enContent[String(entry.id)].name
          : "(missing name)",
    }))
    .sort((a, b) => a.id - b.id);

  output.write("Available levels:\n");
  for (const level of levels) {
    output.write(
      `- ${level.id}: ${level.name} (module: ${level.module}, difficulty: ${level.difficulty})\n`
    );
  }
  output.write("\n");

  const rl = readline.createInterface({ input, output });
  let levelId;
  try {
    const idInput = await askRequired(rl, "Level id to delete: ", (value) => {
      if (!/^\d+$/.test(value)) return "Enter a non-negative integer id.";
      const id = Number(value);
      return levels.some((level) => level.id === id)
        ? null
        : `Level id ${id} does not exist.`;
    });
    levelId = Number(idInput);

    const target = levels.find((level) => level.id === levelId);
    assert(target, `Level id ${levelId} not found.`);

    output.write(
      `\nThis will delete level ${levelId} (${target.name}) and reindex higher ids by -1.\n`
    );
    const confirm = await askRequired(
      rl,
      'Type "delete" to confirm: ',
      (value) => (value.toLowerCase() === "delete" ? null : 'Please type exactly "delete".')
    );
    if (confirm.toLowerCase() !== "delete") return;
  } finally {
    rl.close();
  }

  const targetMeta = metaConfig.find((entry) => Number(entry.id) === levelId);
  assert(targetMeta, `Level id ${levelId} not found in meta config.`);
  const targetModule = String(targetMeta.module);

  const runConfigRaw = await fs.readFile(runConfigPath, "utf8");
  const runConfigMap = parseRunConfigMap(runConfigRaw);
  assert(runConfigMap[levelId], `runConfig.ts does not contain level id ${levelId}.`);

  const nextMeta = shiftLevelIds(metaConfig, levelId);
  const nextRunConfig = shiftRunConfig(runConfigMap, levelId);

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
    const shifted = shiftContentMap(parsed, levelId);
    await fs.writeFile(localeFile, `${JSON.stringify(shifted, null, 2)}\n`, "utf8");
  }

  const moduleStillUsed = nextMeta.some((entry) => String(entry.module) === targetModule);
  const contractPath = path.join(contractsDir, `${targetModule}.move`);
  if (!moduleStillUsed) {
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
  output.write(`- removed module: move_over::${targetModule}\n`);
  output.write("- reindexed higher level ids by -1\n");
}

run().catch((err) => {
  output.write(`\nError: ${String(err?.message || err)}\n`);
  process.exitCode = 1;
});
