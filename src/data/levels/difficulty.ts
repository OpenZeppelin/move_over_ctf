import type { Difficulty } from "./types";

/** Number of dots to show per difficulty (sidebar) */
export const DIFFICULTY_DOTS: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/** Tailwind classes for difficulty text color (sidebar dots) */
export const DIFFICULTY_TEXT_CLASS: Record<Difficulty, string> = {
  easy: "text-move-success",
  medium: "text-move-warning",
  hard: "text-red-400",
};

/** Tailwind classes for difficulty badge (level header pill) */
export const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  easy: "bg-move-success/20 text-move-success",
  medium: "bg-move-warning/20 text-move-warning",
  hard: "bg-red-500/20 text-red-400",
};
