const SOLVED_STORAGE_KEY = "move-over-ctf-solved";
const NO_HINT_SOLVED_STORAGE_KEY = "move-over-ctf-no-hint-solved";
const HINT_REVEAL_STORAGE_KEY = "move-over-ctf-hints-revealed";
const LAST_LEVEL_STORAGE_KEY = "move-over-ctf-last-level";
const SOLUTIONS_STORAGE_KEY = "move-over-ctf-solutions";

export const LEVEL_SOLVED_EVENT = "move-over-ctf-solved";
export const PROGRESS_UPDATED_EVENT = "move-over-ctf-progress-updated";

function parseIntegerSet(raw: unknown): Set<number> {
  if (!Array.isArray(raw)) return new Set();
  return new Set(
    raw.filter((value): value is number => Number.isInteger(value) && value >= 0),
  );
}

function dispatchProgressUpdated(detail?: unknown): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROGRESS_UPDATED_EVENT, { detail }));
}

function getHintRevealMapFromStorage(): Record<string, number> {
  if (typeof window === "undefined") return {};
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

export function getSolvedIdsFromStorage(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SOLVED_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return parseIntegerSet(parsed);
  } catch {
    return new Set();
  }
}

export function getNoHintSolvedIdsFromStorage(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(NO_HINT_SOLVED_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return parseIntegerSet(parsed);
  } catch {
    return new Set();
  }
}

export function markLevelSolved(levelId: number, options?: { usedHint?: boolean }): void {
  if (typeof window === "undefined") return;
  if (!Number.isInteger(levelId) || levelId < 0) return;
  try {
    const solvedIds = getSolvedIdsFromStorage();
    solvedIds.add(levelId);
    localStorage.setItem(SOLVED_STORAGE_KEY, JSON.stringify([...solvedIds]));

    if (!options?.usedHint) {
      const noHintSolvedIds = getNoHintSolvedIdsFromStorage();
      noHintSolvedIds.add(levelId);
      localStorage.setItem(NO_HINT_SOLVED_STORAGE_KEY, JSON.stringify([...noHintSolvedIds]));
    }

    window.dispatchEvent(new CustomEvent(LEVEL_SOLVED_EVENT, { detail: levelId }));
    dispatchProgressUpdated({ type: "solved", levelId, usedHint: Boolean(options?.usedHint) });
  } catch {
    // ignore
  }
}

export function getRevealedHintCountForLevel(levelId: number): number {
  if (typeof window === "undefined") return 0;
  if (!Number.isInteger(levelId) || levelId < 0) return 0;
  const hints = getHintRevealMapFromStorage();
  const value = hints[String(levelId)];
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

export function getHintViewedIdsFromStorage(): Set<number> {
  const hintMap = getHintRevealMapFromStorage();
  const ids = Object.entries(hintMap)
    .filter(([, count]) => Number.isInteger(count) && count > 0)
    .map(([id]) => Number(id))
    .filter((id) => Number.isInteger(id) && id >= 0);
  return new Set(ids);
}

export function setRevealedHintCountForLevel(levelId: number, count: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isInteger(levelId) || levelId < 0) return;
  const safeCount = Number.isInteger(count) && count >= 0 ? count : 0;
  try {
    const hintMap = getHintRevealMapFromStorage();
    hintMap[String(levelId)] = safeCount;
    localStorage.setItem(HINT_REVEAL_STORAGE_KEY, JSON.stringify(hintMap));
    dispatchProgressUpdated({ type: "hint", levelId, count: safeCount });
  } catch {
    // ignore
  }
}

export function getLastVisitedLevelFromStorage(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_LEVEL_STORAGE_KEY);
    if (raw == null) return null;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function setLastVisitedLevel(levelId: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isInteger(levelId) || levelId < 0) return;
  try {
    const current = getLastVisitedLevelFromStorage();
    if (current === levelId) return;
    localStorage.setItem(LAST_LEVEL_STORAGE_KEY, String(levelId));
    dispatchProgressUpdated({ type: "last-visited", levelId });
  } catch {
    // ignore
  }
}

export function getSolutionForLevel(levelId: number): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem(SOLUTIONS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    if (!parsed || typeof parsed !== "object") return "";
    const value = (parsed as Record<string, unknown>)[String(levelId)];
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

export function saveSolutionForLevel(levelId: number, solution: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(SOLUTIONS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    const solutions =
      parsed && typeof parsed === "object" ? { ...(parsed as Record<string, unknown>) } : {};
    solutions[String(levelId)] = solution;
    localStorage.setItem(SOLUTIONS_STORAGE_KEY, JSON.stringify(solutions));
  } catch {
    // ignore
  }
}
