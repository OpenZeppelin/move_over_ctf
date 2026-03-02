import type { Locale } from "./types";

/** Re-export from config so i18n stays the single place for "locale" options; storage key lives in config. */
export { LOCALE_STORAGE_KEY } from "@/config";

/** All valid locale codes (for middleware and layout validation) */
export const VALID_LOCALES: Locale[] = [
  "en",
  "es",
  "pt",
  "ja",
  "zh-Hans",
  "zh-Hant",
  "fr",
  "ru",
  "ar",
  "tr",
  "uk",
  "ko",
];

/** Display label for each locale (native name) – used in the language dropdown */
export const LOCALE_OPTIONS: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "ja", label: "日本語" },
  { code: "zh-Hans", label: "简体中文" },
  { code: "zh-Hant", label: "正體中文" },
  { code: "fr", label: "Français" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "عربي" },
  { code: "tr", label: "Türkçe" },
  { code: "uk", label: "Українська" },
  { code: "ko", label: "한국어" },
];
