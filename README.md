# Move-over CTF

Move-over is an open-source, browser-first CTF for learning Move smart contract security, inspired by [OpenZeppelin Ethernaut](https://ethernaut.openzeppelin.com/).

You inspect vulnerable contracts, write the `run()` exploit path, and return the expected `*Flag` object to clear each level.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## How it works

- The level runtime executes fully in the browser (WASM), so no API backend is required.
- The app is configured for static export (`output: "export"`).
- `npm run build` creates an `out/` directory that can be hosted on static hosting providers.
- Progress is stored locally and shown as a dynamic progress bar in the header.
- Level pages support shareable deep links (`/{locale}/levels/{id}`).
- In the in-browser runner, `Cmd/Ctrl + Enter` runs your solution from the editor.

To preview the static output locally:

```bash
npm run build
npx serve out
```

## Available scripts

- `npm run dev` - Runs metadata sync, watches `public/contracts/*.move`, and starts Next.js dev mode.
- `npm run dev:next` - Starts Next.js dev server directly.
- `npm run build` - Production build (runs `sync:meta` first via `prebuild`).
- `npm run start` - Runs `next start` (not required for static-export hosting flow).
- `npm run lint` - Runs ESLint.
- `npm run sync:meta` - Rebuilds `src/data/levels/meta.ts` from contracts in `public/contracts`.
- `npm run create:level` - Interactive level creation flow.
- `npm run delete:level` - Interactive level deletion and reindexing flow.
- `npm run sync:contracts` - Legacy sync from `move_over/sources` into `public/contracts` and `public/solutions`.

## Project structure (key paths)

- `src/app` - App routes (landing page, levels, localized pages).
- `src/components` - UI components.
- `src/data/levels/meta.config.json` - Level id/difficulty/module source config.
- `src/data/levels/meta.ts` - Generated level metadata used by the app.
- `src/data/levels/content/*.json` - Localized level text content.
- `src/data/levels/runConfig.ts` - Runner module and expected return type per level.
- `public/contracts` - Move contract files used as source of truth for browser level content.

## Adding levels

Use the automated flow:

```bash
npm run create:level
```

For full details (including manual steps and conventions), see `ADD_LEVEL_README.md`.

## Contributing

Everyone is welcome to contribute - new levels, fixes, docs, and UX improvements are all appreciated.

If you want to contribute:

1. Fork the repo and create a branch.
2. Make your changes.
3. Run:
   ```bash
   npm run lint
   npm run build
   ```
4. Open a pull request with a short explanation of the change.
