import type { Locale, TranslationKey, Translations } from "./types";
import en from "./locales/en.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";
import ja from "./locales/ja.json";
import zhHans from "./locales/zh-Hans.json";
import zhHant from "./locales/zh-Hant.json";
import fr from "./locales/fr.json";
import ru from "./locales/ru.json";
import ar from "./locales/ar.json";
import tr from "./locales/tr.json";
import uk from "./locales/uk.json";
import ko from "./locales/ko.json";

const messages: Record<Locale, Translations> = {
  en: en as Translations,
  es: es as Translations,
  pt: pt as Translations,
  ja: ja as Translations,
  "zh-Hans": zhHans as Translations,
  "zh-Hant": zhHant as Translations,
  fr: fr as Translations,
  ru: ru as Translations,
  ar: ar as Translations,
  tr: tr as Translations,
  uk: uk as Translations,
  ko: ko as Translations,
};

function getNested(obj: object, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
  return typeof value === "string" ? value : undefined;
}

/**
 * Get a type-safe translation function for a given locale.
 * Use in server components or when locale is known.
 */
export function getTranslations(locale: Locale) {
  const dict = messages[locale] ?? messages.en;
  return function t(key: TranslationKey): string {
    const value = getNested(dict, key);
    if (value !== undefined) return value;
    return (getNested(messages.en, key) as string) ?? key;
  };
}

export type { Locale, TranslationKey, Translations };
export { messages };
