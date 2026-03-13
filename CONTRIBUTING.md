# Contributing to Move-over CTF

Thank you for your interest in contributing to Move-over CTF!

Please follow the steps below. If you're new to git and/or GitHub, we suggest you go through the [GitHub Guides](https://guides.github.com/introduction/flow/).

1. Fork this repository
2. Clone the fork replacing `<username>` with your GitHub username
   - Using SSH

        ```bash
        git clone --filter=blob:none git@github.com:<username>/move-over-ctf.git
        ```

   - Using HTTPS

        ```bash
        git clone --filter=blob:none https://github.com/<username>/move-over-ctf.git
        ```

   - Using GitHub CLI

        ```bash
        gh repo clone <username>/move-over-ctf -- --filter=blob:none
        ```

3. Install dependencies and run the app to verify your setup:

        ```bash
        npm install
        npm run dev
        ```

   Open [http://localhost:3000](http://localhost:3000) to confirm the app loads.

4. Create a new branch from the latest `main`
5. Start hacking on the new branch according to the type of contribution outlined below
6. Before opening a pull request, run:

        ```bash
        npm run lint
        npm run build
        ```

7. Commit and push to your branch, then make a pull request against the upstream repository’s `main` branch

## Contribution Types

Currently, we are reviewing contributions of the following types:

<!-- no toc -->
- [Level development](#level-development)
- [Translations and additional languages](#translations-and-additional-languages)
- [Documentation updates and corrections](#documentation-updates-and-corrections)

If you would like to contribute in another way, please open an issue to discuss it.

### Level development

A level is composed of the following elements:

- A **Move module** in `public/contracts/<module>.move` that defines the challenge. The module must use the format `module move_over::<module_name>;`, expose a flag type (e.g. `MyLevelFlag`) that the solution returns, and provide a solved path that constructs or returns that flag. See [ADD_LEVEL_README.md](ADD_LEVEL_README.md) for contract conventions and an example.
- A **meta config entry** in [meta.config.json](src/data/levels/meta.config.json) with the level id, difficulty, and module name (and optionally a `modules` array for multi-module levels).
- A **runner config entry** in [runConfig.ts](src/data/levels/runConfig.ts) that maps the level id to the module name, the expected return type name, and the solution module name.
- **Level content** in [src/data/levels/content/en.json](src/data/levels/content/en.json): name, description, instructions (Markdown), and optionally author and hints. Other locales live in the same directory (e.g. `es.json`, `ja.json`).

The easiest way to add a level is to use the interactive script:

```bash
npm run create:level
```

You will be prompted for name, difficulty, instructions, and Move code. The script creates the contract file, updates meta config, run config, and English content, then runs metadata sync. For manual steps, conventions, and a full walkthrough, see [ADD_LEVEL_README.md](ADD_LEVEL_README.md).

After adding a level, run `npm run dev` to confirm it appears in the UI and that your solution compiles and solves the level. Then run `npm run build` to ensure the production build works. When opening a PR, include a short description of the change and what the challenge teaches.

To remove a level, use `npm run delete:level` and see [DELETE_LEVEL_README.md](DELETE_LEVEL_README.md) for details.

### Translations and additional languages

Level content is localized under `src/data/levels/content/`. Each locale has a JSON file (e.g. `en.json`, `es.json`, `ja.json`) with the same structure: for each level id, keys such as `name`, `description`, `instructions`, and optionally `author` and `hints`.

To modify or add translations:

1. Open the locale file you want to edit under `src/data/levels/content/` (e.g. `es.json` for Spanish).
2. Copy the structure from `en.json` and translate the **values** for the levels you want to translate. Do not change the keys (e.g. level id strings, or `name`, `instructions`).
3. If you are adding a **new language**, create a new file (e.g. `fr.json`) with the same structure and translated values. Ensure the locale is registered in the app’s i18n configuration (see `src/i18n/locales.ts` and related config) so it appears in the language picker.
4. Submit a PR. New levels are added in English first; you can add or update translations for other locales in the same PR or in a follow-up.

### Documentation updates and corrections

There are no specific files that must be changed for these contributions. Update the README, level instructions, code comments, or other docs as needed, then open a PR and we will review it.
