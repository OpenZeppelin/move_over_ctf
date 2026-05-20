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

/** Base URL for canonical links and sitemap (override via NEXT_PUBLIC_BASE_URL) */
export const BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BASE_URL) ||
  "https://moveover.openzeppelin.com";

/**
 * Default social-share card image. Next.js does NOT merge `openGraph`/`twitter`
 * objects across layout/page metadata — child route metadata replaces them
 * wholesale — so every page's metadata must spread this in explicitly to keep
 * the unfurl card working on Slack/X/etc.
 */
export const SOCIAL_CARD_OG_IMAGES = [
  {
    url: "/card-preview.png",
    width: 1200,
    height: 671,
    alt: "Move-over CTF",
  },
] as const;

export const SOCIAL_CARD_TWITTER_IMAGES = ["/card-preview.png"] as const;
