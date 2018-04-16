# MUME

[![Build Status](https://travis-ci.org/shd101wyy/mume.svg?branch=master)](https://travis-ci.org/shd101wyy/mume)

This library powers:

* [markdown preview enhanced for atom](https://github.com/shd101wyy/markdown-preview-enhanced)
* [markdown preview enhanced for vscode](https://github.com/shd101wyy/vscode-markdown-preview-enhanced)

```sh
npm install --save @shd101wyy/mume
```

## Example

```javascript
// node.js
const mume = require("@shd101wyy/mume");

// es6
// import * as mume from "@shd101wyy/mume"

async function main() {
  await mume.init();

  const engine = new mume.MarkdownEngine({
    filePath: "/Users/wangyiyi/Desktop/markdown-example/test3.md",
    config: {
      previewTheme: "github-light.css",
      // revealjsTheme: "white.css"
      codeBlockTheme: "default.css",
      printBackground: true,
      enableScriptExecution: true, // <= for running code chunks
    },
  });

  // open in browser
  await engine.openInBrowser({ runAllCodeChunks: true });

  // html export
  await engine.htmlExport({ offline: false, runAllCodeChunks: true });

  // chrome (puppeteer) export
  await engine.chromeExport({ fileType: "pdf", runAllCodeChunks: true }); // fileType = 'pdf'|'png'|'jpeg'

  // phantomjs export
  await engine.phantomjsExport({ fileType: "pdf", runAllCodeChunks: true }); // fileType = 'pdf'|'png'|'jpeg'

  // prince export
  await engine.princeExport({ runAllCodeChunks: true });

  // ebook export
  await engine.eBookExport({ fileType: "epub" }); // fileType=`epub`|`pdf`|`mobi`|`html`

  // pandoc export
  await engine.pandocExport({ runAllCodeChunks: true });

  // markdown(gfm) export
  await engine.markdownExport({ runAllCodeChunks: true });

  return process.exit();
}

main();
```

## Markdown Engine Configuration

```js
const config = {
  // Enable this option will render markdown by pandoc instead of markdown-it.
  usePandocParser: false,

  // In Markdown, a single newline character doesn't cause a line break in the generated HTML. In GitHub Flavored Markdown, that is not true. Enable this config option to insert line breaks in rendered HTML for single newlines in Markdown source.
  breakOnSingleNewLine: true,

  // Enable smartypants and other sweet transforms.
  enableTypographer: false,

  // Math
  mathRenderingOption: "KaTeX",  // "KaTeX" | "MathJax" | "None"
  mathInlineDelimiters: [["$", "$"], ["\\(", "\\)"]],
  mathBlockDelimiters: [["$$", "$$"], ["\\[", "\\]"]],

  // Enable Wiki Link syntax support. More information can be found a  https://help.github.com/articles/adding-links-to-wikis/
  enableWikiLinkSyntax: true,
  // By default, the extension for wikilink is `.md`. For example: [[test]] will direct to file path `test.md`.
  wikiLinkFileExtension: '.md'

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
  mermaidTheme: 'mermaid.css', // 'mermaid.css' | 'mermaid.dark.css' | 'mermaid.forest.css'

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
  //  "vue.css"
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
  // "solarized-light.css"
  // "vue.css"

  // Revealjs presentation theme
  revealjsTheme: "white.css",
  // "beige.css"
  // "black.css"
  // "blood.css"
  // "league.css"
  // "moon.css"
  // "night.css"
  // "serif.css"
  // "simple.css"
  // "sky.css"
  // "solarized.css"
  // "white.css"
  // "none.css"

  // Accepted protocols for links.
  protocolsWhiteList: "http://, https://, atom://, file://, mailto:, tel:",

  // When using Image Helper to copy images, by default images will be copied to root image folder path '/assets'
  imageFolderPath: '/assets',

  // Whether to print background for file export or not. If set to `false`, then `github-light` preview theme will b  used. You can also set `print_background` in front-matter for individual files.
  printBackground: false,

  // PhantomJS executable path
  phantomPath: 'phantomjs',

  // Pandoc executable path
  pandocPath: 'pandoc',

  // Pandoc markdown flavor
  pandocMarkdownFlavor: "markdown-raw_tex+tex_math_single_backslash",

  // Pandoc arguments e.g. ['--smart', '--filter=/bin/exe']. Please use long argument names.
  pandocArguments: [],

  // Default latex engine for Pandoc export and latex code chunk.
  latexEngine: 'pdflatex',

  // Enables executing code chunks and importing javascript files.
  // ⚠ ️ Please use this feature with caution because it may put your security at risk!
  //    Your machine can get hacked if someone makes you open a markdown with malicious code while script execution is enabled.
  enableScriptExecution: false
}

// Init Engine
const engine = new mume.MarkdownEngine({
  filePath: '...',
  projectDirectoryPath: '...',
  config: config
})
```

## Global Configuration

Global config files are located at `~/.mume` directory

## Development

[Visual Studio Code](https://code.visualstudio.com/) is recommended.

1.  Clone this project
2.  Run `npm install` from shell
3.  Open in vscode, then `cmd+shift+b` to build
4.  Run the tests with `npm run test`
