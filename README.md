# Tags in One Place

An Obsidian plugin that collects all tags from your vault and writes them to a single Markdown file.

## Features

- **Tag collection**: Scans every Markdown file in your vault using Obsidian's `getAllTags()` API
- **Single index file**: Writes all unique tags (sorted alphabetically) into one Markdown file (default: `Tags.md`)
- **Manual update**: Trigger via command palette — "Update tag index"
- **Configurable output path**: Change the target file in **Settings → Tags in One Place**
  - Path must be vault-relative (e.g., `Tags` or `Index/Tags`)
  - If you omit an extension, `.md` is appended automatically
- **Folder exclusions**: Exclude one or more folders from scanning (recursive)
  - Exclusions apply to all subfolders
  - The "Add excluded folder" picker only shows folders that aren't already excluded (or covered by a parent exclusion)
- **Auto-create**: If the target file (or parent folders) doesn't exist, it will be created automatically

## Usage

1. Enable the plugin in **Settings → Community plugins**.
2. (Optional) Go to **Settings → Tags in One Place** to change the target file path. Default is `Tags.md` at the vault root.
3. Open the command palette (`Ctrl/Cmd + P`), search for **"Update tag index"**, and run it.
4. Open the generated file (e.g. `Tags.md`) to see all your tags.

### Output format

```markdown
# Tag Index

Last updated: 01/31/2026, 10:45 AM

## All Tags (125)

- #archive
- #blog
- #book
- #project
- #project/work
- #todo
```

## Installation

### From source

1. Clone this repo into your vault's `.obsidian/plugins/tags-in-one-place/` folder.
2. Run `npm install` and `npm run build`.
3. Reload Obsidian and enable the plugin.

### Manual

Copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/tags-in-one-place/`.

## Development

```bash
npm install        # install dependencies
npm run dev        # watch mode (auto-recompile on save)
npm run build      # production build
```

## Current status (v1.1.1)

### Implemented

- Tag collection from all vault Markdown files (deduped, sorted)
- Write tag index to a configurable Markdown file
- Command palette command: "Update tag index"
- Settings tab with target file path configuration
- Exclude one or more folders from scanning (recursive)
- Auto-create target file and parent folders
- Success/failure notifications via Obsidian Notice
- Error handling (folder-as-target, missing files, etc.)

### Not yet implemented (planned for future phases)

- **Phase 2 — Enhanced config**: multiple output formats (table, grouped), sort by frequency, tag filtering, hierarchical display for nested tags
- **Phase 3 — Automation**: auto-update on vault changes (file save/create/delete/rename), timed updates, optional incremental updates (see "Architecture notes")
- **Phase 4 — Advanced**: tag usage statistics, tag co-occurrence graph, tag suggestions, multi-file index support

### Explicitly out of scope

- Tag renaming/deletion (use [Tag Wrangler](https://github.com/pjeby/tag-wrangler))
- Editing tags from the index file
- Dataview integration

## API Documentation

See https://docs.obsidian.md

## Architecture notes

This plugin currently uses a simple, predictable architecture:

- **On-demand full scan**: when you run "Update tag index", the plugin scans all Markdown files in the vault (using `metadataCache` + `getAllTags()`), generates the index, and writes it to the target file.
- **Why this approach**: it is easy to understand, avoids background work, and minimizes side effects (sync churn, Git noise, and plugin-to-plugin event amplification).

For large vaults or very frequent updates, a future automation phase may introduce an **incremental index** architecture:

- **B1 (incremental cache, manual write)**: maintain an in-memory cache of `file -> tags` updated via Obsidian events, but only write the index file when the user runs the command.
  - Pros: near-instant command runs; minimal write/sync side effects.
  - Cons: more complexity (event ordering, cache readiness, recovery paths).
- **B2 (incremental cache, auto-write)**: same cache as B1, plus auto-writing the index file with debounce.
  - Pros: index stays up-to-date with minimal user effort.
  - Cons: higher risk of sync conflicts (multi-device), frequent writes, and more "background" behavior that can surprise users.
