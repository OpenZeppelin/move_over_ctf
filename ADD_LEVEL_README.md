# How to Add a New Level

This repo is browser-first.  
The level source of truth is in `public/contracts`, then `meta.ts` is generated from it.

## Fast path (automated script)

Run:

```bash
npm run create:level
```

You will be prompted for:

- Name
- Difficulty
- Instructions
- Move code

The script will automatically:

- Create `public/contracts/<module>.move` from your Move code
- Add a new level entry to `src/data/levels/meta.config.json`
- Add a new level entry to `src/data/levels/runConfig.ts`
- Add English content to `src/data/levels/content/en.json`
- Run `node scripts/sync-meta-from-public.mjs`

After that, start dev/build as usual.

## Delete level (automated script)

Run:

```bash
npm run delete:level
```

The script will:

- Prompt for level id
- Ask for confirmation
- Remove the level from `meta.config.json`
- Remove and reindex entries in `runConfig.ts`
- Remove and reindex entries in all `src/data/levels/content/*.json`
- Delete `public/contracts/<module>.move` (if no other level uses the same module)
- Run `node scripts/sync-meta-from-public.mjs`

Note: it reindexes higher level ids by `-1` to keep level routes contiguous.

## What to edit

When adding a level, you usually touch these files:

1. `public/contracts/<module>.move` (new challenge contract)
2. `src/data/levels/meta.config.json` (id + difficulty + module mapping)
3. `src/data/levels/runConfig.ts` (runner module + expected return type)
4. `src/data/levels/content/en.json` (name, description, instructions)
5. Optional: other `src/data/levels/content/<locale>.json` files

## Contract conventions

Use these conventions so the web runner verifies correctly:

- Module name format: `module move_over::<module>;`
- The solution should return a proof/flag type, e.g. `MyLevelFlag`
- The challenge module should construct that flag type only on the solved path
- Keep contract API simple for browser execution

Example shape:

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

## Step-by-step

### 1) Add the contract

Create:

- `public/contracts/<module>.move`

### 2) Register it in meta config

Append to `src/data/levels/meta.config.json`:

```json
{
  "id": 3,
  "difficulty": "easy",
  "module": "my_level"
}
```

### 3) Add runner config

Add entry to `src/data/levels/runConfig.ts`:

```ts
3: {
  module: "my_level",
  typeName: "MyLevelFlag",
  solutionModule: "level_3_solution",
},
```

`typeName` must match the contract return type expected from `run()`.

### 4) Add level text

Add key `"3"` in `src/data/levels/content/en.json`:

```json
"3": {
  "name": "My Level",
  "description": "Short teaser.",
  "instructions": "# Level 3: My Level\n\nYour mission..."
}
```

You can add other locales now, or rely on English fallback.

### 5) Regenerate metadata

Run:

```bash
npm run sync:meta
```

This rebuilds `src/data/levels/meta.ts` from `public/contracts`.

### 6) Validate

Run:

```bash
npm run dev
```

Check that:

- The level appears in the sidebar/picker
- Contract code renders correctly
- Running a solution compiles and executes

Then run:

```bash
npm run build
```

## Notes

- `move_over/` is optional for browser-only flow and hosting.
- `sync:contracts` is legacy and not required for the current level flow.
