import type { Difficulty } from "./types";

/** Number of dots to show per difficulty (sidebar) */
export const DIFFICULTY_DOTS: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/** Tailwind classes for difficulty text color (sidebar dots) */
export const DIFFICULTY_TEXT_CLASS: Record<Difficulty, string> = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-red-400",
};

/** Tailwind classes for difficulty badge (level header pill) */
export const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  easy: "bg-success/20 text-success",
  medium: "bg-warning/20 text-warning",
  hard: "bg-red-500/20 text-red-400",
};

/** Display rank: easy < medium < hard. Used to sort levels for the UI. */
export const DIFFICULTY_RANK: Record<Difficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

/**
 * Canonical level ordering for the UI: easy → medium → hard. Within a
 * difficulty, insertion order in `meta.config.json` is preserved (JS sort is
 * stable). `id` is the slug used in URLs and storage; display position is
 * derived from the sorted index.
 */
export function compareLevels(
  a: { difficulty: Difficulty },
  b: { difficulty: Difficulty }
): number {
  return DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
}
