import en from "./locales/en.json";

/** Flattened key paths for type-safe translation keys (leaf keys only, e.g. "theme.label", "header.connectWallet") */
export type NestedKeyOf<T, Prefix extends string = ""> = T extends object
  ? Extract<
      {
        [K in keyof T]: K extends string
          ? T[K] extends object
            ? NestedKeyOf<T[K], `${Prefix}${K}.`>
            : `${Prefix}${K}`
          : never;
      }[keyof T],
      string
    >
  : never;

/** All translation keys derived from the default (en) locale */
export type TranslationKey = NestedKeyOf<typeof en>;

/** Supported locale codes */
export type Locale =
  | "en"
  | "es"
  | "pt"
  | "ja"
  | "zh-Hans"
  | "zh-Hant"
  | "fr"
  | "ru"
  | "ar"
  | "tr"
  | "uk"
  | "ko";

/** Shape of a locale file – other locales must satisfy this */
export type Translations = typeof en;
