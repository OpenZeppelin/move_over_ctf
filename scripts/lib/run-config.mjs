/**
 * Shared helpers for reading and writing runConfig.ts.
 * Used by create-level.mjs and delete-level.mjs.
 */

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/**
 * Parse LEVEL_RUN_CONFIG from runConfig.ts file content.
 * @returns {Record<number, { module: string, typeName: string, solutionModule: string, cleanupFunction?: string }>}
 */
export function parseRunConfigMap(fileText) {
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

/**
 * Render runConfig.ts file content from a config map.
 * @param {Record<number, { module: string, typeName: string, solutionModule: string, cleanupFunction?: string }>} configMap
 * @returns {string}
 */
export function renderRunConfigFile(configMap) {
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
`;
}
