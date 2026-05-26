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
 * Canonical level ordering for the UI: easy → medium → hard, then by id
 * ascending within a difficulty. `id` stays the stable identifier (URLs,
 * progress storage); only the display position is derived.
 */
export function compareLevels(
  a: { id: number; difficulty: Difficulty },
  b: { id: number; difficulty: Difficulty }
): number {
  const byDifficulty = DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
  if (byDifficulty !== 0) return byDifficulty;
  return a.id - b.id;
}
