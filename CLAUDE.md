# Tags in One Place — Obsidian Plugin

## Project overview

- **Purpose**: Collect all tags from an Obsidian vault and write them to a single Markdown index file.
- **Status**: v1.0.0 MVP — core functionality complete, builds successfully.
- **Target**: Obsidian Community Plugin (TypeScript → bundled JavaScript via esbuild).
- **Entry point**: `src/main.ts` compiled to `main.js` and loaded by Obsidian.
- **Required release artifacts**: `main.js`, `manifest.json`, and optional `styles.css`.

## Architecture

```
src/
├── main.ts           # Plugin entry point — lifecycle, command registration, wiring
├── settings.ts       # TagIndexSettings interface, defaults, TagsInOnePlaceSettingTab
├── tag-collector.ts  # TagCollector — scans vault files via getAllTags() API
├── file-writer.ts    # FileWriter — creates/modifies target file, handles missing folders
└── formatter.ts      # Formatter — generates markdown output (title, timestamp, tag list)
```

### Data flow

```
Command triggered
  → TagCollector.collectAllTags()   // reads metadataCache for each markdown file
  → Formatter.formatTagIndex(tags)  // produces markdown string
  → FileWriter.writeToFile(path, content)  // writes to vault
  → Notice (success/failure)
```

### Key classes

| Class | File | Responsibility |
|-------|------|---------------|
| `TagsInOnePlacePlugin` | `main.ts` | Plugin lifecycle, command registration, settings load/save |
| `TagIndexSettings` | `settings.ts` | Settings interface (`targetFilePath: string`) |
| `TagsInOnePlaceSettingTab` | `settings.ts` | Obsidian settings UI |
| `TagCollector` | `tag-collector.ts` | Vault scan, tag extraction via `getAllTags()`, dedup with Set |
| `FileWriter` | `file-writer.ts` | File/folder creation, file modification, path validation |
| `Formatter` | `formatter.ts` | Markdown generation (header, timestamp, count, bullet list) |

## Environment & tooling

- Node.js: 18+ recommended
- **Package manager: npm**
- **Bundler: esbuild** (`esbuild.config.mjs`)
- Types: `obsidian` type definitions
- No external runtime dependencies

### Commands

```bash
npm install        # install dependencies
npm run dev        # watch mode
npm run build      # production build (tsc check + esbuild)
```

## Plugin commands

| Command ID | Name | Description |
|-----------|------|-------------|
| `update-tag-index` | Update tag index | Collects all tags and writes to target file |

## Settings

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `targetFilePath` | `string` | `"Tags.md"` | Path to the tag index file |

Settings are persisted via `this.loadData()` / `this.saveData()`.

## Manifest (`manifest.json`)

- **id**: `tags-in-one-place`
- **name**: Tags in One Place
- **version**: 1.0.0
- **minAppVersion**: 1.0.0

## Current implementation status

### Done (MVP)

- [x] Tag collection — `getAllTags()` per file, Set dedup, alphabetical sort
- [x] File writing — auto-create file + parent folders, modify existing, TFolder check
- [x] Markdown formatting — `# Tag Index`, timestamp, `## All Tags (N)`, bullet list
- [x] Command palette — `update-tag-index` command with try/catch + Notice feedback
- [x] Settings tab — configurable `targetFilePath`
- [x] Build passes — zero errors

### Not yet implemented (future phases per PRD)

- [ ] **Phase 2**: Multiple output formats (table, grouped), sort options (frequency, recency), tag filtering, hierarchical nested tag display
- [ ] **Phase 3**: Auto-update via vault events (`modify`/`create`/`delete`/`rename`), debounced updates, timed refresh, incremental updates
- [ ] **Phase 4**: Tag usage statistics, tag co-occurrence visualization, tag suggestions, multi-file index support

### Out of scope

- Tag renaming/deletion (defer to Tag Wrangler)
- Editing tags from index file
- Dataview integration

## Edge cases handled

- Target file doesn't exist → auto-created (including parent folders)
- Target path is a folder → throws descriptive error
- Empty vault / no tags → generates "No tags found" message
- Empty settings path → falls back to default `Tags.md`
- Command failure → caught, logged to console, user notified via Notice

## Testing

Manual: reload Obsidian, enable plugin, run "Update tag index" from command palette, verify output file.

## Coding conventions

- TypeScript strict mode
- `main.ts` kept minimal — delegates to modules
- Each file has a single responsibility
- `async/await` throughout
- No external dependencies

## References

- Obsidian API docs: https://docs.obsidian.md
- Plugin guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- PRD: `Tag in One Place Plugin PRD.pdf` (in repo root)
