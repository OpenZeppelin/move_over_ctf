/**
 * App-wide constants. Single source of truth for app name, URLs, and storage keys.
 * Use these instead of magic strings for easier maintenance and consistency.
 */

/** App name (used in cookies, storage, SEO) */
const APP_NAME = "move-over";

/** Cookie name for persisting locale */
export const LOCALE_COOKIE = `${APP_NAME}-locale`;

/** localStorage key for locale */
export const LOCALE_STORAGE_KEY = `${APP_NAME}-locale`;

/** Base URL for canonical links and sitemap (set NEXT_PUBLIC_BASE_URL in production) */
export const BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BASE_URL) ||
  "https://move-over.vercel.app";
