export type MathRenderingOption = "None" | "KaTeX" | "MathJax";

export type PreviewTheme =
  | "atom-dark.css"
  | "atom-light.css"
  | "atom-material.css"
  | "github-dark.css"
  | "github-light.css"
  | "gothic.css"
  | "medium.css"
  | "monokai.css"
  | "newsprint.css"
  | "night.css"
  | "none.css"
  | "one-dark.css"
  | "one-light.css"
  | "solarized-dark.css"
  | "solarized-light.css"
  | "vue.css";

export type CodeBlockTheme =
  | "auto.css"
  | "default.css"
  | "atom-dark.css"
  | "atom-light.css"
  | "atom-material.css"
  | "coy.css"
  | "darcula.css"
  | "dark.css"
  | "funky.css"
  | "github.css"
  | "hopscotch.css"
  | "monokai.css"
  | "okaidia.css"
  | "one-dark.css"
  | "one-light.css"
  | "pen-paper-coffee.css"
  | "pojoaque.css"
  | "solarized-dark.css"
  | "solarized-light.css"
  | "twilight.css"
  | "vue.css"
  | "vs.css"
  | "xonokai.css";

export type RevealJsTheme =
  | "beige.css"
  | "black.css"
  | "blood.css"
  | "league.css"
  | "moon.css"
  | "night.css"
  | "serif.css"
  | "simple.css"
  | "sky.css"
  | "solarized.css"
  | "white.css"
  | "none.css";

export type MermaidTheme = "default" | "dark" | "forest";

export interface MarkdownEngineConfig {
  configPath?: string;
  usePandocParser?: boolean;
  breakOnSingleNewLine?: boolean;
  enableTypographer?: boolean;
  enableWikiLinkSyntax?: boolean;
  enableLinkify?: boolean;
  useGitHubStylePipedLink?: boolean;
  wikiLinkFileExtension?: string;
  enableEmojiSyntax?: boolean;
  enableExtendedTableSyntax?: boolean;
  enableCriticMarkupSyntax?: boolean;
  protocolsWhiteList?: string;
  mathRenderingOption?: MathRenderingOption;
  mathInlineDelimiters?: string[][];
  mathBlockDelimiters?: string[][];
  mathRenderingOnlineService?: string;
  codeBlockTheme?: CodeBlockTheme;
  previewTheme?: PreviewTheme;
  revealjsTheme?: RevealJsTheme;
  mermaidTheme?: MermaidTheme;
  frontMatterRenderingOption?: string;
  imageFolderPath?: string;
  printBackground?: boolean;
  chromePath?: string;
  imageMagickPath?: string;
  pandocPath?: string;
  pandocMarkdownFlavor?: string;
  pandocArguments?: string[];
  latexEngine?: string;
  enableScriptExecution?: boolean;
  enableHTML5Embed?: boolean;
  HTML5EmbedUseImageSyntax?: boolean;
  HTML5EmbedUseLinkSyntax?: boolean;
  HTML5EmbedIsAllowedHttp?: boolean;
  HTML5EmbedAudioAttributes?: string;
  HTML5EmbedVideoAttributes?: string;
  puppeteerWaitForTimeout?: number;
  usePuppeteerCore?: boolean;
  puppeteerArgs?: string[];
  plantumlServer: string;
}

export const defaultMarkdownEngineConfig: MarkdownEngineConfig = {
  configPath: null,
  usePandocParser: false,
  breakOnSingleNewLine: true,
  enableTypographer: false,
  enableWikiLinkSyntax: true,
  enableLinkify: true,
  enableEmojiSyntax: true,
  enableExtendedTableSyntax: false,
  enableCriticMarkupSyntax: false,
  useGitHubStylePipedLink: true,
  wikiLinkFileExtension: ".md",
  protocolsWhiteList: "http://, https://, atom://, file://, mailto:, tel:",
  mathRenderingOption: "KaTeX",
  mathInlineDelimiters: [
    ["$", "$"],
    ["\\(", "\\)"],
  ],
  mathBlockDelimiters: [
    ["$$", "$$"],
    ["\\[", "\\]"],
  ],
  mathRenderingOnlineService: "https://latex.codecogs.com/gif.latex",
  codeBlockTheme: "auto.css",
  previewTheme: "github-light.css",
  revealjsTheme: "white.css",
  mermaidTheme: "default",
  frontMatterRenderingOption: "none",
  imageFolderPath: "/assets",
  printBackground: false,
  chromePath: "",
  imageMagickPath: "",
  pandocPath: "pandoc",
  pandocMarkdownFlavor: "markdown-raw_tex+tex_math_single_backslash",
  pandocArguments: [],
  latexEngine: "pdflatex",
  enableScriptExecution: false,
  enableHTML5Embed: false,
  HTML5EmbedUseImageSyntax: true,
  HTML5EmbedUseLinkSyntax: false,
  HTML5EmbedIsAllowedHttp: false,
  HTML5EmbedAudioAttributes: 'controls preload="metadata"',
  HTML5EmbedVideoAttributes: 'controls preload="metadata"',
  puppeteerWaitForTimeout: 0,
  usePuppeteerCore: true,
  puppeteerArgs: [],
  plantumlServer: "",
};
