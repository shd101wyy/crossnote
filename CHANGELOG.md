# Changelog

Please visit https://github.com/shd101wyy/vscode-markdown-preview-enhanced/releases for the more changelog

## [Unreleased]

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
