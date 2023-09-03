import { Stats } from 'fs';
import { KatexOptions } from 'katex';
import { MermaidConfig } from 'mermaid';
import { JsonObject } from 'type-fest';

export const IS_NODE = typeof window === 'undefined';

export type FileSystemApi = {
  readFile: (path: string, encoding?: string) => Promise<string>;
  writeFile: (
    path: string,
    content: string,
    encoding?: string,
  ) => Promise<void>;
  mkdir: (path: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  stat: (path: string) => Promise<Stats>;
  readdir: (path: string) => Promise<string[]>;
  unlink: (path: string) => Promise<void>;
};

export type MathRenderingOption = 'None' | 'KaTeX' | 'MathJax';

export interface ParserConfig {
  onWillParseMarkdown?: (markdown: string) => Promise<string>;
  onDidParseMarkdown?: (
    html: string,
    opts: { cheerio: CheerioAPI },
  ) => Promise<string>;
  onWillTransformMarkdown?: (markdown: string) => Promise<string>;
  onDidTransformMarkdown?: (markdown: string) => Promise<string>;
}

export type PreviewTheme =
  | 'atom-dark.css'
  | 'atom-light.css'
  | 'atom-material.css'
  | 'github-dark.css'
  | 'github-light.css'
  | 'gothic.css'
  | 'medium.css'
  | 'monokai.css'
  | 'newsprint.css'
  | 'night.css'
  | 'none.css'
  | 'one-dark.css'
  | 'one-light.css'
  | 'solarized-dark.css'
  | 'solarized-light.css'
  | 'vue.css';

export type CodeBlockTheme =
  | 'auto.css'
  | 'default.css'
  | 'atom-dark.css'
  | 'atom-light.css'
  | 'atom-material.css'
  | 'coy.css'
  | 'darcula.css'
  | 'dark.css'
  | 'funky.css'
  | 'github.css'
  | 'hopscotch.css'
  | 'monokai.css'
  | 'okaidia.css'
  | 'one-dark.css'
  | 'one-light.css'
  | 'pen-paper-coffee.css'
  | 'pojoaque.css'
  | 'solarized-dark.css'
  | 'solarized-light.css'
  | 'twilight.css'
  | 'vue.css'
  | 'vs.css'
  | 'xonokai.css';

export type RevealJsTheme =
  | 'beige.css'
  | 'black.css'
  | 'blood.css'
  | 'league.css'
  | 'moon.css'
  | 'night.css'
  | 'serif.css'
  | 'simple.css'
  | 'sky.css'
  | 'solarized.css'
  | 'white.css'
  | 'none.css';

export type MermaidTheme = 'default' | 'forest' | 'dark' | 'neutral' | 'null';

export type FrontMatterRenderingOption = 'none' | 'table' | 'code';

export interface NotebookConfig {
  /**
   * Global custom CSS styles.
   *
   * This will be inserted into HTML `<style>` tag.
   *
   * Default: `${notebookPath}/.crossnote/style.less` or  `''`
   */
  globalCss: string;

  /**
   * Mermaid configuration.
   *
   * Default: `${notebookPath}/.crossnote/mermaid.json` or `{ startOnLoad: false }`
   */
  mermaidConfig: MermaidConfig;

  /**
   * MathJax configuration.
   *
   * https://docs.mathjax.org/en/latest/options/index.html
   *
   * Default: `${notebookPath}/.crossnote/mathjax_v3.json` or
   * ```
   * {
   *   tex: {},
   *   options: {},
   *   loader: {},
   * }
   */
  mathjaxConfig: JsonObject;

  /**
   * KaTeX configuration.
   *
   * https://katex.org/docs/options.html
   *
   * Default: `${notebookPath}/.crossnote/katex.json` or `{ macros: {} }`
   */
  katexConfig: KatexOptions;

  /**
   * Whether to use Pandoc parser.
   *
   * Default: `false`
   */
  usePandocParser: boolean;

  /**
   * Parser configuration.
   *
   * Default: `${notebookPath}/.crossnote/parser.mjs` or `{}`
   */
  parserConfig: ParserConfig;

  /**
   * Whether to break on single new line.
   *
   * If set to `false`, then two spaces at the end of line will be required to break a line.
   *
   * Default: `true`
   */
  breakOnSingleNewLine: boolean;
  /**
   * Whether to enable typographer.
   *
   * Default: `false`
   */
  enableTypographer: boolean;
  /**
   * Whether to enable wiki link syntax.
   *
   * Default: `true`
   */
  enableWikiLinkSyntax: boolean;
  /**
   * Whether to enable linkify.
   *
   * Default: `true`
   */
  enableLinkify: boolean;
  /**
   * Whether to use GitHub style piped link.
   * - GitHub style: `[[ text | link ]]`
   * - Wiki style: `[[ link | text ]]`
   * Default: `false`
   */
  useGitHubStylePipedLink: boolean;
  /**
   * The file extension for wiki link.
   *
   * For example, if the file extension is `.md`, then `[[ link ]]` will link to `link.md`.
   *
   * Default: `.md`
   */
  wikiLinkFileExtension: string;
  /**
   * Whether to enable emoji syntax.
   *
   * Default: `true`
   */
  enableEmojiSyntax: boolean;
  /**
   * Whether to enable extended table syntax.
   *
   * Default: `false`
   */
  enableExtendedTableSyntax: boolean;
  /**
   * Whether to enable critic markup syntax.
   *
   * Default: `false`
   */
  enableCriticMarkupSyntax: boolean;
  /**
   * The protocols white list.
   *
   * Default: `http://, https://, atom://, file://, mailto:, tel:`
   */
  protocolsWhiteList: string;
  /**
   * The math rendering option.
   *
   * Default: `KaTeX`
   */
  mathRenderingOption: MathRenderingOption;
  /**
   * The math delimiters for inline math.
   *
   * For example, `[["$", "$"]]` will render `$x$` as inline math.
   *
   * Default: `[['$', '$']]`
   */
  mathInlineDelimiters: string[][];
  /**
   * The math delimiters for block math.
   *
   * For example, `[["$$", "$$"]]` will render `$$x$$` as block math.
   *
   * Default: `[['$$', '$$']]`
   */
  mathBlockDelimiters: string[][];
  /**
   * The online math rendering service used for markdown export.
   *
   * Default: `https://latex.codecogs.com/gif.latex`
   */
  mathRenderingOnlineService: string;
  /**
   * The script source for MathJax v3.
   *
   * Default: https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js
   */
  mathjaxV3ScriptSrc: string;
  /**
   * The code block theme.
   *
   * Default: `auto.css`
   */
  codeBlockTheme: CodeBlockTheme;
  /**
   * The preview theme.
   *
   * Default: `github-light.css`
   */
  previewTheme: PreviewTheme;
  /**
   * The reveal.js theme.
   *
   * Default: `white.css`
   */
  revealjsTheme: RevealJsTheme;
  /**
   * The mermaid theme.
   *
   * Default: `default`
   */
  mermaidTheme: MermaidTheme;
  /**
   * The front matter rendering option.
   *
   * Default: `none`
   */
  frontMatterRenderingOption: FrontMatterRenderingOption;
  /**
   * The folder path for storing images.
   *
   * Default: `/assets`
   */
  imageFolderPath: string;
  /**
   * Whether to print background for file export.
   *
   * Default: `false`
   */
  printBackground: boolean;
  /**
   * The path of Chrome or Chromium.
   *
   * This is used for puppeteer to generate pdf or images.
   *
   * Default: `''`
   */
  chromePath: string;
  /**
   * The path of ImageMagick.
   *
   * This is used for converting svg to png.
   *
   * Default: `''`
   */
  imageMagickPath: string;
  /**
   * The path of the `pandoc` command.
   *
   * Default: `pandoc`
   */
  pandocPath: string;
  /**
   * The pandoc markdown flavor.
   *
   * Default: `markdown-raw_tex+tex_math_single_backslash`
   */
  pandocMarkdownFlavor: string;
  /**
   * The arguments for running the `pandoc` command.
   *
   * Default: `[]`
   */
  pandocArguments: string[];
  /**
   * The latex engine.
   *
   * Default: `pdflatex`
   */
  latexEngine: string;
  /**
   * Whether to enable script execution.
   *
   * **Note:** This is dangerous and should be used with caution.
   *
   * Default: `false`
   */
  enableScriptExecution: boolean;
  /**
   * Whether to enable HTML5 embed.
   *
   * **Note:** This is dangerous and should be used with caution.
   *
   * Default: `false`
   */
  enableHTML5Embed: boolean;
  /**
   * Whether to use image syntax for HTML5 embed.
   *
   * Default: `true`
   */
  HTML5EmbedUseImageSyntax: boolean;
  /**
   * Whether to use link syntax for HTML5 embed.
   *
   * Default: `false`
   */
  HTML5EmbedUseLinkSyntax: boolean;
  /**
   * Whether to allow HTTP protocol for HTML5 embed.
   *   *
   * Default: `false`
   */
  HTML5EmbedIsAllowedHttp: boolean;
  /**
   * The audio attributes for HTML5 embed.
   *
   * Default: `controls preload="metadata"`
   */
  HTML5EmbedAudioAttributes: string;
  /**
   * The video attributes for HTML5 embed.
   *
   * Default: `controls preload="metadata"`
   */
  HTML5EmbedVideoAttributes: string;
  /**
   * The timeout for puppeteer to wait for the page to be loaded.
   *
   * Increase the timeout if the exported file is incomplete.
   *
   * Default: `0`
   */
  puppeteerWaitForTimeout: number;
  /**
   * The arguments for running puppeteer.
   *
   * Default: `[]`
   */
  puppeteerArgs: string[];
  /**
   * The PlantUML server.
   *
   * If this is set, then `plantumlJarPath` will be ignored.
   *
   * You run start a plantuml server by running:
   *
   * $ docker run -d -p 8080:8080 plantuml/plantuml-server:jetty
   */
  plantumlServer: string;
  /**
   * The path of the plantuml.jar file.
   *   *
   * The plantuml.jar file could be downloaded from https://sourceforge.net/projects/plantuml/
   */
  plantumlJarPath: string;
  /**
   * The host of jsdelivr CDN.
   *
   * Default: `cdn.jsdelivr.net`
   */
  jsdelivrCdnHost: string;
  /**
   * The Kroki server used to render diagrams.
   *
   * Default: `https://kroki.io`
   */
  krokiServer: string;
  /**
   * Whether the current environment is VSCode.
   */
  isVSCode: boolean;
}

export function getDefaultMermaidConfig(): MermaidConfig {
  return {
    startOnLoad: false,
  };
}

export function getDefaultMathjaxConfig(): JsonObject {
  return {
    tex: {},
    options: {},
    loader: {},
  };
}

export function getDefaultKatexConfig(): KatexOptions {
  return {
    macros: {},
  };
}

export function getDefaultParserConfig(): ParserConfig {
  return {
    onWillParseMarkdown: async function(markdown) {
      return markdown;
    },
    onDidParseMarkdown: async function(html) {
      return html;
    },
    onWillTransformMarkdown: async function(markdown) {
      return markdown;
    },
    onDidTransformMarkdown: async function(markdown) {
      return markdown;
    },
  };
}

export function getDefaultNotebookConfig(): NotebookConfig {
  return {
    globalCss: '',
    mermaidConfig: getDefaultMermaidConfig(),
    mathjaxConfig: getDefaultMathjaxConfig(),
    katexConfig: getDefaultKatexConfig(),
    parserConfig: getDefaultParserConfig(),
    usePandocParser: false,
    breakOnSingleNewLine: true,
    enableTypographer: false,
    enableWikiLinkSyntax: true,
    enableLinkify: true,
    enableEmojiSyntax: true,
    enableExtendedTableSyntax: false,
    enableCriticMarkupSyntax: false,
    useGitHubStylePipedLink: false,
    wikiLinkFileExtension: '.md',
    protocolsWhiteList: 'http://, https://, atom://, file://, mailto:, tel:',
    mathRenderingOption: 'KaTeX',
    mathInlineDelimiters: [['$', '$']],
    mathBlockDelimiters: [['$$', '$$']],
    mathRenderingOnlineService: 'https://latex.codecogs.com/gif.latex',
    mathjaxV3ScriptSrc:
      'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
    codeBlockTheme: 'auto.css',
    previewTheme: 'github-light.css',
    revealjsTheme: 'white.css',
    mermaidTheme: 'default',
    frontMatterRenderingOption: 'none',
    imageFolderPath: '/assets',
    printBackground: false,
    chromePath: '',
    imageMagickPath: '',
    pandocPath: 'pandoc',
    pandocMarkdownFlavor: 'markdown-raw_tex+tex_math_single_backslash',
    pandocArguments: [],
    latexEngine: 'pdflatex',
    enableScriptExecution: false,
    enableHTML5Embed: false,
    HTML5EmbedUseImageSyntax: true,
    HTML5EmbedUseLinkSyntax: false,
    HTML5EmbedIsAllowedHttp: false,
    HTML5EmbedAudioAttributes: 'controls preload="metadata"',
    HTML5EmbedVideoAttributes: 'controls preload="metadata"',
    puppeteerWaitForTimeout: 0,
    puppeteerArgs: [],
    plantumlServer: '',
    plantumlJarPath: '',
    jsdelivrCdnHost: 'cdn.jsdelivr.net',
    krokiServer: 'https://kroki.io',
    isVSCode: false,
  };
}
