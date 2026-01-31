# Tags in One Place

An Obsidian plugin that collects all tags from your vault and writes them to a single Markdown file.

## Features

- **Tag collection**: Scans every Markdown file in your vault using Obsidian's `getAllTags()` API
- **Single index file**: Writes all unique tags (sorted alphabetically) into one Markdown file (default: `Tags.md`)
- **Manual update**: Trigger via command palette — "Update tag index"
- **Configurable output path**: Change the target file in **Settings → Tags in One Place**
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

## Current status (v1.0.0 — MVP)

### Implemented

- Tag collection from all vault Markdown files (deduped, sorted)
- Write tag index to a configurable Markdown file
- Command palette command: "Update tag index"
- Settings tab with target file path configuration
- Auto-create target file and parent folders
- Success/failure notifications via Obsidian Notice
- Error handling (folder-as-target, missing files, etc.)

### Not yet implemented (planned for future phases)

- **Phase 2 — Enhanced config**: multiple output formats (table, grouped), sort by frequency, tag filtering, hierarchical display for nested tags
- **Phase 3 — Automation**: auto-update on vault changes (file save/create/delete/rename), timed updates, incremental updates
- **Phase 4 — Advanced**: tag usage statistics, tag co-occurrence graph, tag suggestions, multi-file index support

### Explicitly out of scope

- Tag renaming/deletion (use [Tag Wrangler](https://github.com/pjeby/tag-wrangler))
- Editing tags from the index file
- Dataview integration

## API Documentation

See https://docs.obsidian.md
