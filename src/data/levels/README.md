# Level content (translatable, extendable)

For the full end-to-end level workflow (Move source + web wiring), start with:
- `ADD_LEVEL_README.md` (repo root)

## Adding a new level

1. **Define meta** in `meta.config.json`: add an entry with `id`, `difficulty`, and `module` mapping (`meta.ts` is generated).
2. **Add content per locale**: in each `content/<locale>.json` (e.g. `content/en.json`), add a key equal to the level id (e.g. `"4"`) with:
   - `name`: short title
   - `description`: one-line summary (used in lists and SEO)
   - `instructions`: markdown body (objectives, challenge context, exploit goals)
   - `author` (optional): challenge author info (`name` + GitHub profile URL)
   - `hints` (optional): ordered list of hint strings, revealed one by one in UI

Example for level 4 in `content/en.json`:

```json
"4": {
  "name": "My Level",
  "description": "Short description.",
  "instructions": "# Level 4: My Level\n\n...",
  "author": {
    "name": "OpenZeppelin",
    "github": "https://github.com/OpenZeppelin"
  },
  "hints": [
    "Hint 1",
    "Hint 2"
  ]
}
```

Copy the same structure into every other `content/<locale>.json` and translate. Missing keys for a locale fall back to English.

## File roles

- **`meta.config.json`** – Source config for level ids/difficulty/modules.
- **`meta.ts`** – Generated level ids, difficulty, and contract code (same for all locales).
- **`content/<locale>.json`** – Translated name, description, instructions, and optional metadata.
- **`types.ts`** – `Level`, `LevelContent`, `Difficulty`.
- **`index.ts`** – `getLevels(locale)`, `getLevel(locale, id)`, `LEVEL_IDS`, re-exports.

## Contract code

Contract code is not translated; it lives in `meta.ts` only. Name, description, instructions, optional author metadata, and optional hints are locale content fields.
