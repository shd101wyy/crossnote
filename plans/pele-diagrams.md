# Pele diagrams — the `pele` code fence

Status: **implemented** (PR [#581](https://github.com/shd101wyy/crossnote/pull/581),
squash-merged into `develop` on 2026-11-26)

## Goal

Let a note draw a diagram by writing Mermaid syntax in a `pele` fenced code block
(also `:::pele`, and `@import "x.pele";`), rendered by [pele](https://pele.run)
(<https://www.npmjs.com/package/pele>) everywhere crossnote renders mermaid
diagrams: the VS Code preview, `crossnote serve`, the wiki, presentations, HTML
export, PDF (through Chrome; the Prince export has not been tried), and the
pandoc / markdown exports.

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
  (`vm.runInNewContext(code + ';pele', { URL })`): it loads in ~13 ms and
  renders synchronously. So the pandoc image path can render pele in Node after
  all. **The context needs `URL`**: pele checks `http:` / `https:` targets with
  `new URL(…)` inside a try/catch, and where the constructor is missing it
  throws nothing — every web link and image is just left out (found by the
  Node-vs-browser test).
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
- **The output is a pure function of the source and the options** — but of all
  the options: every diagram changes with `fontFamily` / `fontFamilyMono`, a
  sankey's gradient ids and a cynefin's wavy borders change with `idPrefix`.
  So "the same diagram drawn twice" only compares like for like with the same
  options, and a comparison across id prefixes has to leave path outlines out.
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
- Every preview theme but `none.css` gives `<body>` its background color, so
  the scheme of an exported document can be read the same way (the export
  script does); `none.css` leaves it to the page — in VS Code to the editor
  background.

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
- `transformer.ts`: `@import "x.pele";` becomes a `pele` fence, like `.mermaid`.
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
  `process`, and `URL` — see above; `src/lib/pele-bundle.ts`) once per file
  and keeps the `pele` object.
- `renderPele(source)`: the SVG with every `var()` resolved to its fallback
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

- `styles/style-template.less`: `:where(html:has(> body[data-preview-theme='dark'])) { … }`
  with the dark palette from pele's theming guide (preview and export share the
  file). Light pages use pele's own defaults. Users can override any
  `--pele-*` variable from `globalCss`, whatever selector it is written with
  (#603).

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
3. **Webview + scripts + theming** — done. `src/webview/lib/pele.ts`, preview
   container (note refresh, and every slide of a presentation when the deck is
   initialised), script tags (preview, export, offline / CDN), the export
   script `src/markdown-engine/pele-export.ts` and the `chromeExport` check,
   dark palette keyed on `<body data-preview-theme>`. In an exported document
   the scheme is read where the page is painted — `<body>`, else `<html>` —
   and a page that paints neither is the white canvas it is shown on, a light
   page; the preview takes such a page for dark (it sits in an app that is
   dark by default). A color is read through one pixel of a canvas, so that a
   fractional alpha and a color written as `oklch()` or a `color-mix()` come
   out right; where the engine has no canvas, `rgb()` and `rgba()` are read
   from the text.
4. **Tests and docs** — jest suites per area (engine, Node renderer, vendored
   bundle, webview helper incl. a hostile-diagram security test through the
   real bundle and the real sanitizer, export template and script) and
   `test/browser/pele.spec.ts` in Chromium (all 33 documented diagram types
   through the real bundle, preview vs export script, Node vs browser, colors
   and scheme changes, APIs of the webview floor deleted, the real preview
   container for a note and a presentation) are green; 33 types looked at in
   light and dark, in the preview and in an exported document. CHANGELOG entry
   written; `pnpm check`, `pnpm test` and `pnpm build` run.

   Also run in a real VS Code with vscode-markdown-preview-enhanced built
   against this branch, on 1.138 and on 1.82 (webview Chromium 114): a note in
   the extension's default preview theme, in `github-dark.css` and in
   `none.css` under a dark color theme — the palette follows the page — with
   the preview following an edit on disk; and a deck with `white.css` and with
   `night.css`, every slide's diagram in before the slide is shown and each
   slide centered with it — and once more for the decks after the rebase onto
   reveal.js 6.0.2. The extension's `copy-files` takes
   `crossnote/out/dependencies/**` as a whole, so the `pele` directory ships
   with the next crossnote bump and needs nothing on the extension's side.

   Learned there: the page of a preview is painted by its preview theme (the
   extension defaults to `github-light.css`), a presentation's by its Reveal
   theme — not by the color theme of VS Code, unless the preview theme is
   `none.css`.

5. **Ship** — done. Push, PR, self-review, two independent reviews (below),
   CI green, squash merge.

Out of scope, noted for the PR: a `pele` → mermaid grammar mapping for editor
highlighting in vscode-markdown-preview-enhanced; a notebook option to render
`mermaid` fences with pele.

## Review

Before the merge, the PR head at the end of milestone 4 (`852cf94`) was read by
two independent reviewers, one for correctness and one for security, both
read-only, and each came back with "safe after specific fixes". What they
found is fixed in the commits that follow it; what they left open is at the
end.

**Correctness.** The core was found sound: the variable inliner, `renderPele`,
the pandoc path, the order of the export scripts, the webview parity, the
runtime floors, the vendored bytes.

- `@import("x.pele")` was documented in three places; the engine accepts
  `@import "x.pele";` only.
- The export script read a background color as whole numbers, so a
  mostly-opaque dark `rgba(…, 0.8)` came out transparent and the page light,
  and an `oklch()` or `color-mix()` color was only guessed at. One pixel of a
  canvas is read now (milestone 3).
- The Chrome export captured a document silently when the drawing script had
  not reached a diagram, which then held its source text. It fails now.
- `pele-flow` was a pele diagram in the pandoc and markdown exports and a code
  block in the preview. It is a code block in both.
- Comments and docs that said more than the code does, two unused re-exports,
  tests that asserted the text of the export script rather than its effect,
  and a floor list that named three APIs Chromium 114 has.

**Security.** About 281,000 hostile renders of the vendored bundle came out
with no injected element or attribute, no script-scheme `href` and no `url()`
in a style. The sanitizer changes one thing over the fixtures (`target` on
`<a>`); librsvg fetches nothing for an `<image>`; 43,819 hostile sources
through the export script in a real browser gave nothing. Two things to fix:

- **A pele error could close the code block it is written in** — in the pandoc
  and markdown exports. `processGraphs` writes an error behind a fence of
  three backticks, an error quotes its source, and pele reads a bare carriage
  return as a line break: a line of the note that no markdown parser sees as a
  fence came out of the error as a line of three backticks, and the diagram
  text after it was markup in the exported document. Verified end to end by
  the reviewer with the real `processGraphs`, markdown-it and pandoc, and now
  by a test of `processGraphs`. `diagramErrorBlock` makes carriage returns
  newlines and writes a fence longer than any run of backticks in the message
  — for every diagram type, as the sink was shared by all of them.
- **No test looked at the SVG as it is.** The hostile corpus went through the
  webview's sanitizer only, and an exported document has none. The corpus is
  `test/fixtures/pele-hostile.ts` now, with the variants the review probed,
  and `test/pele-vendor.test.ts` draws it with the bundle as exported
  documents get it: only pele's own elements, every attribute in quotes, no
  event handler, links only to the web, mail, the phone or the page, no style
  that reaches outside the diagram. Step 7 of the bundle checklist.

**Left open.**

- The CDN script of a non-offline export carries no integrity attribute; its
  digest is pinned already. Every other CDN tag of the engine has the same
  gap, so it is a change of its own.
- A link of a diagram's own (`internal-link`) whose target is refused keeps
  the label in a `data-href` attribute, without an `href`. Nothing of
  crossnote reads `data-href`, so it goes nowhere; the raw-SVG test draws it
  as the inert trace it is.
- A pathological diagram costs seconds and some hundreds of MB to rasterize in
  the pandoc export, which runs in the extension host. It is bounded by
  librsvg's pixel limit and pele's source limit, and is self-inflicted.
- In `crossnote serve` with the light theme of the app and the `none.css`
  preview theme, the preview marks a page that paints nothing as dark and
  draws the dark palette on a light page, where the export draws the light
  one (milestone 3).
- The PDF export through Prince hands the scripts to Prince's own JavaScript
  engine. Not tried: Prince is not installed here.
- Not of this PR, found on the way: block attributes are put on their element
  with their values not escaped — `{id="a><img …>"}` makes an element, whose
  handler the sanitizer strips afterwards — and that for every block type.
- The text output of a code chunk (`output=text`) is written behind a bare
  fence of three backticks too: an output that holds such a line is cut short
  there. Not of this PR either.
