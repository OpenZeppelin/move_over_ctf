/**
 * Limits for the public run-level API to prevent spam and cap computation.
 * In-memory state is per-instance; for multi-instance deploys consider Redis (e.g. Upstash).
 */

/** Max size of the solution code body (bytes, UTF-8). Rejects oversized payloads. */
export const MAX_CODE_BYTES = 4 * 1024; // 4 KB

/** Max runs per IP per window. */
export const RATE_LIMIT_REQUESTS = 1;

/** Rate limit window in ms. */
export const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/** Max concurrent runs across all clients (per server instance). */
export const MAX_CONCURRENT_RUNS = 3;

/** Max runs per hour across all IPs (per server instance). Caps damage from many bots. */
export const GLOBAL_RUNS_PER_HOUR = 200;

/** Get client IP from request (supports proxies). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "anonymous";
}

type RateLimitEntry = { count: number; resetAt: number };
const rateLimitMap = new Map<string, RateLimitEntry>();

function pruneRateLimitMap(now: number): void {
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) rateLimitMap.delete(key);
  }
}

/**
 * Returns true if the request is allowed under rate limit; false if over limit.
 * Call this before starting work.
 */
export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  pruneRateLimitMap(now);

  const entry = rateLimitMap.get(ip);
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  if (now >= entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
    return { allowed: true };
  }
  if (entry.count >= RATE_LIMIT_REQUESTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }
  entry.count += 1;
  return { allowed: true };
}

/** Semaphore for concurrent runs. */
let concurrentRuns = 0;

export function tryAcquireRun(): boolean {
  if (concurrentRuns >= MAX_CONCURRENT_RUNS) return false;
  concurrentRuns += 1;
  return true;
}

export function releaseRun(): void {
  concurrentRuns = Math.max(0, concurrentRuns - 1);
}

/** Global run count for the current hour (resets each hour). Per-instance. */
let globalRunCount = 0;
let lastGlobalResetHour = Math.floor(Date.now() / (60 * 60 * 1000));

/**
 * Returns true if under the global runs-per-hour cap and consumes one run.
 * Call after tryAcquireRun(); if false, call releaseRun() and return 429.
 */
export function checkAndConsumeGlobalRunLimit(): boolean {
  const now = Date.now();
  const currentHour = Math.floor(now / (60 * 60 * 1000));
  if (currentHour > lastGlobalResetHour) {
    lastGlobalResetHour = currentHour;
    globalRunCount = 0;
  }
  if (globalRunCount >= GLOBAL_RUNS_PER_HOUR) return false;
  globalRunCount += 1;
  return true;
}
