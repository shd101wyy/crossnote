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

[Visit here to see the documentation.](https://shd101wyy.github.io/crossnote/interfaces/NotebookConfig.html)

```js
const config = {
  // File of extensions to be included in the notebook
  markdownFileExtensions: [".md", ".markdown", ".mdown", ".mkdn", ".mkd", ".rmd", ".qmd", ".mdx"],

  // The content to be included in HTML `<head>` tag.
  // This is useful for adding custom styles or scripts.
  includeInHeader: "",

  // Markdown parser to use for rendering.
  // Options: 'markdown-it' (default), 'pandoc', 'markdown_yo'
  // - 'markdown-it': built-in markdown-it renderer
  // - 'pandoc': render via Pandoc (requires Pandoc installed)
  // - 'markdown_yo': high-performance renderer (see below); markdown-it is
  //   still used for token-based operations (backlink extraction, etc.)
  markdownParser: 'markdown-it',

  // Path to the markdown_yo native binary.
  // When set and markdownParser is 'markdown_yo', crossnote invokes this binary
  // (via stdin/stdout) instead of the bundled WASM module.
  // See the "markdown_yo" section below for performance guidance.
  // Supports $HOME and ~ variable substitution. Default: '' (use WASM).
  markdownYoBinaryPath: '',

  // In Markdown, a single newline character doesn't cause a line break in the generated HTML. In GitHub Flavored Markdown, that is not true. Enable this config option to insert line breaks in rendered HTML for single newlines in Markdown source.
  breakOnSingleNewLine: true,

  // Whether to enable preview zen mode.
  // Enable this option will hide unnecessary UI elements in preview unless your mouse is over it.
  enablePreviewZenMode: boolean;

  // Enable smartypants and other sweet transforms.
  enableTypographer: false,

  // Enable conversion of URL-like text to links in the markdown preview.
  enableLinkify: true,

  // Math
  mathRenderingOption: "KaTeX",  // "KaTeX" | "MathJax" | "None"
  mathInlineDelimiters: [["$", "$"], ["\\(", "\\)"]],
  mathBlockDelimiters: [["$$", "$$"], ["\\[", "\\]"]],
  mathRenderingOnLineService: "https://latex.codecogs.com/gif.latex", // "https://latex.codecogs.com/svg.latex", "https://latex.codecogs.com/png.latex"
  mathjaxV3ScriptSrc: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',

  // Enable Wiki Link syntax support. More information can be found a  https://help.github.com/articles/adding-links-to-wikis/
  enableWikiLinkSyntax: true,
  // If checked, we use GitHub style piped wiki links, i.e. [[linkText|wikiLink]]. Otherwise, we use
  // [[wikiLink|linkText]] as the original Wikipedia style.
  useGitHubStylePipedLink: true

  // Enable emoji & font-awesome plugin. This only works for markdown-it parser, but not pandoc parser.
  enableEmojiSyntax: true

  // Enable extended table syntax to support merging table cells.
  enableExtendedTableSyntax: false

  // Enable CriticMarkup syntax. Only works with markdown-it parser.
  // Please check http://criticmarkup.com/users-guide.php for more information.
  enableCriticMarkupSyntax: false

  // Front matter rendering option
  frontMatterRenderingOption: 'none', // 'none' | 'table' | 'code block'

  // Mermaid theme
  mermaidTheme: 'default', // 'default' | 'dark' | 'forest'

  // Code Block theme
  // If `auto.css` is chosen, then the code block theme that best matches the current preview theme will be picked.
  codeBlockTheme: 'auto.css',
  //  "auto.css",
  //  "default.css",
  //  "atom-dark.css",
  //  "atom-light.css",
  //  "atom-material.css",
  //  "coy.css",
  //  "darcula.css",
  //  "dark.css",
  //  "funky.css",
  //  "github.css",
  //  "github-dark.css"
  //  "hopscotch.css",
  //  "monokai.css",
  //  "okaidia.css",
  //  "one-dark.css",
  //  "one-light.css",
  //  "pen-paper-coffee.css",
  //  "pojoaque.css",
  //  "solarized-dark.css",
  //  "solarized-light.css",
  //  "twilight.css",
  //  "vue.css",
  //  "vs.css",
  //  "xonokai.css"

  // Preview theme
  previewTheme: 'github-light.css',
  // "atom-dark.css",
  // "atom-light.css",
  // "atom-material.css",
  // "github-dark.css",
  // "github-light.css",
  // "gothic.css",
  // "medium.css",
  // "monokai.css",
  // "newsprint.css",
  // "night.css",
  // "none.css",
  // "one-dark.css",
  // "one-light.css",
  // "solarized-dark.css",
  // "solarized-light.css",
  // "vue.css"

  // Revealjs presentation theme
  revealjsTheme: "white.css",
  // "beige.css",
  // "black.css",
  // "blood.css",
  // "league.css",
  // "moon.css",
  // "night.css",
  // "serif.css",
  // "simple.css",
  // "sky.css",
  // "solarized.css",
  // "white.css",
  // "none.css"

  // Accepted protocols for links.
  protocolsWhiteList: "http://, https://, atom://, file://, mailto:, tel:",

  // When using Image Helper to copy images, by default images will be copied to root image folder path '/assets'
  imageFolderPath: '/assets',

  // Whether to print background for file export or not. If set to `false`, then `github-light` preview theme will b  used. You can also set `print_background` in front-matter for individual files.
  printBackground: false,

  // Chrome executable path, which is used for Puppeteer export. Leaving it empty means the path will be found automatically.
  chromePath: '',

  // ImageMagick command line path. Should be either `magick` or `convert`.
  // Leaving it empty we will use `sharp` instead.
  imageMagickPath: '',

  // Pandoc executable path
  pandocPath: 'pandoc',

  // Pandoc markdown flavor
  pandocMarkdownFlavor: "markdown-raw_tex+tex_math_single_backslash",

  // Pandoc arguments e.g. ['--smart', '--filter=/bin/exe']. Please use long argument names.
  pandocArguments: [],

  // Default latex engine for Pandoc export and latex code chunk.
  latexEngine: 'pdflatex',

  // Enables executing code chunks and importing javascript files.
  // This enables also the sidebar table of content.
  // ⚠ ️ Please use this feature with caution because it may put your security at risk!
  //    Your machine can get hacked if someone makes you open a markdown with malicious code while script execution is enabled.
  enableScriptExecution: false,

  // Enables transform audio video link to to html5 embed audio video tags.
  // Internally it enables markdown-it-html5-embed plugins.
  enableHTML5Embed: false,

  // Enables video/audio embed with ![]() syntax (default).
  HTML5EmbedUseImageSyntax: true,

  // Enables video/audio embed with []() syntax.
  HTML5EmbedUseLinkSyntax: false,

  // When true embed media with http:// schema in URLs. When false ignore and don't embed them.
  HTML5EmbedIsAllowedHttp: false,

  // HTML attributes to pass to audio tags.
  HTML5EmbedAudioAttributes: 'controls preload="metadata" width="320"',

  // HTML attributes to pass to video tags.
  HTML5EmbedVideoAttributes: 'controls preload="metadata" width="320" height="240"',

  // Puppeteer waits for a certain timeout in milliseconds before the document export.
  puppeteerWaitForTimeout: 0,

  // Args passed to puppeteer.launch({args: $puppeteerArgs})
  puppeteerArgs: [],

  // Render using PlantUML server instead of binary. Leave it empty to use the plantuml.jar file at `plantumlJarPath` (`java` is required in system path). Eg: "http://localhost:8080/svg/".
  // You run start a plantuml server by running:
  // $ docker run -d -p 8080:8080 plantuml/plantuml-server:jetty
  plantumlServer: "http://localhost:8080/svg/",

  // The absolute of the PlantUML jar file.
  // The plantuml.jar file could be downloaded from https://sourceforge.net/projects/plantuml/
  plantumlJarPath: "",

  // Example values:
  // - cdn.jsdelivr.net
  // - fastly.jsdelivr.net
  // - gcore.jsdelivr.net
  // - testingcf.jsdelivr.net
  jsdelivrCdnHost: "cdn.jsdelivr.net",

  // Kroki server url.
  krokiServer: "https://kroki.io",

  // The WebSequenceDiagrams server URL.
  webSequenceDiagramsServer: "https://www.websequencediagrams.com";

  // API key for WebSequenceDiagrams. Required for wider diagram sizes.
  webSequenceDiagramsApiKey: "";

  // Always show backlinks in the preview.
  alwaysShowBacklinksInPreview: false,
}
```

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
