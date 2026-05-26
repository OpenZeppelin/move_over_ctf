import metaConfig from "./meta.config.json";
import type { Difficulty } from "./types";

interface LevelProgressMeta {
  id: string;
  difficulty: Difficulty;
}

const rawEntries = metaConfig as Array<{ id: string; difficulty: Difficulty }>;

export const LEVEL_PROGRESS_META: LevelProgressMeta[] = rawEntries
  .map((entry) => ({
    id: String(entry.id),
    difficulty: entry.difficulty,
  }))
  .filter(
    (entry): entry is LevelProgressMeta =>
      typeof entry.id === "string" &&
      entry.id.length > 0 &&
      (entry.difficulty === "easy" || entry.difficulty === "medium" || entry.difficulty === "hard"),
  );
