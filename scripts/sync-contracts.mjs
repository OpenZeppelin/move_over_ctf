import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "move_over", "sources");
const contractsDir = path.join(root, "public", "contracts");
const solutionsDir = path.join(root, "public", "solutions");

const isMoveFile = (name) => name.endsWith(".move");
const isSolutionModuleFile = (name) => /^level_\d+_solution\.move$/i.test(name);

async function run() {
  await fs.mkdir(contractsDir, { recursive: true });
  await fs.mkdir(solutionsDir, { recursive: true });

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const contractFilesToCopy = entries
    .filter((entry) => entry.isFile() && isMoveFile(entry.name) && !isSolutionModuleFile(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
  const solutionFilesToCopy = entries
    .filter((entry) => entry.isFile() && isMoveFile(entry.name) && isSolutionModuleFile(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const desiredContractNames = new Set(contractFilesToCopy);
  const desiredSolutionNames = new Set(solutionFilesToCopy);

  for (const fileName of contractFilesToCopy) {
    const src = path.join(sourceDir, fileName);
    const dst = path.join(contractsDir, fileName);
    const data = await fs.readFile(src, "utf8");
    await fs.writeFile(dst, data, "utf8");
  }

  for (const fileName of solutionFilesToCopy) {
    const src = path.join(sourceDir, fileName);
    const dst = path.join(solutionsDir, fileName);
    const data = await fs.readFile(src, "utf8");
    await fs.writeFile(dst, data, "utf8");
  }

  const existingContracts = await fs.readdir(contractsDir, { withFileTypes: true });
  for (const entry of existingContracts) {
    if (!entry.isFile() || !isMoveFile(entry.name)) continue;
    if (desiredContractNames.has(entry.name)) continue;
    await fs.unlink(path.join(contractsDir, entry.name));
  }

  const existingSolutions = await fs.readdir(solutionsDir, { withFileTypes: true });
  for (const entry of existingSolutions) {
    if (!entry.isFile() || !isMoveFile(entry.name)) continue;
    if (desiredSolutionNames.has(entry.name)) continue;
    await fs.unlink(path.join(solutionsDir, entry.name));
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    contracts: {
      count: contractFilesToCopy.length,
      files: contractFilesToCopy,
    },
    solutions: {
      count: solutionFilesToCopy.length,
      files: solutionFilesToCopy,
    },
  };
  await fs.writeFile(path.join(contractsDir, "_manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  process.stdout.write(
    `Synced ${contractFilesToCopy.length} contract and ${solutionFilesToCopy.length} solution Move files\n`
  );
}

run().catch((err) => {
  process.stderr.write(`${String(err && err.stack ? err.stack : err)}\n`);
  process.exitCode = 1;
});

