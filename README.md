# Move-over CTF

A wargame to learn **Move** smart contract security on **Sui** — inspired by [OpenZeppelin Ethernaut](https://ethernaut.openzeppelin.com/).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- **`npm run dev`** — Start dev server (Next.js + Turbopack)
- **`npm run build`** — Production build
- **`npm run start`** — Run production server
- **`npm run lint`** — Run ESLint

## Layout

- **Header** — Branding, network label, language and theme toggles
- **Sidebar** — Level list with difficulty (● easy, ●● medium, ●●● hard)
- **Main** — Level instructions (markdown) and contract code (Move) tabs

Levels and contract code live in `src/data/levels/` (meta + per-locale content). See **CONTRIBUTING.md** for how to add a level or a locale.
