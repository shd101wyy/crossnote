# Pele diagrams — the `pele` code fence

Status: **in progress** (started 2026-11-25 on `feat/pele-diagrams`, off `develop`)

## Goal

Let a note draw a diagram by writing Mermaid syntax in a `pele` fenced code block
(also `:::pele`, and `@import("x.pele")`), rendered by [pele](https://pele.run)
(<https://www.npmjs.com/package/pele>) everywhere crossnote renders mermaid
diagrams: the VS Code preview, `crossnote serve`, the wiki, presentations, HTML
export, PDF (Chrome, Prince), and the pandoc / markdown exports.

## Why this shape

`pele` is not a diagram language. It is a renderer for Mermaid syntax — a
replacement for mermaid.js (MIT, no dependencies, synchronous, themed with CSS
variables). So the feature is a new **fence** whose source is rendered by a
different engine, not a new diagram syntax:

````
```pele
flowchart LR
  A[Mermaid text] --> B[SVG]
```
````

A notebook-wide switch that renders `mermaid` blocks with pele was considered
and left out: it would change how existing notes look (own layout, Mermaid
themes don't apply) and touches every mermaid surface at once. The fence is
purely additive, and the two can coexist in one note.

## Facts verified before planning (pele 1.13.0)

- **Package**: ESM-only (`"type": "module"`, `import` conditions only), `engines.node >= 20`.
  It cannot go through crossnote's Node 18 CJS output as a dependency. Its
  browser build `dist/pele.global.js` (733 KB) is a classic script that defines
  the global `pele` — the same shape as the vendored mermaid bundle.
- **That global build runs on Node 18.20.8** when evaluated as a script
  (`vm.runInNewContext(code + ';pele', {})`): it loads in ~13 ms and renders
  synchronously. So the pandoc image path can render pele in Node after all.
- **No API newer than the webview floor** (VS Code 1.82 / Chromium 114) is
  called by the bundle, and it parses on Node 18 (V8 10.2), which is older than
  Chromium 114's engine.
- **Output**: one `<svg class="pele pele-<type>" viewBox width height
style="max-width:100%;height:auto;--_bg:var(--pele-bg,#fff);…">`. Responsive
  by default. Colours are CSS variables with light fallbacks, declared inline
  on the root — theming means setting `--pele-*` on the svg or an ancestor.
- **Text is measured on a canvas** (`measureText`), not by DOM layout: no
  dependence on the zoom of the preview, on transforms of ancestors, or on the
  node being laid out. None of mermaid's measure-host / timeout machinery is
  needed, and a render takes 0.1–6 ms, so there is no cache.
- **Security**: pele escapes label text, ignores JavaScript `click` callbacks,
  drops `javascript:`/`data:`/`vbscript:` links, filters diagram styles, and
  limits source (50 000 chars), output (4 000 000 chars) and edges (5 000).
  Passing its output through crossnote's webview `sanitizeHtml` config removes
  one thing only: `target` on `<a>` (63 example diagrams + a hostile corpus
  checked). The webview still sanitizes (AGENTS.md requires it for third-party
  SVG); the export document inserts pele's output as mermaid's is inserted.
- **Errors**: `render()` throws `PeleError` with `code`, `line`, `column`, and
  a message that quotes the diagram source — to be shown as text, never markup.
- **librsvg (sharp) does not understand `var()`** — an unrasterized pele SVG
  comes out solid black. Resolving the variables to their fallback values
  first gives a correct raster.

## Facts verified in the repo

- mermaid is not bundled into `preview.js`. `dependencies/mermaid/mermaid.min.js`
  (5.3 MB) is vendored and loaded by a `<script>` tag from
  `generateScriptsForPreview` (`src/markdown-engine/index.ts`), which the VS Code
  preview, `crossnote serve` and the wiki all go through. The wiki turns every
  build asset into an inline token generically, so a new script tag needs no
  wiki change.
- The engine turns a `mermaid` fence into `<div class="mermaid …">{escaped
source}</div>` (`src/render-enhancers/fenced-diagrams.ts`); the webview
  renders those nodes (`renderMermaid` in `src/webview/containers/preview.ts`,
  `renderMermaidDiagram` in `src/webview/lib/mermaid.ts`).
- HTML export adds mermaid only when the document has one
  (`html.indexOf(' class="mermaid')`), offline from the vendored file or
  inlined, otherwise from jsDelivr, plus an init script
  (`src/markdown-engine/mermaid-export.ts`). `chromeExport` waits on
  `window.__crossnoteMermaidExport`.
- The pandoc and markdown exports go through `processGraphs`
  (`src/converters/process-graphs.ts`): svg → png with sharp / ImageMagick for
  most diagrams; mermaid shells out to mermaid-cli.
- The webview already marks the page's scheme on `<body data-preview-theme>`
  (luminance of the computed body background; `styles/preview.less` keys on it).

## Design

### Vendoring — no npm dependency

- `dependencies/pele/pele.global.js`: the official jsDelivr build
  (`https://cdn.jsdelivr.net/npm/pele@<version>/dist/pele.global.js`),
  byte-identical, downloaded by `scripts/update-pele-bundle.mjs <version>`.
- `test/pele-vendor.test.ts`: not empty or truncated, is the official build
  (banner + `"use strict";var pele=`), banner version = the version list in
  `dependencies/README.md` = the CDN fallback in `markdown-engine/index.ts`,
  parses on Node 18, calls no API newer than the webview floor, exposes
  `render` and `PeleError`.
- No `pele` entry in `package.json`: nothing is imported from it at build
  time, its `engines` would be a false alarm on Node 18, and the types
  crossnote needs are three small structural interfaces.

### Engine

- `fenced-diagrams.ts`: `pele` in `supportedLanguages`; emits
  `<div class="pele …attrs">{escape(code)}</div>` (rendered on the client).
  `code_block=true`, `hide`, `output_first` behave as for mermaid.
- `COLON_FENCE_CODE_LANGUAGES` += `pele` (`:::pele`).
- `transformer.ts`: `@import("x.pele")` becomes a `pele` fence, like `.mermaid`.
- `extension-helper.ts`: prism scope of `pele` = `mermaid`.

### Webview — `src/webview/lib/pele.ts`

- `renderPeleDiagram(node, code, pele)`: `pele.render(code, { idPrefix,
fontFamily, fontFamilyMono })`, then `node.innerHTML = sanitizeHtml(svg)`.
  The font is `--pele-font` from CSS when set, else the computed font of the
  node, so labels are measured in the font they are drawn in. A `PeleError` is
  shown as escaped text, like a mermaid error. Marks the node `data-processed`.
- `renderPeleDiagrams(root)`: every `div.pele:not([data-processed])` under
  `root`. Synchronous; no cache; a node that went out of the document cannot be
  written to because nothing is awaited.
- Preview: called in `initEvents` beside `renderMermaid`.
- Presentations: rendering needs no layout, so all slides' pele diagrams are
  rendered once when the deck is initialised, before the first slide is shown —
  not slide by slide as mermaid's are.

### Node — `src/renderers/pele.ts`

- Evaluates the vendored build in a fresh `vm` context (no `require`, no
  `process`) once per process and keeps the `pele` object.
- `renderPeleSvg(source)`: the SVG with every `var()` resolved to its fallback
  value (light), on an opaque white background, for rasterizers without CSS
  variables.
- `processGraphs`: a `pele` fence takes the svg → png path (sharp / ImageMagick),
  cached by checksum like the other diagrams. No external tool, unlike mermaid.

### Scripts

- `generateScriptsForPreview`: load the vendored pele build next to mermaid's.
- `generateHTMLTemplateForExport`: when the document has a pele diagram, load
  it (offline: vendored file, inlined when embedding; else jsDelivr) and run
  `buildPeleExportScript()` (`src/markdown-engine/pele-export.ts`): mark the
  page scheme on `<body data-preview-theme>`, render every `div.pele`, and
  report `window.__crossnotePeleExport = { status }`, which `chromeExport`
  checks like the mermaid one.

### Theming

- `styles/style-template.less`: `[data-preview-theme='dark'] .pele { … }` with
  the dark palette from pele's theming guide (preview and export share the
  file). Light pages use pele's own defaults. Users can override any
  `--pele-*` variable from `globalCss`.

### Security

- The diagram author controls the source and block attributes only. Render
  options that widen what a diagram can do (`linkSchemes`, `imageSchemes`,
  `links`, `images`, `icons`, `math`, the limits) are never read from the fence.
- The webview sanitizes pele's SVG with `sanitizeHtml` before insertion; links
  in it go through the preview's anchor handler. Export documents rely on
  pele's own escaping, as they rely on mermaid's.
- The vendored file is byte-identical to the official build and guarded by tests.

## Milestones

One commit per milestone, `pnpm check && pnpm test` green before each.

1. **Vendor** — done. `dependencies/pele/pele.global.js` (sha256 `0b0a46c5…a0910`,
   the same bytes from jsDelivr and from the npm package), update script, vendor
   guard test (which also pins the digest), README.
2. **Engine + Node renderer** — done. Fence, colon fence, import, `div.pele`;
   `src/renderers/pele.ts`; `processGraphs` image path. With the CSS variables
   left unresolved the raster is 98% black; the image test sits at 33% drawn
   pixels against a 2% threshold (checked by removing the resolution).
3. **Webview + scripts + theming** — `src/webview/lib/pele.ts`, preview container, script tags, export script, dark palette.
4. **Tests and docs** — jest suites per area (incl. a hostile-diagram security test through the real bundle and the real sanitizer), a Playwright spec, CHANGELOG, full check/test/build, smoke test in a real VS Code.
5. **Ship** — push, PR, self-review, CI green, squash merge.

Out of scope, noted for the PR: a `pele` → mermaid grammar mapping for editor
highlighting in vscode-markdown-preview-enhanced; a notebook option to render
`mermaid` fences with pele.
