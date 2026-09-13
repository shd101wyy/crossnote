# `crossnote serve` — standalone preview server + browser app

Status: **implemented** (updated 2026-09-12; all milestones landed on `feat/serve`)

## Goal

Add a CLI (`crossnote serve [directory] [--port] [--host] [--vscode]`) that starts an HTTP
server rendering markdown previews of the given directory (default: cwd), plus a
browser-side "server app" with a VS Code–like editor layout: tabs, split panes, drag & drop,
a `Ctrl/Cmd+P` fuzzy file picker, live reload on file change, and the existing in-preview
editor writing back to disk.

## Key architectural facts (verified in repo)

- The webview (`out/webview/preview.js`, from `src/webview/preview.tsx`) is host-agnostic:
  it talks to its host via `postMessage({command, args})` (through `acquireVsCodeApi()` if
  present, else `window.parent.postMessage(..., 'file://')` — `src/webview/containers/preview.ts:162-232`)
  and renders whatever the host sends in `updateHtml` messages. Initial HTML + config are
  baked into the page by `MarkdownEngine.generateHTMLTemplateForPreview()`
  (`src/markdown-engine/index.ts:893`).
- `crossnote` runs in plain Node (the `vscode` import is type-only). Render pipeline:
  `Notebook.init({notebookPath})` → `notebook.getNoteMarkdownEngine(absPath)` →
  `engine.parseMD(text, {isForPreview: true, ...})` → `{html, tocHTML, ...}`.
- All asset/file URLs (mermaid, katex css, images, …) funnel through
  `utility.addFileProtocol(absPath, vscodePreviewPanel)`. The external mapper installed
  with `utility.useExternalAddFileProtocolFunction(fn)` is only consulted when
  `vscodePreviewPanel` is **truthy** (`src/utility.ts:285`), and the panel is never
  dereferenced — so the server passes a truthy dummy panel and maps:
  - `<crossnoteBuildDir>/...` → `/assets/...`
  - `<served root>/...` → `/files/...`
- Host → webview protocol to implement (mirror of the VS Code extension in
  `vscode-markdown-preview-enhanced/src/preview-provider.ts`): `updateHtml`
  `{markdown, html, tocHTML, totalLineCount, sourceUri, sourceScheme, id, class}`.
- Webview → host commands we handle: `updateMarkdown`, `refreshPreview`, `runCodeChunk`,
  `runAllCodeChunks`, `cacheCodeChunkResult`, `setPreviewTheme`, `setCodeBlockTheme`,
  `setRevealjsTheme`, `clickTagA`, `clickTag`, `clickTaskListCheckbox`, `webviewFinishLoading`,
  `setZoomLevel`, `togglePreviewZenMode`, `open*` links.
- Config merge order copied from the extension's `loadNotebookConfig`
  (`notebooks-manager.ts:137`): defaults ← VS Code settings (vscode mode only) ←
  global `~/.crossnote` (see `getGlobalConfigPath`: `$XDG_CONFIG_HOME/crossnote`,
  `~/.local/state/crossnote`, or `%HOME%\.crossnote`) ← workspace `<dir>/.crossnote`;
  `globalCss` is concatenated; in vscode mode `previewTheme` is always taken from
  VS Code settings. Security-sensitive keys (`enableScriptExecution`, `chromePath`, …)
  are stripped from workspace `config.js` eval by `loadConfigsInDirectory` already.

## Design

### CLI

- `bin/crossnote.js` (shebang, `#!/usr/bin/env node`) → requires `out/cli/index.cjs`.
- `src/cli/index.ts` — arg parsing (no new deps; hand-rolled parser):
  `crossnote serve [directory] [--port <n>] [--host <h>] [--vscode] [--vscode-settings <path>]`.
  Default port 3000 (auto-increment if busy unless `--port` given), host `127.0.0.1`.
- Build: extra esbuild config → `out/cli/index.cjs` (platform node, deps external).

### HTTP server (`src/serve/`)

Zero new runtime deps (`http` + SSE + `fs.watch`).

| Route                          | Purpose                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /`                        | Server app shell (loads `/assets/server-app/server-app.js`)                                                                                                         |
| `GET /preview?file=<abs path>` | `generateHTMLTemplateForPreview` with dummy panel; config `{sourceUri: absPath, isVSCode: false, isServerApp: true}`; injected host shim script before `preview.js` |
| `GET /assets/*`                | Static from crossnote build dir (`out/{webview,dependencies,styles,server-app}`)                                                                                    |
| `GET /files/*`                 | Static from served root, path-traversal guarded                                                                                                                     |
| `GET /api/events`              | SSE: `updateHtml` per file, `config-changed`, `file-deleted`, ping                                                                                                  |
| `POST /api/command`            | `{file, command, args}` — the webview→host bridge (allowlist)                                                                                                       |
| `GET /api/files`               | Markdown file list for the picker (recursive walk, skips `node_modules`/`.git`, respects `.gitignore` via `ignore` dep)                                             |
| `GET /api/config`              | Effective merged config                                                                                                                                             |

Host shim (`src/serve/preview-host.js`, served at `/assets/preview-host.js`): defines
`window.acquireVsCodeApi()` (postMessage → `parent.postMessage(msg, origin)` + localStorage
getState/setState) so the unmodified webview bundle works inside an iframe.

Live reload: `fs.watch(root, {recursive:true})` on darwin/win32, mtime polling fallback on
Linux; debounced per-file re-render with per-file latest-render token (out-of-order guard,
same idea as the extension's `renderRequestId`).

### Server app (`src/server-app/`)

New React entry (`main.tsx`), built by the existing webview esbuild config (tailwind +
daisyui + asset loaders reused). State:

- **Pane tree**: recursive `{direction: 'row'|'column', children: [...]}`; leaves are panes
  with `tabs: string[]` (file paths) + `activeTabIndex`. Resizable splitters (pointer
  events, no dep). Welcome tab when a pane is empty.
- **Tabs**: filename label, close button, drag & drop (reorder in pane, move across panes,
  drop on splitter edge → split). VS Code-ish dark chrome.
- **File picker** (`Ctrl/Cmd+P`): modal, fuzzy match (basename boost), ↑/↓/Enter/Esc,
  recents first when query empty (localStorage).
- **Iframe hosts**: one per open file, `display:none` when inactive; on activation re-send
  last `updateHtml` (rehydrates layout-dependent rendering). Routes SSE `updateHtml` by
  `file`; forwards iframe `postMessage` commands to `/api/command` via `event.source`.
- Client-handled commands: `clickTagA` (local md → open tab; external → `window.open`),
  `open*` docs links → `window.open`, `togglePreviewZenMode` → hide app chrome,
  `revealLine` → ignore (no external editor).
- Keyboard: `Ctrl/Cmd+P` picker, `Ctrl/Cmd+W` close tab, `Ctrl/Cmd+\` split active pane.

### Webview changes (minimal, non-breaking)

- `WebviewConfig.isServerApp?: boolean` + gate context-menu items that need a VS Code host:
  hide _open-in-browser_, _open-in-external-editor_, _translate_, exports submenu, image
  helper, graph view / backlinks entries until server support lands. Keep: themes, zoom,
  zen mode, copy, in-preview editor, about links.

### Config (`src/serve/config.ts`)

- Standalone mode: defaults ← global dir ← workspace dir (global dir auto-created).
- `--vscode` mode: additionally reads VS Code user `settings.json` (JSONC via `json5`,
  auto-detect stable/insiders, `--vscode-settings` override) at the bottom of the merge;
  `previewTheme`/`codeBlockTheme`/`revealjsTheme` win from VS Code settings, like the
  extension.
- Writes on theme change from the preview context menu:
  - standalone → merge into global `~/.crossnote/config.js` (rewrite as pretty `({...})`).
  - `--vscode` → surgical text edit of VS Code user `settings.json`
    (`"markdown-preview-enhanced.previewTheme": "..."`) preserving comments/formatting;
    insert before final `}` if absent.
- After any config change: `notebook.updateConfig(merged)`, re-render everything, SSE
  `config-changed`, app reloads iframes (styles live in `<head>`; full swap is the same
  approach the extension takes for theme changes).

### In-preview editor + code chunks

- `updateMarkdown [sourceUri, text]` → write file (guarded to root) → watcher re-renders →
  SSE `updateHtml` (single code path for external edits and in-preview saves).
- `runCodeChunk` / `runAllCodeChunks` / `cacheCodeChunkResult` → engine methods, gated by
  `enableScriptExecution` exactly as in VS Code.

## Milestones

1. **M1** — CLI skeleton, HTTP server, `/preview` end-to-end in a plain browser tab ✅.
2. **M2** — Server app: welcome page, Ctrl+P picker, tabs, iframes + shim, message bridge, ✅
   watcher + SSE live reload. ✅
3. **M3** — In-preview editor write-back, code chunk run, task checkbox toggle ✅.
4. **M4** — Config manager + `--vscode`, theme sync, context-menu gating, iframe reload ✅.
5. **M5** — Split panes, tab drag & drop, zen mode, keyboard shortcuts ✅.
6. **M6** — Jest tests for server endpoints/watcher/config, build wiring, README + ✅
   CHANGELOG, `pnpm check && pnpm test` green. ✅

## Multi-root support (added after initial implementation)

`crossnote serve dir1 dir2 …` serves several directories like a VS Code
multi-root workspace: one Notebook (and config context) per root sharing the
global config layer, one watcher per root, `/api/files` entries tagged with
`rootPath`, and `/files/<rel>?root=<i>` hints from the URL mapper so the same
relative path in two roots resolves unambiguously (unhinted requests try
roots in order). The app shows the folder prefix in the picker and `+N` in
the title bar; absolute `/…` links resolve against the source file's root.

## Deferred (not in this PR)

- Graph view tab, backlinks panel data (needs notebook backlink computation wired to SSE).
- Server-side exports (htmlExport/chromeExport via puppeteer) — menu hidden for now.
- Image helper (paste/upload) — menu hidden for now.
- Presentation-mode scroll mapping specifics.
- Noted during browser testing: react-contexify items don't respond to
  synthetic (untrusted) events, so the in-preview editor couldn't be driven
  by automation — its save path (`updateMarkdown`) is covered by tests
  instead.

## Dev notes

- Node 18 via `nix develop --impure -c …` on this machine.
- Test SSE with plain `fetch` + stream parsing in Jest (node environment).
- Always `pnpm build` after changes so `out/` artifacts exist for the CLI to serve.
