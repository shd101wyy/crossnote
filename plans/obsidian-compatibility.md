# Obsidian Compatibility Plan

## Overview

This document tracks features needed to make crossnote more compatible with Obsidian's markdown syntax. Crossnote already supports many Obsidian features (callouts, wikilinks, math, diagrams, graph view, backlinks, etc.). The remaining gaps are prioritized below.

## Priority 1: High Impact

### 1. Note embedding via `![[note]]`

**Status: COMPLETE ✅**

#### Design

Currently `![[image.png]]` works for images (handled at block-level in transformer). The new implementation adds inline `![[note.md]]` support that embeds rendered note content inline using `![[note.md]]` syntax.

#### Implementation

Two layers:

1. **Transformer pre-processing** (`src/markdown-engine/transformer.ts:1053-1092`):
   - Detects inline `![[...]]` patterns (not on their own line — those are handled by existing block-level import)
   - For image files (`.png`, `.jpg`, etc.): converts to standard markdown image syntax `![text](path)`
   - For markdown files: creates `<wikilink-embed>` placeholder with data attributes
   - Works for all parsers (markdown-it, pandoc, markdown_yo) since `html: true`

2. **Render enhancer** (`src/render-enhancers/embedded-wikilinks.ts`):
   - Finds all `wikilink-embed` elements after HTML rendering
   - Reads referenced file, renders it through `parseMD` (full pipeline)
   - Replaces placeholder with `<div class="wikilink-embed-content">...</div>`
   - Handles hash fragments to extract specific heading sections
   - Limits recursion depth to 3 (prevents infinite loops)
   - Shows error messages for missing files
   - Non-.md files render as code blocks or images

3. **Pipeline integration** (`src/markdown-engine/index.ts`):
   - Enhancer runs after all other render enhancers but before HTML sanitization
   - Embedded content passes through the full parseMD pipeline (including its own sanitization)

#### Parser Support

| Parser      | Status       | Notes                                            |
| ----------- | ------------ | ------------------------------------------------ |
| markdown-it | ✅ Completed | Via transformer pre-processing + render enhancer |
| pandoc      | ✅ Completed | Via transformer pre-processing + render enhancer |
| markdown_yo | ✅ Completed | Via transformer pre-processing + render enhancer |

#### Tests

| Test Type               | File                                                    | Tests |
| ----------------------- | ------------------------------------------------------- | ----- |
| Transformer data-driven | `test/markdown/test-files/test9.md` / `test9.expect.md` | 1     |
| Integration             | `test/wikilink-embed.test.ts`                           | 6     |

Integration tests cover:

- markdown-it inline embed
- markdown_yo inline embed
- pandoc inline embed
- Missing file error handling
- Image wikilink passthrough
- Alias syntax (`![[note|alias]]`)

#### Limitations

- Circular references terminate at depth 3
- Non-.md files render as code blocks or images (not dynamically embedded—e.g., PDFs)
- Embedded content uses the same notebook config (themes, math, etc.)
- No caching beyond the engine's filesCache mechanism
- Hash fragment extraction relies on heading attribute format in transformed markdown
- Block-level `![[note.md]]` (entire line) uses existing `@embedding` mechanism which only works with markdown-it parser

---

### 2. Block references `[[note#^block-id]]`

**Status: PLANNED**

Obsidian supports referencing specific blocks (paragraphs, lists) via `^block-id` anchors. Crossnote currently only supports heading-level `#heading-id` anchors.

**Design approach**: Extend the wikilink parser to handle `#^block-id` anchors, generate IDs for block-level elements during rendering, and resolve references in the render enhancer.

---

### 3. Inline metadata fields (`field:: value`)

**Status: PLANNED**

Obsidian's inline field syntax allows embedding YAML-like key-value pairs in body text: `field:: value`. These can be queried by Dataview.

**Design approach**: Add a markdown-it plugin that parses `key:: value` patterns and renders them as `data-` attributes on the containing element. The notebook search system can index these.

---

## Priority 2: Medium Impact

### 4. Tag parsing (`#tag`)

**Status: PLANNED**

The notebook already has a `tag` token handler in `processNoteMentionsAndMentionedBy` (line 586 of `src/notebook/index.ts`) but no markdown-it plugin generates `tag` tokens from `#tagname` syntax.

**Design approach**: Add a markdown-it plugin that generates `tag` tokens for `#tag` patterns. Support nested tags `#parent/child`.

---

### 5. `%% comments %%`

**Status: PLANNED**

Obsidian uses `%% comment %%` for inline comments hidden in reading view. Crossnote has CriticMarkup but not the `%%` syntax.

**Design approach**: Add a transformer pre-processing step that strips `%%...%%` blocks before rendering (for preview) or markdown-it rule that hides them.

---

### 6. Nested tag support (`#parent/child`)

**Status: PLANNED**

Depends on #4. Enables hierarchical tag organization.

---

## Priority 3: Lower Impact / Larger Scope

### 7. Kanban / Dataview-like query views

**Status: DEFERRED**

Would require a larger subsystem. Crossnote's code chunk system could serve as the execution engine.

### 8. Canvas

**Status: DEFERRED**

Obsidian's infinite canvas is a major feature requiring a complete UI component.

---

## Implementation Notes

### Testing

- Test files in `test/` mirroring `src/` structure
- Data-driven tests using `.expect.md` files in `test/markdown/test-files/`
- Run with `pnpm test`

### Build

- Run `pnpm check && pnpm test` before committing
- Run `pnpm build` for downstream integration

---

_Last updated: 2026-05-02_
_Implementation: Feature #1 (Note embedding via `![[note]]`) completed._
