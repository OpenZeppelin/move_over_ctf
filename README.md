# Move-over CTF

A browser-first capture-the-flag for learning **Move** smart contract security. Inspect vulnerable Move modules, write an exploit in the `run()` path, and return the expected flag type to solve each level. Inspired by [OpenZeppelin Ethernaut](https://ethernaut.openzeppelin.com/).

**Play online:** [moveover.openzeppelin.com](https://moveover.openzeppelin.com/)

## Features

- **Runs entirely in the browser** — Level execution uses WASM; no backend or API required.
- **Static export** — Build once and deploy to any static host (e.g. GitHub Pages, Netlify, Vercel).
- **Local progress** — Completion is stored in the browser and reflected in the header progress bar.
- **Shareable links** — Each level has a stable URL: `/{locale}/levels/{id}`.
- **Multi-language** — Level content is localized; English is the default.
- **Keyboard shortcut** — `Cmd` (macOS) or `Ctrl` (Windows/Linux) + `Enter` runs your solution from the editor.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), pick a level, read the contract and instructions, then implement the exploit in the solution editor.

## How it works

Level source of truth lives in **`public/contracts/*.move`**. The app:

1. Loads contract source and level metadata (id, difficulty, content).
2. Lets you edit a solution that defines a `run()` function.
3. Compiles and runs your solution in the browser via the Move WASM runtime.
4. Checks that the execution returns the expected flag type for that level.

Metadata is generated from the contract files and config: `npm run sync:meta` (or the `prebuild` hook) rebuilds `src/data/levels/meta.ts`. Progress is stored in local storage and is not sent to any server.

To preview the production static build locally:

```bash
npm run build
npx serve out
```

Then open the URL shown (e.g. `http://localhost:3000`).

## Project structure

| Path | Purpose |
|------|--------|
| `public/contracts/` | Move modules (`.move`) — source of truth for level challenges |
| `src/data/levels/meta.config.json` | Level id, difficulty, and module mapping |
| `src/data/levels/meta.ts` | Generated metadata (do not edit by hand) |
| `src/data/levels/runConfig.ts` | Per-level runner module and expected return type |
| `src/data/levels/content/*.json` | Localized level names, descriptions, instructions, hints |
| `src/app/` | Next.js routes (landing, levels, locale-aware pages) |
| `src/components/` | UI (level picker, code editor, hints, etc.) |

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Sync metadata, watch `public/contracts/*.move`, start Next.js dev server |
| `npm run dev:next` | Start Next.js only (no sync or contract watch) |
| `npm run build` | Production build; runs `sync:meta` before building |
| `npm run start` | Run `next start` (for non-static hosting) |
| `npm run lint` | Run ESLint |
| `npm run sync:meta` | Regenerate `src/data/levels/meta.ts` from `public/contracts` |
| `npm run create:level` | Interactive flow to add a new level |
| `npm run delete:level` | Interactive flow to remove a level and reindex ids |
| `npm run sync:contracts` | Legacy: sync from `move_over/sources` into `public/contracts` |

## Adding levels

Use the automated flow:

```bash
npm run create:level
```

You’ll be prompted for name, difficulty, instructions, and Move code. The script creates the contract file, updates config and content, and runs metadata sync. For manual steps and contract conventions, see **[ADD_LEVEL_README.md](ADD_LEVEL_README.md)**.

## Deleting levels

To remove a level and reindex higher ids:

```bash
npm run delete:level
```

You’ll choose the level by id and confirm. For details, see **[DELETE_LEVEL_README.md](DELETE_LEVEL_README.md)**.

## Contributing

Contributions are welcome — new levels, bug fixes, docs, and UX improvements. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for how to fork, branch, run checks, and open a pull request.

## License

This project is open source under the [MIT License](LICENSE.md).
