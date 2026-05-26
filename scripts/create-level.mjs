import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { parseRunConfigMap, renderRunConfigFile } from "./lib/run-config.mjs";

const root = process.cwd();
const contractsDir = path.join(root, "public", "contracts");
const metaConfigPath = path.join(root, "src", "data", "levels", "meta.config.json");
const runConfigPath = path.join(root, "src", "data", "levels", "runConfig.ts");
const enContentPath = path.join(root, "src", "data", "levels", "content", "en.json");
const syncMetaScript = path.join(root, "scripts", "sync-meta-from-public.mjs");
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const INTERACTIVE_TTY = Boolean(input.isTTY && output.isTTY);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function toPascalCase(value) {
  return String(value)
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

function normalizeNewlines(text) {
  return String(text).replace(/\r\n?/g, "\n");
}

function stripMarkdown(text) {
  return String(text)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveDescription(name, instructions) {
  const lines = normalizeNewlines(instructions)
    .split("\n")
    .map((line) => stripMarkdown(line))
    .filter(Boolean);
  const candidate =
    lines.find((line) => !/^level\s+\d+/i.test(line)) ?? `${name} challenge level.`;
  return candidate.length > 120 ? `${candidate.slice(0, 117).trimEnd()}...` : candidate;
}

function parseModuleName(moveCode) {
  const moduleMatch =
    /\bmodule\s+([A-Za-z_][A-Za-z0-9_]*)::([A-Za-z_][A-Za-z0-9_]*)\s*(?:;|\{)/.exec(moveCode);
  if (!moduleMatch) return null;
  return {
    packageName: String(moduleMatch[1]),
    moduleName: String(moduleMatch[2]),
  };
}

function parseFlagType(moveCode, moduleName) {
  const returnTypeMatches = Array.from(
    moveCode.matchAll(/\bfun\s+[A-Za-z_][A-Za-z0-9_]*\s*\([^)]*\)\s*:\s*([A-Za-z_][A-Za-z0-9_]*)/g)
  )
    .map((match) => String(match[1]))
    .filter((typeName) => typeName.endsWith("Flag"));

  const structMatches = Array.from(moveCode.matchAll(/\bstruct\s+([A-Za-z_][A-Za-z0-9_]*)\b/g))
    .map((match) => String(match[1]))
    .filter((typeName) => typeName.endsWith("Flag"));

  // Broader fallback for unusual pasted formatting/characters around struct/function declarations.
  const anyFlagMatches = Array.from(moveCode.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*Flag)\b/g)).map(
    (match) => String(match[1])
  );

  const expected = `${toPascalCase(moduleName)}Flag`;
  const candidates = new Set([...returnTypeMatches, ...structMatches, ...anyFlagMatches]);

  if (candidates.has(expected)) return expected;
  if (candidates.size === 1) return Array.from(candidates)[0];
  return null;
}

function isValidTypeName(value) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(value || "").trim());
}

function isValidModuleName(value) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(value || "").trim());
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

async function askRequired(rl, label, validate) {
  while (true) {
    const value = (await rl.question(label)).trim();
    const error = validate ? validate(value) : value ? null : "Value is required.";
    if (!error) return value;
    output.write(`${error}\n`);
  }
}

async function askWithDefault(rl, label, defaultValue, validate) {
  while (true) {
    const raw = await rl.question(`${label}${defaultValue ? ` [${defaultValue}]` : ""}: `);
    const value = raw.trim() || String(defaultValue || "").trim();
    const error = validate ? validate(value) : value ? null : "Value is required.";
    if (!error) return value;
    output.write(`${error}\n`);
  }
}

async function askYesNo(rl, label, defaultYes = false) {
  const defaultLabel = defaultYes ? "Y/n" : "y/N";
  while (true) {
    const raw = (await rl.question(`${label} (${defaultLabel}): `)).trim().toLowerCase();
    if (!raw) return defaultYes;
    if (["y", "yes"].includes(raw)) return true;
    if (["n", "no"].includes(raw)) return false;
    output.write("Please answer y or n.\n");
  }
}

async function askModuleMoveCode(rl, moduleIndex) {
  const moveCode = await askMultilineRequired(rl, `Move code for module #${moduleIndex}:`);
  const normalizedMoveCode = `${normalizeNewlines(moveCode).trim()}\n`;

  const parsedModule = parseModuleName(normalizedMoveCode);
  let moduleName = parsedModule?.moduleName ?? "";

  if (parsedModule?.packageName && parsedModule.packageName !== "move_over") {
    output.write(
      `Warning: module address is '${parsedModule.packageName}' (expected 'move_over'). Saving anyway.\n`
    );
  }

  if (!moduleName) {
    output.write("Could not auto-detect module name from Move code.\n");
    moduleName = await askRequired(rl, "Module name (e.g. nebula_relay): ", (value) =>
      isValidModuleName(value) ? null : "Module name must be a valid Move identifier."
    );
  }

  return { moduleName, moveCode: normalizedMoveCode };
}

async function askMultilineOptional(rl, label) {
  const collectLinesUntilEnd = () =>
    new Promise((resolve) => {
      const lines = [];
      const onLine = (line) => {
        if (line.trim() === "END") {
          rl.off("line", onLine);
          rl.off("close", onClose);
          resolve(lines);
          return;
        }
        lines.push(line);
      };
      const onClose = () => {
        rl.off("line", onLine);
        rl.off("close", onClose);
        resolve(lines);
      };
      rl.on("line", onLine);
      rl.on("close", onClose);
    });

  output.write(`\n${label}\n`);
  output.write("Finish by entering a single line with END (or END alone to skip)\n");
  const lines = await collectLinesUntilEnd();
  const value = normalizeNewlines(lines.join("\n")).trim();
  return value;
}

async function askMultilineRequired(rl, label) {
  const collectLinesUntilEnd = () =>
    new Promise((resolve) => {
      const lines = [];
      const onLine = (line) => {
        if (line.trim() === "END") {
          rl.off("line", onLine);
          rl.off("close", onClose);
          resolve(lines);
          return;
        }
        lines.push(line);
      };
      const onClose = () => {
        rl.off("line", onLine);
        rl.off("close", onClose);
        resolve(lines);
      };
      rl.on("line", onLine);
      rl.on("close", onClose);
    });

  while (true) {
    output.write(`\n${label}\n`);
    output.write("Finish by entering a single line with END\n");
    const lines = await collectLinesUntilEnd();

    const value = normalizeNewlines(lines.join("\n")).trim();
    if (!value) {
      output.write(`${label} cannot be empty.\n`);
      continue;
    }

    if (!INTERACTIVE_TTY) return value;

    const lineCount = value.split("\n").length;
    const firstLine = value.split("\n")[0];
    output.write(`Captured ${lineCount} line${lineCount === 1 ? "" : "s"}.\n`);
    output.write(`First line: ${firstLine}\n`);
    const confirm = (await rl.question("Use this value? (Y/n): ")).trim().toLowerCase();
    if (!confirm || confirm === "y" || confirm === "yes") return value;
    output.write("Re-entering block input...\n");
  }
}

function printHelp() {
  output.write("Create a new level interactively.\n\n");
  output.write("Usage:\n");
  output.write("  node scripts/create-level.mjs\n\n");
  output.write("Prompts:\n");
  output.write("  - Name\n");
  output.write("  - Difficulty (easy|medium|hard)\n");
  output.write("  - Instructions (multiline, end with END)\n");
  output.write("  - Explanation (optional, shown after level is completed; end with END or leave empty)\n");
  output.write("  - One or more challenge module Move files (multiline each, end with END)\n");
  output.write("  - Primary module for runConfig (when multiple modules)\n");
}

async function run() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    return;
  }

  const rl = readline.createInterface({ input, output });
  let name = "";
  let difficulty = "";
  let instructions = "";
  let explanation = "";
  const moduleEntries = [];

  try {
    name = await askRequired(rl, "Level name: ", (value) =>
      value ? null : "Name is required."
    );
    difficulty = (
      await askRequired(rl, "Difficulty (easy/medium/hard): ", (value) => {
        if (!value) return "Difficulty is required.";
        return VALID_DIFFICULTIES.has(value.toLowerCase())
          ? null
          : "Difficulty must be one of: easy, medium, hard.";
      })
    ).toLowerCase();
    instructions = await askMultilineRequired(rl, "Instructions markdown:");

    if (INTERACTIVE_TTY) {
      output.write("\nExplanation (optional): shown after the level is completed, e.g. what vulnerability or concept this level demonstrates. Leave empty and press END to skip.\n");
      explanation = await askMultilineOptional(rl, "Explanation");
    }

    output.write("\nEnter one or more challenge modules for this level.\n");
    let moduleIndex = 1;
    while (true) {
      const moduleEntry = await askModuleMoveCode(rl, moduleIndex);
      if (moduleEntries.some((entry) => entry.moduleName === moduleEntry.moduleName)) {
        output.write(
          `Module '${moduleEntry.moduleName}' was already added for this level. Enter a different module.\n`
        );
        continue;
      }
      moduleEntries.push(moduleEntry);
      moduleIndex += 1;

      const addAnother = await askYesNo(rl, "Add another challenge module", false);
      if (!addAnother) break;
    }
  } finally {
    rl.close();
  }

  const moduleNames = moduleEntries.map((entry) => entry.moduleName);
  assert(moduleNames.length > 0, "At least one challenge module is required.");

  const metaConfigRaw = await fs.readFile(metaConfigPath, "utf8");
  const metaConfig = JSON.parse(metaConfigRaw);
  assert(Array.isArray(metaConfig), "meta.config.json must contain an array.");
  const existingModules = new Set(metaConfig.flatMap((entry) => levelModulesFromMetaEntry(entry)));
  for (const moduleName of moduleNames) {
    assert(
      !existingModules.has(moduleName),
      `Module '${moduleName}' already exists in meta.config.json.`
    );
  }
  const existingIds = new Set(metaConfig.map((entry) => String(entry?.id ?? "")));

  for (const moduleName of moduleNames) {
    const contractPath = path.join(contractsDir, `${moduleName}.move`);
    try {
      await fs.access(contractPath);
      throw new Error(`Contract file already exists: public/contracts/${moduleName}.move`);
    } catch (err) {
      if (!String(err?.message || "").includes("already exists") && err?.code !== "ENOENT") {
        throw err;
      }
      if (String(err?.message || "").includes("already exists")) throw err;
    }
  }

  let runModuleName = moduleNames[0];
  if (moduleNames.length > 1) {
    const pickModuleRl = readline.createInterface({ input, output });
    try {
      output.write(`\nModules detected: ${moduleNames.join(", ")}\n`);
      const autoPrimary =
        moduleEntries.find((entry) => parseFlagType(entry.moveCode, entry.moduleName))?.moduleName ||
        moduleNames[0];
      runModuleName = await askWithDefault(
        pickModuleRl,
        "Primary module for runConfig.module",
        autoPrimary,
        (value) => (moduleNames.includes(value) ? null : `Choose one of: ${moduleNames.join(", ")}`)
      );
    } finally {
      pickModuleRl.close();
    }
  }

  const runModuleEntry = moduleEntries.find((entry) => entry.moduleName === runModuleName);
  assert(runModuleEntry, `Primary run module '${runModuleName}' not found.`);

  const expectedTypeName = `${toPascalCase(runModuleName)}Flag`;
  let typeName = parseFlagType(runModuleEntry.moveCode, runModuleName);
  if (!typeName) {
    const fallbackRl = readline.createInterface({ input, output });
    try {
      output.write(
        `Could not auto-detect Flag type from '${runModuleName}'. Enter it manually (example: ${expectedTypeName}).\n`
      );
      typeName = await askRequired(fallbackRl, "Flag type name: ", (value) =>
        isValidTypeName(value) ? null : "Type name must be a valid Move identifier."
      );
    } finally {
      fallbackRl.close();
    }
  }

  // Slug = primary module name (already snake_case per Move identifier rules).
  const slug = runModuleName;
  assert(!existingIds.has(slug), `Level id '${slug}' already exists in meta.config.json.`);

  const runConfigRaw = await fs.readFile(runConfigPath, "utf8");
  const runConfigMap = parseRunConfigMap(runConfigRaw);
  runConfigMap[slug] = {
    module: runModuleName,
    typeName,
    solutionModule: `${slug}_solution`,
  };

  const enContentRaw = await fs.readFile(enContentPath, "utf8");
  const enContent = JSON.parse(enContentRaw);
  assert(enContent && typeof enContent === "object" && !Array.isArray(enContent), "Invalid en.json.");
  assert(!Object.prototype.hasOwnProperty.call(enContent, slug), `en.json already contains level ${slug}.`);

  await fs.mkdir(contractsDir, { recursive: true });
  for (const entry of moduleEntries) {
    const contractPath = path.join(contractsDir, `${entry.moduleName}.move`);
    await fs.writeFile(contractPath, entry.moveCode, "utf8");
  }

  metaConfig.push({
    id: slug,
    difficulty,
    module: runModuleName,
    modules: moduleNames,
  });
  await fs.writeFile(metaConfigPath, `${JSON.stringify(metaConfig, null, 2)}\n`, "utf8");

  const newRunConfig = renderRunConfigFile(runConfigMap);
  await fs.writeFile(runConfigPath, newRunConfig, "utf8");

  const levelEntry = {
    name,
    description: deriveDescription(name, instructions),
    instructions: normalizeNewlines(instructions),
  };
  if (explanation && explanation.trim()) {
    levelEntry.explanation = normalizeNewlines(explanation).trim();
  }
  enContent[slug] = levelEntry;
  await fs.writeFile(enContentPath, `${JSON.stringify(enContent, null, 2)}\n`, "utf8");

  const sync = spawnSync("node", [syncMetaScript], { cwd: root, stdio: "inherit" });
  if (sync.status !== 0) {
    throw new Error("Failed to sync meta.ts from public/contracts.");
  }

  output.write("\nLevel created successfully.\n");
  output.write(`- id (slug): ${slug}\n`);
  output.write(`- primary module: move_over::${runModuleName}\n`);
  output.write(`- modules: ${moduleNames.map((name) => `move_over::${name}`).join(", ")}\n`);
  output.write(`- typeName: ${typeName}\n`);
  for (const moduleName of moduleNames) {
    output.write(`- contract: public/contracts/${moduleName}.move\n`);
  }
  output.write(`- runConfig solutionModule: ${slug}_solution\n`);
}

run().catch((err) => {
  output.write(`\nError: ${String(err?.message || err)}\n`);
  process.exitCode = 1;
});
