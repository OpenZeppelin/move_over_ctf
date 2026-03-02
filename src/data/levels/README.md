# Level content (translatable, extendable)

For the full end-to-end level workflow (Move source + tests + web wiring), start with:
- `LEVEL_AUTHORING_GUIDE.md`

## Adding a new level

1. **Define meta** in `meta.ts`: add an entry to `LEVEL_META` with `id`, `difficulty`, and `contractCode`.
2. **Add content per locale**: in each `content/<locale>.json` (e.g. `content/en.json`), add a key equal to the level id (e.g. `"4"`) with:
   - `name`: short title
   - `description`: one-line summary (used in lists and SEO)
   - `instructions`: markdown body (objectives, hints, etc.)

Example for level 4 in `content/en.json`:

```json
"4": {
  "name": "My Level",
  "description": "Short description.",
  "instructions": "# Level 4: My Level\n\n..."
}
```

Copy the same structure into every other `content/<locale>.json` and translate. Missing keys for a locale fall back to English.

## File roles

- **`meta.ts`** – Level ids, difficulty, and contract code (same for all locales).
- **`content/<locale>.json`** – Translated name, description, and instructions per level.
- **`types.ts`** – `Level`, `LevelContent`, `Difficulty`.
- **`index.ts`** – `getLevels(locale)`, `getLevel(locale, id)`, `LEVEL_IDS`, re-exports.

## Contract code

Contract code is not translated; it lives in `meta.ts` only. Only name, description, and instructions are localized.
