# Contributing to Move-over CTF

Thanks for contributing. This doc explains how to extend the project so changes stay consistent and easy to maintain.

## Adding a new level

1. **Meta** (`src/data/levels/meta.ts`): Append one entry to the `LEVEL_META` array:
   - `id`: next index (e.g. after 18 use 19)
   - `difficulty`: `"easy"` | `"medium"` | `"hard"`
   - `contractCode`: full Sui Move module source (string)

2. **Content**: For **every** locale in `src/data/levels/content/`, add a key equal to the level id (e.g. `"19"`) with:
   - `name`: short title (e.g. "My Level")
   - `description`: one-line summary
   - `instructions`: markdown (objectives, story, code blocks if needed)

   Locales are: `en`, `es`, `pt`, `ja`, `zh-Hans`, `zh-Hant`, `fr`, `ru`, `ar`, `tr`, `uk`, `ko`.  
   Missing content for a locale falls back to English. See `src/data/levels/README.md` for the exact JSON shape.

3. **Done.** `LEVEL_IDS` and routes are derived from `LEVEL_META`; no other code changes needed.

## Adding a new locale

1. **Types** (`src/i18n/types.ts`): Add the locale code to the `Locale` union.

2. **Locale list** (`src/i18n/locales.ts`): Add the code to `VALID_LOCALES` and add a `{ code, label }` entry to `LOCALE_OPTIONS`.

3. **Messages** (`src/i18n/index.ts`): Import the new locale JSON and add it to the `messages` record.

4. **Level content** (`src/data/levels/index.ts`): Import the new `content/<locale>.json` and add it to `contentByLocale`.

5. **Level content file**: Create `src/data/levels/content/<locale>.json` with the same structure as `en.json` (all level ids with name, description, instructions). You can copy `en.json` and translate.

6. **i18n locale file**: Create `src/i18n/locales/<locale>.json` with the same keys as `en.json` (theme, header, landing, level, sidebar, seo). Copy from `en.json` and translate.

App name, cookie name, and base URL are in `src/config/constants.ts`; change them there if needed.

## Project layout

| Path | Purpose |
|------|--------|
| `src/config/` | App-wide constants (app name, cookie, base URL). Single source of truth. |
| `src/data/levels/` | Level meta (ids, difficulty, contract code) and per-locale content (name, description, instructions). |
| `src/i18n/` | Locale list, translation loader, and UI strings per locale. |
| `src/lib/` | Shared helpers (e.g. `parseModulePath`, code highlight styles). |
| `src/components/` | UI components; use `@/data/levels` for difficulty styles and level types. |

## Code style

- Use TypeScript; types are in `src/data/levels/types.ts` and `src/i18n/types.ts`.
- Import constants from `@/config` instead of hardcoding app name or cookie.
- For level UI (difficulty dots, badge), use `DIFFICULTY_DOTS`, `DIFFICULTY_TEXT_CLASS`, `DIFFICULTY_BADGE_CLASS` from `@/data/levels`.
- Contract module path: use `parseModulePath(contractCode)` from `@/lib/contractCode`.
