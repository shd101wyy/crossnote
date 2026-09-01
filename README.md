# Crossnote `[WIP]`

Also called as `mume` before.

[![npm](https://img.shields.io/npm/v/crossnote.svg)](https://www.npmjs.com/package/crossnote)
[![npm](https://img.shields.io/npm/dt/crossnote.svg)](https://www.npmjs.com/package/crossnote)
[![npm](https://img.shields.io/npm/l/crossnote.svg)](https://www.npmjs.com/package/crossnote)

This library powers:

- [markdown preview enhanced for vscode](https://github.com/shd101wyy/vscode-markdown-preview-enhanced)

API Documentation: https://shd101wyy.github.io/crossnote/

## Installation

```sh
# If you are using npm
$ npm install --save crossnote

# If you are using pnpm
$ pnpm add crossnote

# If you are using yarn
$ yarn add crossnote
```

## Example

```javascript
// CJS
const { Notebook } = require('crossnote');

// ESM
// import { Notebook } from "crossnote"

async function main() {
  const notebook = await Notebook.init({
    notebookPath: '/absolute/path/to/your/notebook',
    config: {
      previewTheme: 'github-light.css',
      mathRenderingOption: 'KaTeX',
      codeBlockTheme: 'github.css',
      printBackground: true,
      enableScriptExecution: true, // <= For running code chunks.

      chromePath: '/path/to/chrome', // <= For puppeteer export and open in browser locally.
      // Recommended to use the absolute path of Chrome executable.
    },
  });

  // Get the markdown engine for a specific note file in your notebook.
  const engine = notebook.getNoteMarkdownEngine('README.md');

  // open in browser
  await engine.openInBrowser({ runAllCodeChunks: true });

  // html export
  await engine.htmlExport({ offline: false, runAllCodeChunks: true });

  // chrome (puppeteer) export
  await engine.chromeExport({ fileType: 'pdf', runAllCodeChunks: true }); // fileType = 'pdf'|'png'|'jpeg'

  // prince export
  await engine.princeExport({ runAllCodeChunks: true });

  // ebook export
  await engine.eBookExport({ fileType: 'epub' }); // fileType = 'epub'|'pdf'|'mobi'|'html'

  // pandoc export
  await engine.pandocExport({ runAllCodeChunks: true });

  // markdown(gfm) export
  await engine.markdownExport({ runAllCodeChunks: true });

  return process.exit();
}

main();
```

## Notebook Configuration

All notebook configuration options — types, defaults, and per-field documentation — live in the API reference:

👉 [NotebookConfig](https://shd101wyy.github.io/crossnote/interfaces/NotebookConfig.html)

The snippet in the [Example](#example) section above shows the commonly used options (`previewTheme`, `codeBlockTheme`, `mathRenderingOption`, `printBackground`, `enableScriptExecution`, `chromePath`, ...).

## Notebook Local Configuration

If your notebook has `.crossnote` directory, then when you run `await Notebook.init`, it will automatically create several configuration files in `.crossnote` directory and load the configurations.

```
.crossnote
├── config.js
├── head.html
├── parser.js
└── style.less
```

## markdown_yo (Experimental)

Crossnote supports an optional high-performance markdown renderer called [markdown_yo](https://github.com/shd101wyy/markdown_yo), written in the [Yo programming language](https://github.com/shd101wyy/Yo) and compiled to WebAssembly. When enabled, it replaces markdown-it for HTML rendering while markdown-it is still used for token-based operations (backlink extraction, note mention processing, etc.).

To enable it, set `markdownParser: 'markdown_yo'` in your notebook config.

### Performance

By default, crossnote uses the **WASM** build of markdown_yo. The WASM module is initialized once per notebook and reused for all subsequent renders. The table below shows steady-state render times (WASM module already loaded) measured on an x86_64 Linux machine, compared to the native binary invoked as a subprocess:

| Input Size | markdown-it | WASM (pre-init) | Native binary (spawn) |
| ---------- | ----------- | --------------- | --------------------- |
| 60 KB      | ~1.6 ms     | ~1 ms           | ~2 ms                 |
| 256 KB     | ~6.7 ms     | ~4 ms           | ~3 ms                 |
| 1 MB       | ~28.8 ms    | ~83 ms          | ~64 ms                |
| 18 MB      | ~722 ms     | ~344 ms         | ~246 ms               |

_WASM times are measured in-process with a pre-initialized renderer (typical crossnote usage). Native binary times include process spawn + stdin/stdout I/O overhead._

For very large files (≥1 MB), the native binary is ~1.3× faster than WASM because WASM's memory overhead grows with document size. For small files (<256 KB), WASM is comparable or slightly faster since there is no subprocess overhead.

### Native Binary

Pre-built binaries for Linux, macOS, and Windows are available at [github.com/shd101wyy/markdown_yo/releases](https://github.com/shd101wyy/markdown_yo/releases).

To use a native binary instead of WASM, set `markdownYoBinaryPath`:

```yaml
markdownParser: markdown_yo
markdownYoBinaryPath: /path/to/markdown_yo
```

Supports `$HOME` and `~` variable substitution. The `breakOnSingleNewLine` option is not supported by the native binary CLI and is silently ignored when this path is set.

### Supported Features

markdown_yo supports CommonMark, GFM tables, strikethrough, and these extensions: subscript, superscript, mark/highlight, math ($..$ / $$..$$), emoji shortcodes, wikilinks, CriticMarkup, abbreviations, definition lists, admonitions, callouts, footnotes, source maps, and line breaks.

## Development

1.  Clone this project.
2.  Run `pnpm install` from shell.
3.  Run `pnpm build:watch` to start the watch mode.
4.  Run `pnpm build` to build the project.

Or

If you already have [nix](https://nixos.org/download.html) and [direnv](https://direnv.net/) installed, simply cd to the project directory, then run `direnv allow` once.

## License

[University of Illinois/NCSA Open Source License](LICENSE.md)
