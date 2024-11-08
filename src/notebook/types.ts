import { KatexOptions } from 'katex';
import MarkdownIt from 'markdown-it';
import { MermaidConfig } from 'mermaid';
import { JsonObject } from 'type-fest';
import { Note } from './note';
import { Reference } from './reference';

export type { KatexOptions } from 'katex';
export type { MermaidConfig } from 'mermaid';
export const IS_NODE = typeof window === 'undefined';

export type FileSystemStats = {
  mtimeMs: number;
  ctimeMs: number;
  size: number;
  isFile: () => boolean;
  isDirectory: () => boolean;
  isSymbolicLink: () => boolean;
};

export type FileSystemApi = {
  readFile: (path: string, encoding?: BufferEncoding) => Promise<string>;
  writeFile: (
    path: string,
    content: string,
    encoding?: string,
  ) => Promise<void>;
  mkdir: (path: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  stat: (path: string) => Promise<FileSystemStats>;
  readdir: (path: string) => Promise<string[]>;
  unlink: (path: string) => Promise<void>;
};

export type ExtendedMarkdownItOptions = {
  /**
   * Whether to enable the sourceMap
   */
  sourceMap?: boolean;
} & MarkdownIt.Options;

export type MathRenderingOption = 'None' | 'KaTeX' | 'MathJax';

export interface ParserConfig {
  onWillParseMarkdown: (markdown: string) => Promise<string>;
  // NOTE: We disabled this for now
  // opts: { cheerio: CheerioAPI }
  onDidParseMarkdown: (html: string) => Promise<string>;
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
  | 'github-dark.css'
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

export type WikiLinkTargetFileNameChangeCase =
  | 'none'
  | 'camelCase'
  | 'pascalCase'
  | 'kebabCase'
  | 'snakeCase'
  | 'constantCase'
  | 'trainCase'
  | 'adaCase'
  | 'cobolCase'
  | 'dotNotation'
  | 'pathCase'
  | 'spaceCase'
  | 'capitalCase'
  | 'lowerCase'
  | 'upperCase';

export interface NotebookConfig {
  /**
   * The files of extensions to be included in the notebook
   * @default [".md", ".markdown", ".mdown", ".mkdn", ".mkd", ".rmd", ".qmd", ".mdx"]
   */
  markdownFileExtensions: string[];
  /**
   * Global custom CSS styles.
   *
   * This will be inserted into HTML `<style>` tag.
   *
   * @default `${notebookPath}/.crossnote/style.less` or  `''`
   */
  globalCss: string;

  /**
   * The content to be included in HTML `<head>` tag.
   * This is useful for adding custom styles or scripts.
   */
  includeInHeader: string;

  /**
   * Mermaid configuration.
   *
   * @default Defined in `${notebookPath}/.crossnote/configs.js` or `{ startOnLoad: false }`
   */
  mermaidConfig: MermaidConfig;

  /**
   * MathJax configuration.
   *
   * https://docs.mathjax.org/en/latest/options/index.html
   *
   * Default: Defined in `${notebookPath}/.crossnote/configs.js` or
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
   * @default Defined in `${notebookPath}/.crossnote/configs.js` or `{ macros: {} }`
   */
  katexConfig: KatexOptions;

  /**
   * Whether to use Pandoc parser.
   *
   * @default false
   */
  usePandocParser: boolean;

  /**
   * Parser configuration.
   *
   * @default `${notebookPath}/.crossnote/parser.js` or `{}`
   */
  parserConfig: ParserConfig;

  /**
   * Whether to enable preview zen mode.
   * Enable this option will hide unnecessary UI elements in preview unless your mouse is over it.
   */
  enablePreviewZenMode: boolean;

  /**
   * Whether to break on single new line.
   *
   * If set to `false`, then two spaces at the end of line will be required to break a line.
   *
   * @default true
   */
  breakOnSingleNewLine: boolean;
  /**
   * Whether to enable typographer.
   *
   * @default false
   */
  enableTypographer: boolean;
  /**
   * Whether to enable wiki link syntax.
   *
   * @default true
   */
  enableWikiLinkSyntax: boolean;

  /**
   * The file extension for the link in wikilink if the link does not have an extension.
   *
   * @default '.md'
   */
  wikiLinkTargetFileExtension: string;

  /**
   * The case for the file name in wikilink.
   * If the value is `none`, then the file name will not be changed.
   * Otherwise, the file name will be transformed to the specified case.
   * You can read https://www.npmjs.com/package/case-anything for more details.
   */
  wikiLinkTargetFileNameChangeCase: WikiLinkTargetFileNameChangeCase;
  /**
   * Whether to enable linkify.
   *
   * @default true
   */
  enableLinkify: boolean;
  /**
   * Whether to use GitHub style piped link.
   * - GitHub style: `[[ text | link ]]`
   * - Wiki style: `[[ link | text ]]`
   * @default false
   */
  useGitHubStylePipedLink: boolean;
  /**
   * Whether to enable emoji syntax.
   *
   * @default true
   */
  enableEmojiSyntax: boolean;
  /**
   * Whether to enable extended table syntax.
   *
   * @default false
   */
  enableExtendedTableSyntax: boolean;
  /**
   * Whether to enable critic markup syntax.
   *
   * @default false
   */
  enableCriticMarkupSyntax: boolean;
  /**
   * The protocols white list.
   *
   * @default `http://, https://, atom://, file://, mailto:, tel:`
   */
  protocolsWhiteList: string;
  /**
   * The math rendering option.
   *
   * @default `KaTeX`
   */
  mathRenderingOption: MathRenderingOption;
  /**
   * The math delimiters for inline math.
   *
   * For example, `[["$", "$"]]` will render `$x$` as inline math.
   *
   * @default [['$', '$']]
   */
  mathInlineDelimiters: string[][];
  /**
   * The math delimiters for block math.
   *
   * For example, `[["$$", "$$"]]` will render `$$x$$` as block math.
   *
   * @default [['$$', '$$']]
   */
  mathBlockDelimiters: string[][];
  /**
   * The online math rendering service used for markdown export.
   *
   * @default `https://latex.codecogs.com/gif.latex`
   */
  mathRenderingOnlineService: string;
  /**
   * The script source for MathJax v3.
   *
   * @default `https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js`
   */
  mathjaxV3ScriptSrc: string;
  /**
   * The code block theme.
   *
   * @default `auto.css`
   */
  codeBlockTheme: CodeBlockTheme;
  /**
   * The preview theme.
   *
   * @default `github-light.css`
   */
  previewTheme: PreviewTheme;
  /**
   * The reveal.js theme.
   *
   * @default `white.css`
   */
  revealjsTheme: RevealJsTheme;
  /**
   * The mermaid theme.
   *
   * @default `default`
   */
  mermaidTheme: MermaidTheme;
  /**
   * The front matter rendering option.
   *
   * @default `none`
   */
  frontMatterRenderingOption: FrontMatterRenderingOption;
  /**
   * The folder path for storing images.
   *
   * @default `/assets`
   */
  imageFolderPath: string;
  /**
   * Whether to print background for file export.
   *
   * @default false
   */
  printBackground: boolean;
  /**
   * The path of Chrome or Chromium.
   *
   * This is used for puppeteer to generate pdf or images.
   *
   * @default ''
   */
  chromePath: string;
  /**
   * The path of ImageMagick.
   *
   * This is used for converting svg to png.
   *
   * @default ''
   */
  imageMagickPath: string;
  /**
   * The path of the `pandoc` command.
   *
   * @default `pandoc`
   */
  pandocPath: string;
  /**
   * The pandoc markdown flavor.
   *
   * @default `markdown-raw_tex+tex_math_single_backslash`
   */
  pandocMarkdownFlavor: string;
  /**
   * The arguments for running the `pandoc` command.
   *
   * @default []
   */
  pandocArguments: string[];
  /**
   * The latex engine.
   *
   * @default `pdflatex`
   */
  latexEngine: string;
  /**
   * Whether to enable script execution.
   *
   * **Note:** This is dangerous and should be used with caution.
   *
   * @default false
   */
  enableScriptExecution: boolean;
  /**
   * Whether to enable HTML5 embed.
   *
   * **Note:** This is dangerous and should be used with caution.
   *
   * @default false
   */
  enableHTML5Embed: boolean;
  /**
   * Whether to use image syntax for HTML5 embed.
   *
   * @default true
   */
  HTML5EmbedUseImageSyntax: boolean;
  /**
   * Whether to use link syntax for HTML5 embed.
   *
   * @default false
   */
  HTML5EmbedUseLinkSyntax: boolean;
  /**
   * Whether to allow HTTP protocol for HTML5 embed.
   *   *
   * @default false
   */
  HTML5EmbedIsAllowedHttp: boolean;
  /**
   * The audio attributes for HTML5 embed.
   *
   * @default `controls preload="metadata"`
   */
  HTML5EmbedAudioAttributes: string;
  /**
   * The video attributes for HTML5 embed.
   *
   * @default `controls preload="metadata"`
   */
  HTML5EmbedVideoAttributes: string;
  /**
   * The timeout for puppeteer to wait for the page to be loaded.
   *
   * Increase the timeout if the exported file is incomplete.
   *
   * @default 0
   */
  puppeteerWaitForTimeout: number;
  /**
   * The arguments for running puppeteer.
   *
   * @default []
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
   *
   * @default ''
   */
  plantumlServer: string;
  /**
   * The path of the plantuml.jar file.
   *
   * The plantuml.jar file could be downloaded from https://sourceforge.net/projects/plantuml/
   *
   * @default ''
   */
  plantumlJarPath: string;
  /**
   * The host of jsdelivr CDN.
   *
   * @default `cdn.jsdelivr.net`
   */
  jsdelivrCdnHost: string;
  /**
   * The Kroki server used to render diagrams.
   *
   * @default `https://kroki.io`
   */
  krokiServer: string;
  /**
   * Whether the current environment is VSCode.
   *
   * @default false
   */
  isVSCode: boolean;

  /**
   * Whether to always show backlinks in preview.
   */
  alwaysShowBacklinksInPreview: boolean;
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
    onWillParseMarkdown: async function (markdown) {
      return markdown;
    },
    onDidParseMarkdown: async function (html) {
      return html;
    },
  };
}

export function getDefaultNotebookConfig(): NotebookConfig {
  return {
    markdownFileExtensions: [
      '.md',
      '.markdown',
      '.mdown',
      '.mkdn',
      '.mkd',
      '.rmd',
      '.qmd',
      '.mdx',
    ],
    globalCss: '',
    includeInHeader: '',
    mermaidConfig: getDefaultMermaidConfig(),
    mathjaxConfig: getDefaultMathjaxConfig(),
    katexConfig: getDefaultKatexConfig(),
    parserConfig: getDefaultParserConfig(),
    enablePreviewZenMode: true,
    usePandocParser: false,
    breakOnSingleNewLine: true,
    enableTypographer: false,
    enableWikiLinkSyntax: true,
    wikiLinkTargetFileExtension: '.md',
    wikiLinkTargetFileNameChangeCase: 'none',
    enableLinkify: true,
    enableEmojiSyntax: true,
    enableExtendedTableSyntax: false,
    enableCriticMarkupSyntax: false,
    useGitHubStylePipedLink: false,
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
    alwaysShowBacklinksInPreview: false,
  };
}

export interface Backlink {
  note: Partial<Note>;
  references: Partial<Reference>[];
  referenceHtmls: string[];
}

export interface WebviewConfig extends Partial<NotebookConfig> {
  scrollSync?: boolean;
  zoomLevel?: number;
  sourceUri?: string;
  cursorLine?: number;
  imageUploader?: ImageUploader;
}

export enum PreviewMode {
  /**
   * Only one preview will be shown for all editors.
   */
  SinglePreview = 'Single Preview',

  /**
   * Multiple previews will be shown. Each editor has its own preview.
   */
  MultiplePreviews = 'Multiple Previews',

  /**
   * No editor will be shown. Only previews will be shown. You can use the in-preview editor to edit the markdown.
   */
  PreviewsOnly = 'Previews Only',
}

export type ImageUploader = 'imgur' | 'sm.ms' | 'qiniu';
