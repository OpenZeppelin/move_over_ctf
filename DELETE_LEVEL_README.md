# How to Delete a Level

This guide describes how to remove an existing level and reindex the remaining levels so ids stay contiguous. The level source of truth is in `public/contracts` and `src/data/levels`; the delete script updates all of them and then regenerates metadata.

## Quick path (recommended)

Run:

```bash
npm run delete:level
```

You will be prompted for:

1. **Level id** — The numeric id of the level to delete (the script lists all levels with id, name, modules, and difficulty).
2. **Confirmation** — You must type `delete` to confirm.

The script then:

- Removes the level from `src/data/levels/meta.config.json`
- Updates `src/data/levels/runConfig.ts`: removes the entry for that id and **reindexes** higher ids by `-1` (e.g. level 5 becomes 4)
- Updates every `src/data/levels/content/*.json`: removes the content for that id and reindexes keys so level routes stay contiguous
- Deletes `public/contracts/<module>.move` for each module used **only** by that level (if another level uses the same module, the file is kept)
- Runs `node scripts/sync-meta-from-public.mjs` to regenerate `src/data/levels/meta.ts`

After deletion, run `npm run dev` or `npm run build` as usual.

## What gets updated

| File or directory | Change |
|-------------------|--------|
| `src/data/levels/meta.config.json` | Level entry removed; higher ids shifted down by 1 |
| `src/data/levels/runConfig.ts` | Entry for deleted id removed; solution module names for higher ids updated (e.g. `level_6_solution` → `level_5_solution`) |
| `src/data/levels/content/*.json` | Key for deleted id removed; higher id keys shifted down (e.g. `"6"` → `"5"`) |
| `public/contracts/<module>.move` | Deleted only if no other level references that module |
| `src/data/levels/meta.ts` | Regenerated from contracts and config |

## Constraints

- You cannot delete the **last remaining level**; the script will error.
- Reindexing changes level **ids** and **URLs**. Any external links or bookmarks to levels with id greater than the deleted one will point to a different level after deletion.

## Manual deletion (without the script)

If you need to delete a level by hand:

1. Remove the level’s entry from `src/data/levels/meta.config.json` and renumber higher ids.
2. Remove the level’s entry from `src/data/levels/runConfig.ts` and renumber keys and `solutionModule` names for higher ids.
3. In each `src/data/levels/content/<locale>.json`, remove the key for that id and renumber higher keys.
4. If no other level uses the level’s module(s), delete the corresponding `public/contracts/<module>.move` file(s).
5. Run `npm run sync:meta`.

Using `npm run delete:level` is less error-prone and keeps all files in sync.
