const SOLVED_STORAGE_KEY = "move-over-ctf-solved";
const HINT_REVEAL_STORAGE_KEY = "move-over-ctf-hints-revealed";
const LAST_LEVEL_STORAGE_KEY = "move-over-ctf-last-level";
const SOLUTIONS_STORAGE_KEY = "move-over-ctf-solutions";
const SLUG_MIGRATION_KEY = "move-over-ctf-slug-migration-v1";

export const LEVEL_SOLVED_EVENT = "move-over-ctf-solved";
export const PROGRESS_UPDATED_EVENT = "move-over-ctf-progress-updated";

/**
 * Map from the previous numeric ids to the current snake_case slug ids.
 * Object Chest (id 4) was removed before this migration; entries under that
 * key are dropped silently.
 */
const SLUG_BY_NUMERIC_ID: Record<string, string> = {
  "0": "artifact",
  "1": "coin_collector",
  "3": "sticky_treasure",
  "5": "flash_vault",
  "6": "pool_party",
  "7": "tick_tock",
  "8": "night_ledger",
  "9": "mailbox",
};

function isValidSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z][a-z0-9_]*$/.test(value);
}

function parseSlugSet(raw: unknown): Set<string> {
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter(isValidSlug));
}

/**
 * One-time migration: rekey any pre-existing numeric storage entries to the
 * current slug ids. Runs once per browser; idempotent.
 */
function migrateLegacyNumericKeysIfNeeded(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(SLUG_MIGRATION_KEY) === "1") return;

    // SOLVED_STORAGE_KEY: array of either numbers or strings.
    const solvedRaw = localStorage.getItem(SOLVED_STORAGE_KEY);
    if (solvedRaw) {
      try {
        const parsed = JSON.parse(solvedRaw);
        if (Array.isArray(parsed)) {
          const migrated = new Set<string>();
          for (const entry of parsed) {
            if (isValidSlug(entry)) {
              migrated.add(entry);
              continue;
            }
            const key = String(entry);
            const slug = SLUG_BY_NUMERIC_ID[key];
            if (slug) migrated.add(slug);
          }
          localStorage.setItem(SOLVED_STORAGE_KEY, JSON.stringify([...migrated]));
        }
      } catch {
        // ignore parse failure
      }
    }

    // SOLUTIONS_STORAGE_KEY: object keyed by id. Slug entries win over numeric
    // on collision (process slugs first, then fill numeric only if missing).
    const solutionsRaw = localStorage.getItem(SOLUTIONS_STORAGE_KEY);
    if (solutionsRaw) {
      try {
        const parsed = JSON.parse(solutionsRaw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const migrated: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(parsed)) {
            if (isValidSlug(key)) migrated[key] = value;
          }
          for (const [key, value] of Object.entries(parsed)) {
            if (isValidSlug(key)) continue;
            const slug = SLUG_BY_NUMERIC_ID[key];
            if (slug && !(slug in migrated)) migrated[slug] = value;
          }
          localStorage.setItem(SOLUTIONS_STORAGE_KEY, JSON.stringify(migrated));
        }
      } catch {
        // ignore
      }
    }

    // HINT_REVEAL_STORAGE_KEY: object keyed by id. Same slug-wins ordering.
    const hintsRaw = localStorage.getItem(HINT_REVEAL_STORAGE_KEY);
    if (hintsRaw) {
      try {
        const parsed = JSON.parse(hintsRaw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const migrated: Record<string, number> = {};
          for (const [key, value] of Object.entries(parsed)) {
            const asInt = Number(value);
            if (!Number.isInteger(asInt) || asInt < 0) continue;
            if (isValidSlug(key)) migrated[key] = asInt;
          }
          for (const [key, value] of Object.entries(parsed)) {
            const asInt = Number(value);
            if (!Number.isInteger(asInt) || asInt < 0) continue;
            if (isValidSlug(key)) continue;
            const slug = SLUG_BY_NUMERIC_ID[key];
            if (slug && !(slug in migrated)) migrated[slug] = asInt;
          }
          localStorage.setItem(HINT_REVEAL_STORAGE_KEY, JSON.stringify(migrated));
        }
      } catch {
        // ignore
      }
    }

    // LAST_LEVEL_STORAGE_KEY: single value.
    const lastRaw = localStorage.getItem(LAST_LEVEL_STORAGE_KEY);
    if (lastRaw && !isValidSlug(lastRaw)) {
      const slug = SLUG_BY_NUMERIC_ID[lastRaw];
      if (slug) {
        localStorage.setItem(LAST_LEVEL_STORAGE_KEY, slug);
      } else {
        localStorage.removeItem(LAST_LEVEL_STORAGE_KEY);
      }
    }

    localStorage.setItem(SLUG_MIGRATION_KEY, "1");
  } catch {
    // ignore storage failures
  }
}

function dispatchProgressUpdated(detail?: unknown): void {
  if (typeof window === "undefined") return;
  queueMicrotask(() => {
    window.dispatchEvent(new CustomEvent(PROGRESS_UPDATED_EVENT, { detail }));
  });
}

function getHintRevealMapFromStorage(): Record<string, number> {
  if (typeof window === "undefined") return {};
  migrateLegacyNumericKeysIfNeeded();
  try {
    const raw = localStorage.getItem(HINT_REVEAL_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const sanitized: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const asInt = Number(value);
      if (Number.isInteger(asInt) && asInt >= 0) {
        sanitized[key] = asInt;
      }
    }
    return sanitized;
  } catch {
    return {};
  }
}

export function getSolvedIdsFromStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  migrateLegacyNumericKeysIfNeeded();
  try {
    const raw = localStorage.getItem(SOLVED_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return parseSlugSet(parsed);
  } catch {
    return new Set();
  }
}

export function markLevelSolved(levelId: string): void {
  if (typeof window === "undefined") return;
  if (!isValidSlug(levelId)) return;
  try {
    const solvedIds = getSolvedIdsFromStorage();
    solvedIds.add(levelId);
    localStorage.setItem(SOLVED_STORAGE_KEY, JSON.stringify([...solvedIds]));

    window.dispatchEvent(new CustomEvent(LEVEL_SOLVED_EVENT, { detail: levelId }));
    dispatchProgressUpdated({ type: "solved", levelId });
  } catch {
    // ignore
  }
}

export function getRevealedHintCountForLevel(levelId: string): number {
  if (typeof window === "undefined") return 0;
  if (!isValidSlug(levelId)) return 0;
  const hints = getHintRevealMapFromStorage();
  const value = hints[levelId];
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

export function setRevealedHintCountForLevel(levelId: string, count: number): void {
  if (typeof window === "undefined") return;
  if (!isValidSlug(levelId)) return;
  const safeCount = Number.isInteger(count) && count >= 0 ? count : 0;
  try {
    const hintMap = getHintRevealMapFromStorage();
    hintMap[levelId] = safeCount;
    localStorage.setItem(HINT_REVEAL_STORAGE_KEY, JSON.stringify(hintMap));
    dispatchProgressUpdated({ type: "hint", levelId, count: safeCount });
  } catch {
    // ignore
  }
}

export function setLastVisitedLevel(levelId: string): void {
  if (typeof window === "undefined") return;
  if (!isValidSlug(levelId)) return;
  try {
    migrateLegacyNumericKeysIfNeeded();
    const current = localStorage.getItem(LAST_LEVEL_STORAGE_KEY);
    if (current === levelId) return;
    localStorage.setItem(LAST_LEVEL_STORAGE_KEY, levelId);
    dispatchProgressUpdated({ type: "last-visited", levelId });
  } catch {
    // ignore
  }
}

export function getSolutionForLevel(levelId: string): string {
  if (typeof window === "undefined") return "";
  if (!isValidSlug(levelId)) return "";
  migrateLegacyNumericKeysIfNeeded();
  try {
    const raw = localStorage.getItem(SOLUTIONS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    if (!parsed || typeof parsed !== "object") return "";
    const value = (parsed as Record<string, unknown>)[levelId];
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

export function saveSolutionForLevel(levelId: string, solution: string): void {
  if (typeof window === "undefined") return;
  if (!isValidSlug(levelId)) return;
  try {
    migrateLegacyNumericKeysIfNeeded();
    const raw = localStorage.getItem(SOLUTIONS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    const solutions =
      parsed && typeof parsed === "object" ? { ...(parsed as Record<string, unknown>) } : {};
    solutions[levelId] = solution;
    localStorage.setItem(SOLUTIONS_STORAGE_KEY, JSON.stringify(solutions));
  } catch {
    // ignore
  }
}
