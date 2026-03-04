import metaConfig from "./meta.config.json";
import type { Difficulty } from "./types";

export interface LevelProgressMeta {
  id: number;
  difficulty: Difficulty;
}

const rawEntries = metaConfig as Array<{ id: number; difficulty: Difficulty }>;

export const LEVEL_PROGRESS_META: LevelProgressMeta[] = rawEntries
  .map((entry) => ({
    id: Number(entry.id),
    difficulty: entry.difficulty,
  }))
  .filter(
    (entry): entry is LevelProgressMeta =>
      Number.isInteger(entry.id) &&
      entry.id >= 0 &&
      (entry.difficulty === "easy" || entry.difficulty === "medium" || entry.difficulty === "hard"),
  )
  .sort((a, b) => a.id - b.id);
