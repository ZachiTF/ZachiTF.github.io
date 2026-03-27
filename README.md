# ZachiTF.github.io

[My Portfolio](https://zachitf.github.io/)

## Skill grouping system

Project tags remain the single source of truth in:
- `data/projects.en.json`
- `data/projects.de.json`

Grouping and color logic is centralized in:
- `data/skill-taxonomy.json`

### How it works

- Use pre-commit to automatically stamp the date with each change
- Every project keeps detailed raw tags (e.g. `Python`, `C#`, `Deep Learning`).
- The UI maps each raw tag to a group via `skillToGroup` in `skill-taxonomy.json`.
- Sidebar filters are shown by group (not by every single raw tag) to keep filtering clean.
- Both filter chips and project tag chips use the same group color classes.

### Add / change a skill mapping

1. Keep or add the raw tag in a project JSON file.
2. Add/update the normalized key in `skillToGroup`.
3. If needed, add a new group in `groups` and `groupOrder`.
4. Add matching CSS color tokens/classes in `css/styles.css`.

This keeps data expressive while the UI stays tidy and maintainable.
