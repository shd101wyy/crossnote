# Agent Instructions for Crossnote

This file provides context for AI coding agents (GitHub Copilot, Claude, etc.) working in this repository.

## Project Overview

Crossnote is the core markdown rendering engine behind the **Markdown Preview Enhanced** VS Code extension. It parses, transforms, and renders markdown to HTML with support for diagrams, math, code chunks, presentations, and more.

## Architecture

- **`src/notebook/`** — Notebook config, markdown-it initialization, and note management
- **`src/markdown-engine/`** — Core rendering pipeline: `parseMD` transforms markdown → HTML via markdown-it, then enhances with cheerio
- **`src/custom-markdown-it-features/`** — markdown-it plugins (math, emoji, wiki links, widgets, etc.)
- **`src/render-enhancers/`** — Post-render HTML transformations via cheerio (diagrams, code chunks, math, images)
- **`src/renderers/`** — Diagram renderer modules (mermaid, tikz, wavedrom, etc.)
- **`src/webview/`** — React-based preview UI rendered in a VS Code webview (browser context)
- **`src/converters/`** — Export to PDF, ebook, pandoc, etc.

## Key Conventions

### Code Style

- **Single quotes** everywhere (Prettier-enforced)
- **Import order**: Node.js builtins → third-party → relative (alphabetical within groups)
- **Naming**: `camelCase` for functions/variables, `PascalCase` for classes/components/types
- **TypeScript**: `strict: true`, `noUnusedLocals: true` — no `any` types without an ESLint disable comment explaining why

### Testing

- Use **Jest** with `describe`/`test` blocks
- Tests live in `test/` mirroring the `src/` structure
- Data-driven tests use `.expect.md` files in `test/markdown/test-files/`
- Run tests: `pnpm test`

### Build & Lint

- Package manager: **pnpm** (not npm or yarn)
- Build: `pnpm build` (esbuild + TypeScript declarations)
- Lint: `pnpm check` (ESLint + Prettier + tsc)
- Fix: `pnpm fix` (auto-fix ESLint + Prettier)
- Always run `pnpm check && pnpm test` before committing

## Security Requirements

This project processes untrusted markdown content that may contain malicious HTML. **All HTML output must be sanitized before DOM insertion.**

### Server-side (Node.js context)

- HTML rendered by `md.render()` in `parseMD` is sanitized via `sanitizeRenderedHTML()` in `src/markdown-engine/sanitize.ts`
- Uses cheerio (already loaded for post-processing) to strip dangerous elements/attributes
- **Never bypass this sanitization** — it covers all output paths (preview, export, etc.)
- All render enhancers must run **before** `sanitizeRenderedHTML($)` in `parseMD`

### Client-side (webview/browser context)

- All `innerHTML` assignments use `sanitizeHtml()` from `src/webview/lib/sanitize.ts` (DOMPurify wrapper)
- **Never use `innerHTML = unsanitizedString`** or `dangerouslySetInnerHTML={{ __html: unsanitizedString }}`
- Third-party SVG output (mermaid, wavedrom, tikz) must also be sanitized before DOM insertion

### What the sanitizer strips

- `<script>`, `<object>`, `<embed>`, `<applet>` tags
- All `on*` event handler attributes
- `javascript:`, `vbscript:`, `data:text/html` URLs
- `srcdoc` on iframes; forces `sandbox=""` on all iframes

## Important Context

- `markdown-it` is configured with `html: true` (intentional — users need raw HTML in markdown)
- `enableScriptExecution` controls code chunk execution, **not** HTML sanitization
- The webview build (`build.js` → `webviewConfig`) bundles all deps for `platform: 'browser'`
- The library build marks all `package.json` dependencies as `external`
- After making changes, run `pnpm build` so the downstream `vscode-markdown-preview-enhanced` repo can pick up the updated `out/` artifacts via `yarn add ../crossnote`

## Adding a New Diagram Renderer

1. Create `src/renderers/<name>.ts` with a `render<Name>()` export
2. Add a case in `src/render-enhancers/fenced-diagrams.ts`
3. Add tests in `test/<name>.test.ts`
4. Document options in CHANGELOG.md under `[Unreleased]`

## TikZ Renderer Notes

The TikZ renderer (`src/renderers/tikz.ts`) uses `node-tikzjax` which requires:

- WASM data files (`tex.wasm.gz`, `core.dump.gz`, `tex_files.tar.gz`) present adjacent to the bundle
- `jsdom`'s `xhr-sync-worker.js` resolvable at load time (used by node-tikzjax's DOM manipulation layer)

In development with vscode-markdown-preview-enhanced, `build.js` handles copying these files. If adding new native dependencies with similar WASM or file-path requirements, follow the same pattern in vscode-mpe's `build.js`.

Base TeX packages (`amsmath`, `amssymb`, `amsfonts`, `amstext`, `array`) are loaded for every TikZ render. Specialized packages (`tikz-cd`, `pgfplots`, `circuitikz`, `chemfig`, `tikz-3dplot`) are auto-detected from the source code. Users can override via the `texPackages` fence attribute.
