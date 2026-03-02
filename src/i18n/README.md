# Translations (i18n)

- **Locales:** Add or edit JSON files in `locales/` (e.g. `en.json`, `es.json`). Each file must have the same structure as `en.json` (TypeScript type `Translations` in `types.ts`).
- **Types:** `TranslationKey` is derived from `en.json`, so new keys get autocomplete and type errors if a locale is missing a key.
- **Usage:** In client components use `useLocale()` from `@/contexts/LocaleContext` and call `t("theme.toggleToDark")`. For server components use `getTranslations(locale)` from `@/i18n`.
- **SEO:** The `seo` keys (`defaultTitle`, `defaultDescription`, `ogTitle`, `ogDescription`, `levelTitle`, `siteName`) are used for per-locale metadata in `app/[locale]/layout.tsx` and level pages. Use `replaceTemplate(t("seo.levelTitle"), { id, name })` from `@/i18n/utils` for templates with `{id}`, `{name}`, etc.
- **Adding a locale:** 1) Add `locales/xx.json` with the same keys as `en.json`. 2) Add `"xx"` to the `Locale` type in `types.ts` and to `VALID_LOCALES` and `LOCALE_OPTIONS` in `locales.ts`. 3) Import and add to `messages` in `index.ts`. 4) Add level content in `data/levels/content/xx.json`.
