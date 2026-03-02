# Move-over CTF

A wargame to learn **Move** smart contract security on **Sui** — inspired by [OpenZeppelin Ethernaut](https://ethernaut.openzeppelin.com/).

## Run locally


```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Browser-only mode

- Level runs execute fully in the browser (WASM), no API backend required.
- `npm run build` generates a static export (`out/`) that you can host on any static provider.

## Scripts

- **`npm run dev`** — Start dev server with automatic Move source sync
- **`npm run build`** — Production build
- **`npm run start`** — Run production server
- **`npm run lint`** — Run ESLint
- **`npm run sync:contracts`** — Sync challenge + level solution Move sources into `public/contracts/` and `public/solutions/` for browser runner

## Layout

- **Header** — Branding, network label, language and theme toggles
- **Sidebar** — Level list with difficulty (● easy, ●● medium, ●●● hard)
- **Main** — Level instructions (markdown) and contract code (Move) tabs

Levels and contract code live in `src/data/levels/` (meta + per-locale content).
For adding new levels, see `ADD_LEVEL_README.md`.
For level creation, use `LEVEL_AUTHORING_GUIDE.md` (streamlined templates + checklist).
For general contribution setup, see `CONTRIBUTING.md`.
