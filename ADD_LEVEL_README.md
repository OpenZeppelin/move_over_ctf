# How to Add a New Level

This repo is browser-first: the level source of truth is **`public/contracts`**. Contract files there drive the UI and the in-browser runner; `meta.ts` is generated from them and from `meta.config.json`. This guide covers the automated flow and, for reference, manual steps and conventions.

**To remove a level instead,** see [DELETE_LEVEL_README.md](DELETE_LEVEL_README.md).

## Quick path (automated script)

Run:

```bash
npm run create:level
```

You will be prompted for:

- **Name** — Level display name
- **Difficulty** — `easy`, `medium`, or `hard`
- **Instructions** — Markdown shown to the player (mission, hints context)
- **Move code** — Full source of the challenge module

The script will:

- Create `public/contracts/<module>.move` from your Move code
- Add a new level entry to `src/data/levels/meta.config.json`
- Add a new level entry to `src/data/levels/runConfig.ts`
- Add English content to `src/data/levels/content/en.json` (name, description derived from instructions, optional author and hints)
- Run `node scripts/sync-meta-from-public.mjs` to regenerate `meta.ts`

Then run `npm run dev` or `npm run build` as usual.

## Files you touch when adding a level

When adding a level (by script or by hand), these are the places that change:

| File | Purpose |
|------|--------|
| `public/contracts/<module>.move` | Challenge contract (new file) |
| `src/data/levels/meta.config.json` | id, difficulty, module (and optional `modules` list) |
| `src/data/levels/runConfig.ts` | Runner module name and expected return type for this level |
| `src/data/levels/content/en.json` | name, description, instructions; optional `author`, `hints` |
| `src/data/levels/content/<locale>.json` | Optional: same structure for other locales |

## Contract conventions

The in-browser runner expects a consistent shape so it can compile and verify solutions:

- **Module format:** `module move_over::<module_name>;`
- **Flag type:** The solution must return a proof/flag type (e.g. `MyLevelFlag`) that the challenge module defines.
- **Solved path only:** The challenge should construct or expose that flag only when the intended exploit is executed.
- **API:** Keep the contract API simple so it runs reliably in the browser.

Example skeleton:

```move
module move_over::my_level;

public struct Vault has key {
    id: UID,
}

public struct MyLevelFlag has copy, drop {}

public fun create(ctx: &mut tx_context::TxContext): Vault {
    Vault { id: object::new(ctx) }
}

public fun solve(v: Vault, _ctx: &mut tx_context::TxContext): MyLevelFlag {
    let Vault { id } = v;
    id.delete();
    MyLevelFlag {}
}
```

The player’s solution will implement a `run()` that is invoked by the runner; it must return the same flag type (e.g. `MyLevelFlag`) for the level to be marked solved.

## Manual step-by-step

If you prefer to add a level without the script:

### 1. Add the contract

Create `public/contracts/<module>.move` with your Move module (following the conventions above).

### 2. Register in meta config

Append an entry to `src/data/levels/meta.config.json`. The `id` is the
snake_case slug used as the URL segment and storage key — by convention it
matches the primary `module` name:

```json
{
  "id": "my_level",
  "difficulty": "easy",
  "module": "my_level"
}
```

For levels that use multiple modules, you can add a `modules` array; the primary `module` is the one used for display/runner.

### 3. Add runner config

Add an entry in `src/data/levels/runConfig.ts` keyed by the slug:

```ts
my_level: {
  module: "my_level",
  typeName: "MyLevelFlag",
  solutionModule: "my_level_solution",
},
```

`typeName` must match the flag type your contract returns from the solved path.

### 4. Add level content

In `src/data/levels/content/en.json`, add a key for the level slug:

```json
"my_level": {
  "name": "My Level",
  "description": "Short teaser.",
  "instructions": "Your mission...",
  "author": {
    "name": "OpenZeppelin",
    "github": "https://github.com/OpenZeppelin"
  }
}
```

The runtime renderer prepends `# Level {position}: {name}` to the instructions
body, so do not include an `# Level N:` H1 in the JSON.

You can add the same key to other locale files or rely on English fallback.

### 5. Regenerate metadata

Run:

```bash
npm run sync:meta
```

This rebuilds `src/data/levels/meta.ts` from `public/contracts` and the config.

### 6. Validate

Run `npm run dev`, open the level in the UI, and confirm:

- The level appears in the sidebar/picker
- Contract code and instructions render correctly
- Running a solution compiles and executes, and returning the correct flag type marks the level solved

Then run `npm run build` to ensure the production build works.

## Notes

- After adding a level, consider adding or updating translations in `src/data/levels/content/<locale>.json` for other languages.
