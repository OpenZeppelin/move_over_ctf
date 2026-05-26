# How to Delete a Level

This guide describes how to remove an existing level. The level source of truth is in `public/contracts` and `src/data/levels`; the delete script updates all of them and then regenerates metadata.

## Quick path (recommended)

Run:

```bash
npm run delete:level
```

You will be prompted for:

1. **Level id (slug)** — the snake_case slug of the level to delete (the script lists all levels with their id, name, modules, and difficulty).
2. **Confirmation** — you must type `delete` to confirm.

The script then:

- Removes the level from `src/data/levels/meta.config.json`
- Removes the entry from `src/data/levels/runConfig.ts`
- Removes the content key from every `src/data/levels/content/*.json`
- Deletes `public/contracts/<module>.move` for each module used **only** by that level (if another level uses the same module, the file is kept)
- Runs `node scripts/sync-meta-from-public.mjs` to regenerate `src/data/levels/meta.ts`

Slugs are stable identifiers — removing one does not affect any other level's id, URL, or storage key.

After deletion, run `npm run dev` or `npm run build` as usual.

## What gets updated

| File or directory | Change |
|-------------------|--------|
| `src/data/levels/meta.config.json` | Level entry removed |
| `src/data/levels/runConfig.ts` | Entry for the deleted slug removed |
| `src/data/levels/content/*.json` | Key for the deleted slug removed |
| `public/contracts/<module>.move` | Deleted only if no other level references that module |
| `src/data/levels/meta.ts` | Regenerated from contracts and config |

## Constraints

- You cannot delete the **last remaining level**; the script will error.
- The deleted level's URL (`/levels/<slug>`) will return 404; in-the-wild share links to it stop working.

## Manual deletion (without the script)

If you need to delete a level by hand:

1. Remove the level's entry from `src/data/levels/meta.config.json`.
2. Remove the level's entry from `src/data/levels/runConfig.ts`.
3. In each `src/data/levels/content/<locale>.json`, remove the key for that slug.
4. If no other level uses the level's module(s), delete the corresponding `public/contracts/<module>.move` file(s).
5. Run `npm run sync:meta`.

Using `npm run delete:level` is less error-prone and keeps all files in sync.
