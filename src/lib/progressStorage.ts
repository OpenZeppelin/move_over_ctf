const SOLVED_STORAGE_KEY = "move-over-ctf-solved";
const SOLUTIONS_STORAGE_KEY = "move-over-ctf-solutions";

export const LEVEL_SOLVED_EVENT = "move-over-ctf-solved";

export function getSolvedIdsFromStorage(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SOLVED_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is number => Number.isInteger(id)));
  } catch {
    return new Set();
  }
}

export function markLevelSolved(levelId: number): void {
  if (typeof window === "undefined") return;
  try {
    const solvedIds = getSolvedIdsFromStorage();
    solvedIds.add(levelId);
    localStorage.setItem(SOLVED_STORAGE_KEY, JSON.stringify([...solvedIds]));
    window.dispatchEvent(new CustomEvent(LEVEL_SOLVED_EVENT, { detail: levelId }));
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
