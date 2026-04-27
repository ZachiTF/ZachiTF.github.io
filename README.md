# ZachiTF.github.io

The Portfolio can be viewed here [https://zachitf.github.io/](https://zachitf.github.io/).

For a local version (if you wanna build yours with the same setup), host it locally e.g. with

```bash
# live reloading
npx live-server

# or simply
python3 -m http.server 8080
```

and find it on `http://localhost:8080/`

## Skill grouping system

Project tags remain the single source of truth in:
- `data/projects.en.json`
- `data/projects.de.json`

Grouping and color logic is centralized in:
- `data/skill-taxonomy.json`


## Git hook setup (lightweight)

This repo uses a simple tracked git hook script in `scripts/pre-commit`.

After cloning, install the local hook with:

```sh
bash scripts/install-hooks.sh
```

The hook runs on every commit and updates `lastEditedAt` in profile JSONs.

Linting is optional and can be run manually:

```sh
npm install
npm run lint
```

---

### How it works

- Use pre-commit hook to automatically stamp the date with each commit
- Every project keeps detailed raw tags (e.g. `Python`, `C#`, `Deep Learning`).
- The UI maps each raw tag to a group via `skillToGroup` in `skill-taxonomy.json`.
- Sidebar filters are shown by group (not by every single raw tag) to keep filtering clean.
- Both filter chips and project tag chips use the same group color classes.

### Add / change a skill mapping

1. Keep or add the raw tag in a project JSON file.
2. Add/update the normalized key in `skillToGroup` in [skill-taxonomy.json](data/skill-taxonomy.json).
3. If needed, add a new group in `groups` and `groupOrder`.
4. Add matching CSS color tokens/classes in `css/styles.css`.

This keeps data expressive while the UI stays tidy and maintainable.
