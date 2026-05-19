/**
 * Completion-card storage helpers — separate from level progress so the
 * completion experience (name, "modal seen" flag) stays self-contained.
 */

const COMPLETION_NAME_KEY = "move-over-ctf-completion-name";
const COMPLETION_ACKED_KEY = "move-over-ctf-completion-acked";

export function getCompletionName(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem(COMPLETION_NAME_KEY);
    return typeof raw === "string" ? raw : "";
  } catch {
    return "";
  }
}

export function setCompletionName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = name.trim().slice(0, 32);
    localStorage.setItem(COMPLETION_NAME_KEY, trimmed);
  } catch {
    // ignore
  }
}

/** True once the user has dismissed the completion modal. The dedicated page is still reachable. */
export function getCompletionAcknowledged(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(COMPLETION_ACKED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setCompletionAcknowledged(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMPLETION_ACKED_KEY, "1");
  } catch {
    // ignore
  }
}

/** 32-bit FNV-1a hash, returned as 8-char uppercase hex. Deterministic per name. */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").toUpperCase();
}

/** Ethereum-style stamp `0xABCD1234...EF567890` derived from the user's name. */
export function deriveStamp(name: string): string {
  const seed = name.trim() || "anonymous-explorer";
  const a = fnv1a(seed);
  const b = fnv1a(`${seed}::salt`);
  return `0x${a}...${b}`;
}

/** Hue in [0, 360) derived from the user's name — each player gets a unique accent colour. */
export function deriveHue(name: string): number {
  const seed = name.trim() || "anonymous-explorer";
  const hex = fnv1a(seed);
  return parseInt(hex, 16) % 360;
}
