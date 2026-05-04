# Changelog

Please visit https://github.com/shd101wyy/vscode-markdown-preview-enhanced/releases for the more changelog

## [Unreleased]

## [0.9.23] - 2026-05-04

### New features

- **Note embedding via `![[note]]`** — Inline wikilink embed syntax renders referenced note content directly in preview. Works with all three parsers (markdown-it, pandoc, markdown_yo). Supports heading hash fragments (`![[note#section]]`), alias syntax (`![[note|Title]]`), and recursion depth limit (3). Image wikilinks (`![[image.png]]`) continue to render as standard images.
- **Block references via `^block-id`** — Add `^block-id` suffix at end of paragraphs/list items to assign explicit block IDs. Reference them with `[[note^block-id]]` or `![[note^block-id]]` to embed just that block. Combined `#heading^block-id` extracts a block within a heading section. `processWikilink` extended to handle block ref fragments alongside hash fragments.
- **Tag parsing via `#tag`** — New `enableTagSyntax` config (default `true`) with markdown-it plugin and transformer pre-processing for pandoc/markdown_yo. Renders `#tag-name` as `<a class="tag" data-tag="…" href="tag://…">` so tags are clickable like wikilinks: clicking dispatches a `clickTag` postMessage (`{ uri, tag, scheme }`) that the host extension can route to tag search/backlinks. Supports nested tags (`#parent/child`), excludes URL fragments and numbers-only patterns, and integrates with the existing note mention tracking system for backlinks. Tag styling resets per-theme anchor decorations (underline, text-shadow, box-shadow) for a consistent pill shape across preview themes.
- **Preview zoom controls** — Add zoom in / zoom out / reset zoom commands accessible via the context menu (with current zoom level shown), the footer toolbar (magnifier icons), and `Ctrl/Cmd + mouse wheel`. Zoom level is clamped to 20%–500% and applied via `document.body.style.zoom`; fixed-position elements (`.fixed`, `.contexify`) are counter-zoomed so toolbars and menus stay at their original size. Fixes a typo in the existing `zommIn` host command (now accepts both `zoomIn` and `zommIn` for backward compatibility) ([#418](https://github.com/shd101wyy/crossnote/pull/418), thanks @nielsvdc)
- **VS Code-themed context menu** — New `useVSCodeThemeForContextMenu` config (default `false`). When enabled inside a VS Code webview, the right-click context menu inherits VS Code's menu colors, font, and border via `--vscode-menu-*` CSS variables instead of using the bundled Contexify light/dark theme ([#419](https://github.com/shd101wyy/crossnote/pull/419), thanks @nielsvdc)
- **Global `#tag` index** — Tags are now indexed as notebook-wide metadata in a separate `tagReferenceMap` (case-folded, location-independent) instead of being routed through the file `referenceMap` with synthetic per-directory paths. Adds `Notebook.getAllTags()`, `getNotesReferringToTag(tag)`, and `getTagBacklinks(tag)` (parallel to `getNoteBacklinks`). Fixes the pre-existing bug where the same `#mytag` mentioned from `notes/foo.md` and `docs/bar.md` indexed under different phantom paths and never unified.
- **`maxNoteFileSize` config (default `5 MiB`)** — Markdown files larger than the cap are skipped during `refreshNotes` so a checked-in 50 MB log/data dump with a `.md` extension can't pin its full content (plus a markdown-it token tree several × that size) in the in-memory index. Set to `0` to disable. Files above the cap are still openable by wikilink click — they're just not indexed for autocomplete, backlinks, or the tag panel. Note that this means an oversized note's _outgoing_ wikilinks won't appear as backlinks on the notes it links to, and any `#tag` mentions in it won't show up in the tag index — symmetric with not appearing in autocomplete.

### Bug fixes

- Fix sidebar TOC inserting huge vertical gaps for headings that start with `<digits>. ` (e.g. `# 1. Introduction`) — `generateSidebarToCHTML` was passing heading text through `md.render()` which interpreted the leading digit-dot-space as an ordered list, wrapping each TOC entry in `<ol><li>` and stacking the list margins. Switched to `md.renderInline()` so only inline rules run on heading content. Fixes [vscode-mpe#2276](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/2276) and [#2277](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/2277)
- Fix `:::name … :::` Pandoc-style fenced divs being rendered as `<pre>` code blocks (markdown-it) or as literal `:::name {data-source-line="…"}` text (pandoc / markdown_yo) since 0.9.21. The colon-fenced code-block plugin now distinguishes a small whitelist of diagram languages (mermaid, plantuml, wavedrom, graphviz, vega/vega-lite, d2, tikz, …) from arbitrary div-class names; only the former takes the `<pre>` path, everything else renders as `<div class="name">` with the inner content parsed as markdown. The transformer rewrites the markers as raw HTML for non-markdown-it parsers so Pandoc/markdown_yo also produce a real `<div>`. Fixes [vscode-mpe#2275](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/2275)
- Fix headings rendering as literal `Heading {#id data-source-line="…"}` text — when `enableTagSyntax` is on, the inline tag plugin was capturing `#id` from the curly-bracket attribute span and splitting the text token, which prevented the curly-bracket-attributes core ruler from lifting the trailing `{…}` into heading attributes. The plugin and the transformer fallback now both skip `#` candidates that fall inside a `{…}` span, and the curly-bracket attributes are correctly applied to the heading element.
- Fix tag clicks being silent no-ops — DOMPurify's default URL allowlist drops the `tag://` scheme, leaving `<a class="tag">` with no href. The webview-side sanitizer now allows `tag:` (so right-click "Copy link" works) and `bindAnchorElementsClickEvent` falls back to `data-tag` for class="tag" anchors even if some other layer strips the href.
- Add a `Mutex` around `Notebook.refreshNotes` (alongside the existing `refreshNotesIfNotLoadedMutex`) so two concurrent callers can't interleave the wipe-and-rebuild cycle and leave the indices half-rebuilt.

### Improvements

- `processWikilink` return type expanded with optional `hash` and `blockRef` fields for callers that need them separately from the link
- Added CSS styling in `style-template.less` for `.tag` (pill-shaped background), `.wikilink-embed-content` (left-border accent), and `.block-id` (hidden marker) elements
- **`getBacklinkedNotes` / `getNotesReferringToTag` / `getTagBacklinks` now read from the in-memory `notes` map directly** instead of `await getNote(filePath)` per referrer. Same observable behaviour, eliminates N async fs round-trips per call (felt on the Backlinks panel and the tag click quick-pick).
- **Lazy markdown bodies in the in-memory note cache** — `Notebook.notes[filePath].markdown` is now evicted after `processNoteMentionsAndMentionedBy` extracts mentions / tags. The reference graph, search index, title, aliases, and front-matter-derived config remain cached as before, but the note body is only read from disk on demand. New `Notebook.getNoteMarkdown(filePath)` API lazy-loads the body — returns the cached string if still attached (rare, only mid-refresh), otherwise re-reads from disk with the same `markdownFileExtensions` / `maxNoteFileSize` checks as `getNote`. `Note.markdown` is now typed as optional (`markdown?: string`). For prose-heavy notebooks this drops cache RSS by roughly the total markdown size — a 1 000-note notebook averaging a few KB per note saves several MB. As a side benefit, on-disk edits are picked up by `getNoteMarkdown` without needing a `refreshNotes` round-trip first. `getNote(filePath, true)` still returns a body-bearing note to its immediate caller (no double disk read for the just-refreshed file); the cache holds a body-less clone.
- New public helpers exposed from crossnote: `extractBlockIds`, `extractHeadings`, `findFragmentTargetLine`, `matter` re-export, plus `Note` / `Notes` / `NoteConfig` type re-exports — host extensions can navigate fragments and front-matter without re-implementing the parsing rules.

### Memory model — known limitation

Notes are loaded eagerly into an in-memory map and stay there for the lifetime of the `Notebook` instance. Token trees from `processNoteMentionsAndMentionedBy` are retained on each `Reference` so the Backlinks panel can re-render HTML on demand. This is fine for typical notebooks (≤ 1 000 notes) but grows linearly with note count, dominated by the reference graph (token bloat scales with wikilink count). The body strings themselves are no longer part of this footprint — the lazy-markdown change above evicts them from the cache after mentions extraction. Remaining improvements being considered for a future release: token-stripping in `Reference` (re-tokenize on demand for the Backlinks panel) and an mtime-keyed parse cache. The `maxNoteFileSize` cap continues to mitigate the worst pathological case (a single huge committed file).

### Internal

- Added 28 new tests across 5 test suites for wikilink embedding, block references, tag parsing, and lazy markdown loading
- Plan doc at `plans/obsidian-compatibility.md` tracking Obsidian feature parity gaps

## [0.9.22] - 2026-04-21

### Bug fixes

- Fix KaTeX fonts corrupted during build — Gulp 5's default `encoding: 'utf8'` was mangling binary font files (`.woff2`, `.woff`, `.ttf`), causing "Failed to decode downloaded font" errors and broken math rendering in VS Code preview ([vscode-mpe#2263](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/2263))
- Fix KaTeX MathML stripped by DOMPurify 3.4.0 — `<semantics>`, `<annotation>`, `<annotation-xml>` elements and the `encoding` attribute are now preserved in the client-side sanitizer, restoring accessibility and copy-paste of math expressions

### Improvements

- Modernize sidebar TOC panel — resizable via drag handle, persistent width, subtle border, hover states, and left accent bar for active heading
- Fix TOC alignment — replace mixed `<details>`/`<div list-item>` rendering with consistent `data-level`-based indentation so headings at the same level always align ([vscode-mpe#2204](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/2204))
- TOC sections with sub-headings are now collapsible via disclosure triangles (both sidebar and inline `[TOC]`)
- Add "VS Code" theme options for Preview Theme, Code Block Theme, and Reveal.js Theme that automatically match the editor's current color theme (light, dark, or high-contrast). Code Block theme uses VS Code's Default Light+/Dark+ syntax colors. Only shown in the context menu when running inside VS Code.

### Internal

- Fix `jest.config.js` `transformIgnorePatterns` (was empty array causing babel-jest to transform all node_modules)
- TikZ tests now verify actual SVG rendering instead of testing the fallback path
- Add `webview-sanitize.test.ts` with 13 tests for the client-side DOMPurify sanitizer (KaTeX preservation, security, regression)

## [0.9.21] - 2026-04-19

### Breaking changes

- **`usePandocParser` and `useMarkdownYoParser` config fields have been removed.** Use the new unified `markdownParser` field instead:
  - `usePandocParser: true` → `markdownParser: 'pandoc'`
  - `useMarkdownYoParser: true` → `markdownParser: 'markdown_yo'`
  - Default (markdown-it) → `markdownParser: 'markdown-it'` (or omit the field)

### New features

- Add experimental support for [markdown_yo](https://github.com/shd101wyy/markdown_yo), a high-performance Markdown-to-HTML renderer written in the [Yo programming language](https://github.com/shd101wyy/Yo) and compiled to WebAssembly.
  - Enable with `markdownParser: 'markdown_yo'` in notebook config (previously `useMarkdownYoParser: true`).
  - Replaces markdown-it for HTML rendering; markdown-it is still used for token-based operations (backlink extraction, note mention processing, etc.).
  - Supports CommonMark, GFM tables, strikethrough, subscript, superscript, mark/highlight, math, emoji, wikilinks, CriticMarkup, abbreviations, definition lists, admonitions, callouts, footnotes, source maps, and line breaks.
  - KaTeX and MathJax math rendering are both supported via post-processing.
  - Wikilink href post-processing applies the same file extension rules as markdown-it.
  - Performance comparison (median of 10 runs, Apple M4):

    | Input Size | markdown-it (JS) | Native  | Speedup | WASM     | Speedup |
    | ---------- | ---------------- | ------- | ------- | -------- | ------- |
    | 64 KB      | 1.6 ms           | 0.4 ms  | 4.5×    | 12.9 ms  | 0.1×    |
    | 256 KB     | 6.7 ms           | 1.2 ms  | 5.3×    | 13.1 ms  | 0.5×    |
    | 1 MB       | 28.8 ms          | 4.8 ms  | 6.0×    | 13.5 ms  | 2.1×    |
    | 5 MB       | 158.9 ms         | 23.3 ms | 6.8×    | 32.6 ms  | 4.9×    |
    | 20 MB      | 722.8 ms         | 95.4 ms | 7.6×    | 121.5 ms | 6.0×    |

    _Native: clang -O3 -flto. WASM: Emscripten, Node.js, -O3 -flto. WASM overhead at small sizes is dominated by one-time WASM compilation startup (~12ms). Crossnote uses the WASM version for cross-platform compatibility._

  - Pre-built binaries for Linux, macOS, and Windows are available at [github.com/shd101wyy/markdown_yo/releases](https://github.com/shd101wyy/markdown_yo/releases). To use them, set `markdownYoBinaryPath` in your notebook config.

- Support rendering [D2](https://d2lang.com) diagrams via the `d2` CLI. D2 fenced code blocks are rendered as SVG diagrams in the preview. If the `d2` executable is not installed, blocks are silently rendered as plain code blocks. https://github.com/shd101wyy/crossnote/pull/405 by @kvdogan
  - New settings: `markdown-preview-enhanced.d2Path`, `d2Layout`, `d2Theme`, `d2Sketch`
  - Per-block overrides supported in the fence info string: ` ```d2 layout=elk theme=200 sketch `

- Support colon-fenced code blocks. https://github.com/shd101wyy/crossnote/pull/409 by @hryktrd

  Exampe:

  ```
  :::mermaid
  graph TD
  A --> B
  :::
  ```

- Support rendering [TikZ](https://tikz.dev/) diagrams via ` ```tikz ` fenced code blocks. https://github.com/shd101wyy/crossnote/issues/380
  - In Node.js (desktop VS Code): renders TikZ to SVG server-side using [node-tikzjax](https://github.com/prinsss/node-tikzjax), with caching.
  - In web (VS Code web extension) and HTML export: falls back to client-side rendering via [tikzjax.com](https://tikzjax.com).
  - Per-block options supported in the fence info string: `texPackages` / `tex_packages`, `tikzLibraries` / `tikz_libraries`, `addToPreamble` / `add_to_preamble`, `showConsole` / `show_console`, `embedFontCss` / `embed_font_css`, `fontCssUrl` / `font_css_url` (both camelCase and snake_case accepted).
  - Automatically wraps code in `\begin{document}...\end{document}` if not present.
  - Automatically loads base TeX packages for every render: `amsmath`, `amssymb`, `amsfonts`, `amstext`, `array`.
  - Auto-detects and loads specialized packages from the code: `tikz-cd` (for `\begin{tikzcd}`), `pgfplots` (for `\begin{axis}`), `circuitikz` (for `\begin{circuitikz}`), `chemfig` (for `\chemfig`), `tikz-3dplot` (for `\tdplotsetmaincoords`). Additional packages can be specified via `texPackages`.

- **Graph view** — Obsidian-style interactive note graph, accessible via "Markdown Preview Enhanced: Open Graph View" in the command palette, the editor right-click context menu, or the button in the preview bottom bar.
  - Force-directed D3 canvas layout; supports pan and zoom.
  - **Global / Local** toggle: Global shows all notes; Local shows only the current file and its connected neighbors (configurable depth 1–5 via a slider).
  - Node sizing by connection count (more links → larger node).
  - **By Folder** toggle: color nodes by their parent directory using stable HSL hues.
  - Search/filter input to highlight matching nodes.
  - Click a node to open the corresponding file in the editor.
  - Hover highlights direct neighbors and dims the rest.
  - Directional arrowheads on edges (scales with zoom).
  - Adapts to the VS Code light/dark/high-contrast theme.
  - Last-used Global/Local mode and By Folder preference are persisted across sessions.
  - Refreshes automatically when any markdown file in the workspace is saved.

### Fixes

- Fix preview scroll fighting the user: when a file opened with the cursor at line 0, the scroll-to-cursor animation kept overriding the user's manual scrolling for ~620ms. User scroll now cancels any in-progress programmatic scroll animation immediately. https://github.com/shd101wyy/crossnote/pull/412 by @giftcharles
- Fix SVG file path by removing random parameter. https://github.com/shd101wyy/crossnote/pull/404 by @fs570714
- Fix a bug exporting files in WSL on Windows. https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/2246
- Fix `gulp-less` failing to compile during `pnpm build` when Google Fonts URLs in theme `.less` files were unreachable (e.g., in offline/CI environments). Remote `@import url(...)` directives are now passed through as plain CSS without being fetched at compile time.

### Updates

- Update `mermaid` version to the latest `11.14.0`.
- Update `katex` version to the latest `0.16.45`.

## [0.9.20] - 2026-03-22

### Security

- Fix RCE vulnerability in `.crossnote/parser.js` hooks, by @0079522-Z461.

### Updates

- Update `sval` javascript interpreter to the latest `0.6.9`.

## [0.9.19] - 2026-03-15

### Bug fixes

- Fix sanitizer for mermaid and wavedrom diagrams.
- Fix `code_block=true` not preventing mermaid diagram rendering.
- Fix "Open in Browser" file paths on WSL.

## [0.9.18] - 2026-03-15

### Bug fixes

- Fix callout block rendering in file export

## [0.9.17] - 2026-03-15

### New features

- Add markdown-it callout feature with styling https://github.com/shd101wyy/crossnote/pull/387 by [@EmmetZ](https://github.com/EmmetZ).
- Add WebSequenceDiagrams support in `wsd` code blocks https://github.com/shd101wyy/vscode-markdown-preview-enhanced/pull/2228 by [@smhanov](https://github.com/smhanov).

### Bug fixes

- Remove the wrapper of custom head in HTML page https://github.com/shd101wyy/crossnote/pull/386 by [@TanShun](https://github.com/TanShun).

### Security

- Fix CVE-2025-65716: Sanitize rendered HTML to prevent arbitrary JavaScript execution via malicious markdown files. Added two-layer defense: server-side sanitization using cheerio (strips `<script>`, `<object>`, `<embed>`, `<applet>` tags, `on*` event handlers, dangerous URL schemes, and sandboxes all `<iframe>` elements) and client-side sanitization using DOMPurify as defense-in-depth at all `innerHTML` injection points https://github.com/shd101wyy/crossnote/pull/394

### Updates

- Update `mermaid` version to the latest `11.13.0`.
- Update `katex` version to the latest `0.16.38`.

## [0.9.16] - 2025-11-01

### Updates

- Update `mermaid` version to the latest `11.12.1`.
- Update `katex` version to the latest `0.16.25`.

### Changes

- Improve Prettier and CI config [PR#383](https://github.com/shd101wyy/crossnote/pull/383) by [kachkaev](https://github.com/kachkaev).
- Replace `yarn` with `pnpm` for package management and scripts.

## [0.9.15] - 2025-08-15

### Bug fixes

- Fixed splitting logic to handle diagrams starting with `<svg>` correctly [crossnote#376](https://github.com/shd101wyy/crossnote/issues/376) by @shiftdownet.

### Updates

- Updated `katex` version to the latest `0.16.22`.
- Updated `mermaid` version to the latest `11.9.0`.

## [0.9.14] - 2025-03-16

### Bug fixes

- Fixed the build for vscode-web caused by prismjs.

## [0.9.13] - 2025-03-16

### Bug fixes

- Fixed a bug of bundling caused by importing the [sharp](https://www.npmjs.com/package/sharp) package.

## [0.9.12] - 2025-03-16

### Changes

- Use [sharp](https://www.npmjs.com/package/sharp) to convert svg element to png file if `imageMagickPath` is empty. [crossnote#366](https://github.com/shd101wyy/crossnote/issues/366)

### Updates

- Updated `mermaid` version to the latest `11.5.0`.
- Updated `katex` version to the latest `0.16.21`.
- Updated `prismjs` version to the latest `1.30.0`.
- Updated `bit-field` version to the latest `1.9.0`.

### Bug fixes

- Fixed the import the crossnote as nodejs esm module. [crossnote#357](https://github.com/shd101wyy/crossnote/issues/357)
- Fixed a bug of using `enableExtendedTableSyntax`. [crossnote#369](https://github.com/shd101wyy/crossnote/issues/369)

## [0.9.11] - 2024-11-08

### Updates

- Updated `mermaid` version to the latest `11.4.0`.

## [0.9.10] - 2024-09-07

### Changes

- Added `.mdx` to the default `markdownFileExtensions`.

### Updates

- Updated `mermaid` version to the latest `11.1.1`.
- Updated `katex` version to the latest `v0.16.11`.

### Bug fixes

- Fixed a scroll sync bug.

## [0.9.9] - 2024-03-11

### Bug fixes

- Fixed [Long sidebarToc does not display completely](https://github.com/shd101wyy/crossnote/pull/354) by @moonlitusun
- Removed the `text` as the default language selector for code block.

### Chore

- Updated [flake.nix](./flake.nix) and node.js to 20.

## [0.9.8] - 2024-03-10

### New features

- @moonlitusun sidebarToc supports local caching

### Updates

- @oneWaveAdrian updated the `mermaid` version to the latest `10.9.0`.

### Bug fixes

- Fixed [[BUG] #tag is treated as Header 1](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1937)
- Fixed [[BUG] toml code block support is not very good](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1920)
- Fixed [[BUG] If URL encoding is used, the preview cannot be displayed.](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1934)

## [0.9.7] - 2023-12-10

### New features

- Added `enablePreviewZenMode` option and reorganized the right-click context menu.

  ![image](https://github.com/shd101wyy/crossnote/assets/1908863/26e2237e-c6e2-433e-a063-6de2c01a64bb)

### Bug fixes

- Fixed rendering `vega-lite` in `Reveal.js` slide: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1880
- Removed one github-dark background css attribute: https://github.com/shd101wyy/crossnote/issues/344

## [0.9.6] - 2023-10-24

### Changes

- Updated mermaid.js to the latest version 10.6.0.

### Bug fixes

- Fixed importing file with spaces in the path: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1857

## [0.9.5] - 2023-10-23

### Bug fixes

- Fixed of bug of rendering the KaTeX math expression: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1853

## [0.9.4] - 2023-10-21

### New features

- Updated [fontawesome](https://fontawesome.com/) from version 4.7 to version 6.4.2 (Free).  
  A list of available icons can be found at: https://kapeli.com/cheat_sheets/Font_Awesome.docset/Contents/Resources/Documents/index
- Updated WaveDrom to the latest version 3.3.0.

### Changes

- Changed the markdown parser process to be like below. We removed the `onWillTransformMarkdown` and `onDidTransformMarkdown` hooks as these two caused the confusion.

  ```markdown
  markdown
  ↓
  `onWillParseMarkdown(markdown)`
  ↓
  markdown
  ↓
  **crossnote markdown transformer**
  ↓
  markdown
  ↓
  **markdown-it or pandoc renderer**
  ↓
  html
  ↓
  `onDidParseMarkdown(html)`
  ↓
  html, and then rendered in the preview
  ```

- (Beta) Supported to export the selected element in preview to .png file and copy the blob to the clipboard:

  ![image](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/assets/1908863/046759d8-6d89-4f41-8420-b863d2094fe7)

### Bug fixes

- Fixed a bug of importing files that contains empty heading: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1840
- Fixed a bug of rendering inline math in image name: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1846
- Fixed a bug of parsing inline code: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1848

## [0.9.3] - 2023-10-15

### Bug fixes

- Better handling of source map for importing files.

## [0.9.2] - 2023-10-15

### New features

- Added `ID` button to copy the element id to clipboard:

  ![Screenshot from 2023-10-15 15-34-27](https://github.com/shd101wyy/crossnote/assets/1908863/ede91390-3cca-4b83-8e30-33027bf0a363)

- Supported to import section of markdown by header id:

  ```markdown
  @import "test.md#header-id"

  or

  ![](test.md#header-id)

  or

  ![[test#header-id]]
  ```

### Bug fixes

- URL fragments on image links do not load: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1837
- Supported matplotlib-type preview for other Python tools like `pipenv`: https://github.com/shd101wyy/crossnote/issues/332

## [0.9.1] - 2023-10-14

### Buf fixes

- Fixed rendering vega and vega-lite. Also fixed `interactive=true` attribute for vega.

## [0.9.0] - 2023-10-13

### New features

- Added two more syntaxes to import files in addition to the `@import` syntax. Please note that these syntaxes only work on new lines. For example, they won't work within list items.
  - Use the image syntax but with other file extensions:
    ```markdown
    ![](path/to/file.md)
    ![](path/to/test.py){.line-numbers}
    ![](path/to/test.js){code_block=true}
    ```
  - Use the wikilink syntax but with other file extensions:
    ```markdown
    ![[file]]
    ![[path/to/test.py]]{.line-numbers}
    ![[path/to/test.js]]{code_block=true}
    ```

### Bug fixes

- Fixed a header id generation bug https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1833
- Fixed parsing block attributes from curly bracket when `enableTypographer` is enabled https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1823
- Fixed the bug of not rendering the `@import` file:
  - https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1832
  - https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1834
- Fixed rendering the vega and vega-lite diagrams.

## [0.8.24] - 2023-10-10

### Bug fixes

- Improved the handling of `[toc]`: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1825
- Supported to set env variables in paths of configuration: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1826
- Fixed the footer style: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1822
- Fixed the bug of generating the header id: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1827
- Fixed the bug of `@import` files that contains unicode characters: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1823
- Now use node.js 18 for the project.

## [0.8.23] - 2023-10-10

### Bug fixes

- Fixed exporting reveal.js presentation.

## [0.8.22] - 2023-10-10

### Bug fixes

- Fixed a bug of loading image https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1819
- Fixed a bug of parsing slides https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1818

## [0.8.21] - 2023-10-09

### Bug fixes

- Fixed a bug of rendering front-matter that caused the failure of rendering slides: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1814

## [0.8.20] - 2023-10-09

### New features

- Supported prefix in front of Kroki diagram types https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1785.  
  So now all diagrams below will get rendered using Kroki:

  ````markdown
  ```kroki-plantuml
  @startuml
  A -> B
  @enduml
  ```

  ```plantuml {kroki=true}
  @startuml
  A -> B
  @enduml
  ```
  ````

- Improved the source map handling for `@import "..."` syntax.

### Bug fixes

- Now exporting files won't include the source map.
- Fixed some Reveal.js presentation related bugs:
  - https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1815
  - https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1814

## [0.8.19] - 2023-10-06

### Changes

- Deprecated the `processWikiLink` in `parser.js`. Now `crossnote` handles how we process the wiki link.  
  We also added two more options:
  - `wikiLinkTargetFileExtension`: The file extension of the target file. Default is `md`. For example:
    - `[[test]]` will be transformed to `[test](test.md)`
    - `[[test.md]]` will be transformed to `[test](test.md)`
    - `[[test.pdf]]` will be transformed to `[test](test.pdf)` because it has a file extension.
  - `wikiLinkTargetFileNameChangeCase`: How we transform the file name. Default is `none` so we won't change the file name.  
    A list of available options can be found at: https://shd101wyy.github.io/crossnote/interfaces/NotebookConfig.html#wikiLinkTargetFileNameChangeCase

### Bug fixes

- Reverted the markdown transformer and deleted the logic of inserting anchor elements as it's causing a lot of problems.  
  The in-preview editor is not working as expected. So we now hide its highlight lines and elements feature if the markdown file failed to generate the correct source map.

## [0.8.18] - 2023-10-05

### New features

- Updated the `katex` version to `0.16.9`.

### Improvements

- Added `end-of-document` class name to the element of the last line of the preview.
- Exported the `KatexOptions` and `MermaidConfig` interfaces.

## [0.8.17] - 2023-10-04

### New features

- 📝 Supported in-preview editor that allows you to edit the markdown file directly in the preview 🎉.  
  This feature is currently in beta.  
  When the editor is open, you can press `ctrl+s` or `cmd+s` to save the markdown file. You can also press `esc` to close the editor.
- Deprecated the VS Code setting `markdown-preview-enhanced.singlePreview`.  
  Now replaced by `markdown-preview-enhanced.previewMode`:
  - **Single Preview** (_default_)  
    Only one preview will be shown for all editors.
  - **Multiple Previews**  
    Multiple previews will be shown. Each editor has its own preview.
  - **Previews Only** 🆕  
    No editor will be shown. Only previews will be shown. You can use the in-preview editor to edit the markdown.
- Supported to set attribute to image and link, e.g.:

  ```markdown
  ![](path/to/image.png){width=100 height=100}
  ```

- Improved the markdown transformer to better insert anchors for scroll sync and highlight lines and elements.  
  Added more tests for the markdown transformer to make sure it works as expected.
- Added the reading time estimation in the preview footer ⏲️.
- Added `Edit Markdown` menu item to the context menu of the preview, which offers two options:
  - **Open VS Code Editor**
    Open the markdown file in VS Code editor.
  - **Open In-preview Editor**
    Open the markdown file in the in-preview editor.
- Updated the mermaid version to the latest `10.5.0`
- Added the API website: https://shd101wyy.github.io/crossnote/

### Bug fixes

- Fixed the font size of the `github-dark.css` code block theme.
- Fixed the anchor jump bugs: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1790
- Fixed list item style bug: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1789
- Fixed a data race bug that caused the preview to hang.

## [0.8.16] - 2023-09-24

### New features

- Added `head.html` config file to allow you to include custom HTML in the `<head>` of the preview.
  This could be useful for adding custom CSS or JavaScript to the preview.

### Bug fixes

- Fixed the `none.css` preview theme bug https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1778.
- Fixed the bug of copying texts in preview https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1775.
- Added `<code>` in `<pre>` while rendering code blocks in preview.

## [0.8.15] - 2023-09-17

### New features

- Added the `includeInHeader` option, which allows you to include custom HTML in the `<head>` of the preview.
  This could be useful for adding custom CSS or JavaScript to the preview.

### Bug fixes

- Fixed the bug of missing the backlinks on the `vue.css` theme.
- Fixed the back to top button. https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1769

## [0.8.14] - 2023-09-15

### New features

- (Beta) Added the [bitfield](https://github.com/wavedrom/bitfield) diagram support. Supported both `bitfield` and `bit-field` code fences. https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1749
  ````
  ```bitfield {vspace=100}
  [
    {name: 'IPO',   bits: 8},
    {               bits: 7},
    {name: 'BRK',   bits: 5, type: 4},
    {name: 'CPK',   bits: 1},
    {name: 'Clear', bits: 3, type: 5},
    {               bits: 8}
  ]
  ```
  ````

### Bug fixes

- Fixed the `vue.css` theme bug that caused the missing scroll bar in the preview. Also fixed a context menu bug for selecting the `vue.css` theme.

## [0.8.13] - 2023-09-15

### Bug fixes

- Fixed rendering MathJax in preview https://github.com/shd101wyy/crossnote/pull/311.
- Fixed the preview background color https://github.com/shd101wyy/crossnote/pull/312.
- Added error message when failed to parse the YAML front-matter. Also escaped the HTML rendered in the front-matter table in preview. https://github.com/shd101wyy/crossnote/pull/312.

## [0.8.12] - 2023-09-15
