import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "src", "data", "levels", "meta.config.json");
const contractsDir = path.join(root, "public", "contracts");
const metaPath = path.join(root, "src", "data", "levels", "meta.ts");

const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const MODULE_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function escapeTemplateLiteral(text) {
  return String(text)
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("${", "\\${");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeModulesForConfigEntry(item, id) {
  const primary = String(item?.module ?? "").trim();
  const rawModules = Array.isArray(item?.modules) ? item.modules : [];
  const modules = rawModules
    .map((moduleName) => String(moduleName ?? "").trim())
    .filter(Boolean);

  if (primary && !modules.includes(primary)) {
    modules.unshift(primary);
  }
  if (!modules.length) {
    assert(primary, `Missing module/modules for level ${id}`);
    modules.push(primary);
  }

  const uniqueModules = [...new Set(modules)];
  for (const moduleName of uniqueModules) {
    assert(
      MODULE_NAME_RE.test(moduleName),
      `Invalid module '${moduleName}' in meta.config.json for level ${id}`
    );
  }

  const primaryModule = primary && uniqueModules.includes(primary) ? primary : uniqueModules[0];
  return { primaryModule, modules: uniqueModules };
}

async function run() {
  const configRaw = await fs.readFile(configPath, "utf8");
  const config = JSON.parse(configRaw);
  assert(Array.isArray(config), "meta.config.json must be an array.");

  const seenIds = new Set();
  const entries = [];

  for (const item of config) {
    const id = Number(item?.id);
    const difficulty = String(item?.difficulty ?? "");

    assert(Number.isInteger(id) && id >= 0, `Invalid id in meta.config.json: ${String(item?.id)}`);
    assert(!seenIds.has(id), `Duplicate level id in meta.config.json: ${id}`);
    seenIds.add(id);

    assert(VALID_DIFFICULTIES.has(difficulty), `Invalid difficulty for level ${id}: ${difficulty}`);
    const { primaryModule, modules } = normalizeModulesForConfigEntry(item, id);

    const contractModules = [];
    for (const moduleName of modules) {
      const contractPath = path.join(contractsDir, `${moduleName}.move`);
      const contractRaw = await fs.readFile(contractPath, "utf8");
      const contractCode = contractRaw.replaceAll("\r\n", "\n").trimEnd();
      contractModules.push({ module: moduleName, contractCode });
    }

    const primaryContract =
      contractModules.find((mod) => mod.module === primaryModule) ?? contractModules[0];
    assert(primaryContract, `Missing contract code for level ${id}.`);

    entries.push({ id, difficulty, contractCode: primaryContract.contractCode, contractModules });
  }

  entries.sort((a, b) => a.id - b.id);

  const levelBlocks = entries
    .map(
      ({ id, difficulty, contractCode, contractModules }) => `  {
    id: ${id},
    difficulty: "${difficulty}",
    contractCode: \`${escapeTemplateLiteral(contractCode)}\`,
    contractModules: [
${contractModules
  .map(
    (mod) => `      {
        module: ${JSON.stringify(mod.module)},
        contractCode: \`${escapeTemplateLiteral(mod.contractCode)}\`,
      },`
  )
  .join("\n")}
    ],
  },`
    )
    .join("\n");

  const output = `import type { Difficulty } from "./types";

interface LevelMeta {
  id: number;
  difficulty: Difficulty;
  contractCode: string;
  contractModules: Array<{
    module: string;
    contractCode: string;
  }>;
}

export const LEVEL_META: LevelMeta[] = [
${levelBlocks}
];
`;

  await fs.writeFile(metaPath, output, "utf8");
  process.stdout.write(`Synced meta.ts from ${entries.length} public contract files\n`);
}

run().catch((err) => {
  process.stderr.write(`${String(err?.stack || err)}\n`);
  process.exitCode = 1;
});

