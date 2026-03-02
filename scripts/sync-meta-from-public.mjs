import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "src", "data", "levels", "meta.config.json");
const contractsDir = path.join(root, "public", "contracts");
const metaPath = path.join(root, "src", "data", "levels", "meta.ts");

const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

function escapeTemplateLiteral(text) {
  return String(text)
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("${", "\\${");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
    const module = String(item?.module ?? "");

    assert(Number.isInteger(id) && id >= 0, `Invalid id in meta.config.json: ${String(item?.id)}`);
    assert(!seenIds.has(id), `Duplicate level id in meta.config.json: ${id}`);
    seenIds.add(id);

    assert(VALID_DIFFICULTIES.has(difficulty), `Invalid difficulty for level ${id}: ${difficulty}`);
    assert(/^[A-Za-z_][A-Za-z0-9_]*$/.test(module), `Invalid module for level ${id}: ${module}`);

    const contractPath = path.join(contractsDir, `${module}.move`);
    const contractRaw = await fs.readFile(contractPath, "utf8");
    const contractCode = contractRaw.replaceAll("\r\n", "\n").trimEnd();

    entries.push({ id, difficulty, module, contractCode });
  }

  entries.sort((a, b) => a.id - b.id);

  const levelBlocks = entries
    .map(
      ({ id, difficulty, contractCode }) => `  {
    id: ${id},
    difficulty: "${difficulty}",
    contractCode: \`${escapeTemplateLiteral(contractCode)}\`,
  },`
    )
    .join("\n");

  const output = `import type { Difficulty } from "./types";

export interface LevelMeta {
  id: number;
  difficulty: Difficulty;
  contractCode: string;
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

