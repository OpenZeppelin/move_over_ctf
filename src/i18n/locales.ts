import type { Locale } from "./types";

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

/** Fallback locale used when route params are invalid. */
export const DEFAULT_LOCALE: Locale = "en";

const localeSet = new Set<Locale>(VALID_LOCALES);

export function isValidLocale(locale: string): locale is Locale {
  return localeSet.has(locale as Locale);
}

export function getSafeLocale(locale: string): Locale {
  return isValidLocale(locale) ? locale : DEFAULT_LOCALE;
}

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
