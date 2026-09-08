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
- Dev environment: **use the nix shell** — `shell.nix` provides node and pnpm. If direnv isn't active, prefix commands with `nix develop -c` (e.g. `nix develop -c pnpm check`). Do **not** fall back to `corepack pnpm` or install global pnpm wrappers; the corepack shim invokes `pnpm` differently and is not the supported path here.
- **Node.js is pinned to 18** — the VS Code extension host runs Node 18, which lacks newer globals such as `File`; see [Runtime Support](#runtime-support-nodejs--vs-code) below for the version mapping and the cheerio/engines decisions. The dev shell pins `nodejs_18` via a nixpkgs-24.11 import (the rolling channel dropped Node 18), and all GitHub workflows install the version in [`.tool-versions`](.tool-versions) — keep the two on the same major version. Do not run the suite on Node 20+ and call it green. Dev tooling must stay Node-18-clean too: `lint-staged` is held at 15.x because 16.x requires Node ≥ 20.17 and crashes the pre-commit hook with `SyntaxError: Invalid regular expression flags` (the `/v` RegExp flag is Node 20+).
- Build: `pnpm build` (esbuild + TypeScript declarations)
- Lint: `pnpm check` (ESLint + Prettier + tsc)
- Fix: `pnpm fix` (auto-fix ESLint + Prettier)
- Always run `pnpm check && pnpm test` before committing

### Runtime Support (Node.js / VS Code)

The extension host of the VS Code versions Markdown Preview Enhanced supports runs Node 18, and crossnote must stay loadable there. Verified mapping (VS Code `package.json` pinned Electron versions + the Electron releases dataset, checked 2026-09):

| VS Code     | Electron | Extension-host Node      |
| ----------- | -------- | ------------------------ |
| ≤ 1.81      | 22.x     | 16.17.1                  |
| 1.82 – 1.85 | 25.x     | 18.15.0                  |
| 1.86 – 1.87 | 27.x     | 18.17.1                  |
| newer       | 28.x+    | ≥ 18.18, later 20.x/22.x |

Decisions made after [#493](https://github.com/shd101wyy/crossnote/issues/493) / [#494](https://github.com/shd101wyy/crossnote/pull/494), each verified on the exact Node runtimes above:

- **cheerio is pinned to exactly `1.0.0`** — never widen it back to a `^` range. It is the newest cheerio that loads on Node 18: 1.1+ pulls undici 7 (requires Node ≥ 20.18) and crashes extension activation with `ReferenceError: File is not defined`. cheerio 1.0.0 was verified working on Node 18.15.0 and 18.17.1, and shipped without activation reports from extension 0.8.20 (2025-03) until the yarn→pnpm migration (extension 0.8.32, 2026-08-31) let the old `^1.0.0-rc.12` range float to 1.2.0.
- **`1.0.0-rc.12` was considered and rejected** — its only extra reach is Node 16 (VS Code ≤ 1.81), which crossnote has never claimed (`engines.node >= 18`) and which cheerio 1.0.0 itself cannot serve (`ReadableStream is not defined` on Node 16).
- **The supported `engines.vscode` floor (in vscode-markdown-preview-enhanced) is `^1.82.0`** — the first VS Code whose extension host runs Node 18 (Electron 25 → Node 18.15.0). VS Code 1.82–1.85 sit below cheerio's declared floor (Node 18.17) but are verified working, and the full crossnote test suite passes on Node 18.15.0.
- Node globals newer than 18 (`File`, …) must not be assumed; `test/runtime-compat.test.ts` guards this. **sharp is held to the 0.34.x line** (`^0.34.3`): sharp 0.35's prebuilt platform packages (`@img/sharp-*`) declare Node ≥ 20.9, and installers skip engines-incompatible optional dependencies — so a fresh install on Node 18 produces a sharp with no platform binaries that fails at import with `Could not load the "sharp" module`. 0.34 is the newest line whose prebuilds declare `^18.17.0`. (0.35 appeared to work on Node 18 only because a warm `node_modules` had been installed under a newer Node — verify such things with fresh installs, not warm ones.)

## Release Process

Releases are automated via [`.github/workflows/release.yml`](.github/workflows/release.yml), triggered manually (**workflow_dispatch**) with a `bump` level of `patch` / `minor` / `major` / `prerelease`. Do **not** bump `package.json` or cut tags by hand.

What the workflow does, in order:

1. Runs `pnpm check`, `pnpm test`, `pnpm build`
2. Bumps `package.json` (`npm version <level>`)
3. Rewrites `CHANGELOG.md`: renames `## [Unreleased]` to `## [X.Y.Z] - <today>` and prepends a fresh empty `## [Unreleased]` section — **write changelog entries under `[Unreleased]` before dispatching a release**
   - **Crediting contributors**: every entry that references a PR must credit its author (e.g. `([#455](…) by @author)`); for entries that reference an issue report, use `Reported by @author`.
4. Publishes to npm (`prerelease` bumps go to the `next` dist-tag, never `latest`)
5. Commits the bump, tags it, pushes the `release/vX.Y.Z` branch + tag (no direct push to `master` — it is branch-protected and deprecated), creates the GitHub Release from the tag with the changelog entry
6. Opens a `release/vX.Y.Z` → `develop` PR, approves it via the `RELEASE_TOKEN` secret, and auto-merges it

### Branch protection on `develop`

- Classic branch protection: requires a PR + **1 approving review** before merging; admins (the maintainer) may merge without waiting via "Merge without waiting for requirements"
- No force pushes or deletions; conversation resolution required
- The release PR satisfies the review requirement through the `RELEASE_TOKEN` secret — a fine-grained PAT of the maintainer (Contents + Pull requests: read/write on this repo only). If the token expires, the release PR will stall at the approval step; rotate it and re-run the failed job.

### Notes

- Releases run their own full check/test/build inside the release workflow; workflow pushes use the default `GITHUB_TOKEN`, which does not re-trigger push-based workflows (no recursion)

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

## Updating Mermaid

`dependencies/mermaid/mermaid.min.js` is mermaid's **official dist bundle downloaded from jsDelivr** (`https://cdn.jsdelivr.net/npm/mermaid@<version>/dist/mermaid.min.js`) — never re-bundle mermaid locally with esbuild. Run `pnpm add mermaid@<version>` then `node scripts/update-mermaid-bundle.mjs`, keep the CDN fallback URL in `src/markdown-engine/index.ts` on the same version, and update `dependencies/README.md` + `CHANGELOG.md`. See "Updating the vendored mermaid bundle" in `dependencies/README.md` for the full checklist.

## TikZ Renderer Notes

The TikZ renderer (`src/renderers/tikz.ts`) uses `node-tikzjax` which requires:

- WASM data files (`tex.wasm.gz`, `core.dump.gz`, `tex_files.tar.gz`) present adjacent to the bundle
- `jsdom`'s `xhr-sync-worker.js` resolvable at load time (used by node-tikzjax's DOM manipulation layer)

In development with vscode-markdown-preview-enhanced, `build.js` handles copying these files. If adding new native dependencies with similar WASM or file-path requirements, follow the same pattern in vscode-mpe's `build.js`.

Base TeX packages (`amsmath`, `amssymb`, `amsfonts`, `amstext`, `array`) are loaded for every TikZ render. Specialized packages (`tikz-cd`, `pgfplots`, `circuitikz`, `chemfig`, `tikz-3dplot`) are auto-detected from the source code. Users can override via the `texPackages` fence attribute.
