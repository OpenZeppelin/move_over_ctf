import type { Locale } from "@/i18n/types";
import { LEVEL_META } from "./meta";
import type { Level, LevelContent } from "./types";
import enContent from "./content/en.json";
import esContent from "./content/es.json";
import ptContent from "./content/pt.json";
import jaContent from "./content/ja.json";
import zhHansContent from "./content/zh-Hans.json";
import zhHantContent from "./content/zh-Hant.json";
import frContent from "./content/fr.json";
import ruContent from "./content/ru.json";
import arContent from "./content/ar.json";
import trContent from "./content/tr.json";
import ukContent from "./content/uk.json";
import koContent from "./content/ko.json";

/** One entry per Locale; when adding a locale, add import + key here and create content/<locale>.json */
const contentByLocale: Record<Locale, Record<string, LevelContent>> = {
  en: enContent as Record<string, LevelContent>,
  es: esContent as Record<string, LevelContent>,
  pt: ptContent as Record<string, LevelContent>,
  ja: jaContent as Record<string, LevelContent>,
  "zh-Hans": zhHansContent as Record<string, LevelContent>,
  "zh-Hant": zhHantContent as Record<string, LevelContent>,
  fr: frContent as Record<string, LevelContent>,
  ru: ruContent as Record<string, LevelContent>,
  ar: arContent as Record<string, LevelContent>,
  tr: trContent as Record<string, LevelContent>,
  uk: ukContent as Record<string, LevelContent>,
  ko: koContent as Record<string, LevelContent>,
};

/**
 * Get all levels with translated content for a locale.
 * Falls back to English if a level is missing in the locale.
 */
export function getLevels(locale: Locale): Level[] {
  const content = contentByLocale[locale] ?? contentByLocale.en;
  const fallback = contentByLocale.en;
  return LEVEL_META.map((meta) => {
    const localeEntry = content[String(meta.id)];
    const fallbackEntry = fallback[String(meta.id)];
    if (!fallbackEntry) throw new Error(`Missing fallback level content for level ${meta.id}`);
    const c = {
      ...fallbackEntry,
      ...(localeEntry ?? {}),
    };
    if (!c.name || !c.description || !c.instructions) {
      throw new Error(`Missing level content for level ${meta.id} and locale ${locale}`);
    }
    return {
      ...meta,
      name: c.name,
      description: c.description,
      instructions: c.instructions,
      explanation: typeof c.explanation === "string" && c.explanation.trim() ? c.explanation.trim() : undefined,
      author: c.author,
      hints: Array.isArray(c.hints)
        ? c.hints
            .map((hint) => String(hint).trim())
            .filter((hint) => hint.length > 0)
        : [],
    };
  });
}

/**
 * Get a single level by id and locale. Returns null if id is invalid.
 */
export function getLevel(locale: Locale, id: number): Level | null {
  const levels = getLevels(locale);
  return levels.find((l) => l.id === id) ?? null;
}

/** Level ids in order (for generateStaticParams, sitemap, etc.) */
export const LEVEL_IDS = LEVEL_META.map((m) => m.id);

export type { Level };
export { DIFFICULTY_DOTS, DIFFICULTY_TEXT_CLASS, DIFFICULTY_BADGE_CLASS } from "./difficulty";
export { LEVEL_RUN_CONFIG } from "./runConfig";
export type { LevelRunConfig } from "./runConfig";