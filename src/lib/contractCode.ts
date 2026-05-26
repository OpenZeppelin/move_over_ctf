/**
 * Helpers for contract code display (e.g. extracting module path for UI).
 * Keeps parsing logic in one place for consistency and testability.
 */

const MODULE_REGEX = /module\s+(\S+)/;

/**
 * Extract the module path from the first line of Move contract code.
 * Example: "module move_over::artifact;" => "move_over::artifact"
 */
export function parseModulePath(contractCode: string): string {
  const firstLine = contractCode.trim().split("\n")[0];
  const match = firstLine?.match(MODULE_REGEX);
  const raw = match?.[1] ?? "move_over::contract";
  return raw.replace(/[;{]+$/, "");
}
