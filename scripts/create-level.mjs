import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

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

async function askRequired(rl, label, validate) {
  while (true) {
    const value = (await rl.question(label)).trim();
    const error = validate ? validate(value) : value ? null : "Value is required.";
    if (!error) return value;
    output.write(`${error}\n`);
  }
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
  output.write("  - Move code (multiline, end with END)\n");
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
  let moveCode = "";

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
    moveCode = await askMultilineRequired(rl, "Move code:");
  } finally {
    rl.close();
  }

  const normalizedMoveCode = `${normalizeNewlines(moveCode).trim()}\n`;

  const parsedModule = parseModuleName(normalizedMoveCode);
  let moduleName = parsedModule?.moduleName ?? "";
  if (parsedModule?.packageName && parsedModule.packageName !== "move_over") {
    output.write(
      `Warning: module address is '${parsedModule.packageName}' (expected 'move_over'). Saving anyway.\n`
    );
  }
  if (!moduleName) {
    const moduleRl = readline.createInterface({ input, output });
    try {
      output.write("Could not auto-detect module name from Move code.\n");
      moduleName = await askRequired(moduleRl, "Module name (e.g. nebula_relay): ", (value) =>
        isValidModuleName(value) ? null : "Module name must be a valid Move identifier."
      );
    } finally {
      moduleRl.close();
    }
  }

  const expectedTypeName = `${toPascalCase(moduleName)}Flag`;
  let typeName = parseFlagType(normalizedMoveCode, moduleName);
  if (!typeName) {
    const fallbackRl = readline.createInterface({ input, output });
    try {
      output.write(
        `Could not auto-detect Flag type. Enter it manually (example: ${expectedTypeName}).\n`
      );
      typeName = await askRequired(fallbackRl, "Flag type name: ", (value) =>
        isValidTypeName(value) ? null : "Type name must be a valid Move identifier."
      );
    } finally {
      fallbackRl.close();
    }
  }

  const metaConfigRaw = await fs.readFile(metaConfigPath, "utf8");
  const metaConfig = JSON.parse(metaConfigRaw);
  assert(Array.isArray(metaConfig), "meta.config.json must contain an array.");
  assert(
    !metaConfig.some((entry) => String(entry?.module ?? "") === moduleName),
    `Module '${moduleName}' already exists in meta.config.json.`
  );
  const nextId =
    metaConfig.reduce((maxId, entry) => Math.max(maxId, Number(entry?.id ?? -1)), -1) + 1;

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

  const runConfigRaw = await fs.readFile(runConfigPath, "utf8");
  const runConfigMap = parseRunConfigMap(runConfigRaw);
  runConfigMap[nextId] = {
    module: moduleName,
    typeName,
    solutionModule: `level_${nextId}_solution`,
  };

  const enContentRaw = await fs.readFile(enContentPath, "utf8");
  const enContent = JSON.parse(enContentRaw);
  assert(enContent && typeof enContent === "object" && !Array.isArray(enContent), "Invalid en.json.");
  assert(!Object.prototype.hasOwnProperty.call(enContent, String(nextId)), `en.json already contains level ${nextId}.`);

  await fs.mkdir(contractsDir, { recursive: true });
  await fs.writeFile(contractPath, normalizedMoveCode, "utf8");

  metaConfig.push({
    id: nextId,
    difficulty,
    module: moduleName,
  });
  metaConfig.sort((a, b) => Number(a.id) - Number(b.id));
  await fs.writeFile(metaConfigPath, `${JSON.stringify(metaConfig, null, 2)}\n`, "utf8");

  const newRunConfig = renderRunConfigFile(runConfigMap);
  await fs.writeFile(runConfigPath, newRunConfig, "utf8");

  enContent[String(nextId)] = {
    name,
    description: deriveDescription(name, instructions),
    instructions: normalizeNewlines(instructions),
  };
  const sortedContent = Object.fromEntries(
    Object.entries(enContent).sort((a, b) => Number(a[0]) - Number(b[0]))
  );
  await fs.writeFile(enContentPath, `${JSON.stringify(sortedContent, null, 2)}\n`, "utf8");

  const sync = spawnSync("node", [syncMetaScript], { cwd: root, stdio: "inherit" });
  if (sync.status !== 0) {
    throw new Error("Failed to sync meta.ts from public/contracts.");
  }

  output.write("\nLevel created successfully.\n");
  output.write(`- id: ${nextId}\n`);
  output.write(`- module: move_over::${moduleName}\n`);
  output.write(`- typeName: ${typeName}\n`);
  output.write(`- contract: public/contracts/${moduleName}.move\n`);
  output.write(`- runConfig solutionModule: level_${nextId}_solution\n`);
}

run().catch((err) => {
  output.write(`\nError: ${String(err?.message || err)}\n`);
  process.exitCode = 1;
});
