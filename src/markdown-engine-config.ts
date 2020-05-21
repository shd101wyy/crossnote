export type MathRenderingOption = "None" | "KaTeX" | "MathJax";

export interface MarkdownEngineConfig {
  configPath?: string;
  usePandocParser?: boolean;
  breakOnSingleNewLine?: boolean;
  enableTypographer?: boolean;
  enableWikiLinkSyntax?: boolean;
  enableLinkify?: boolean;
  wikiLinkFileExtension?: string;
  enableEmojiSyntax?: boolean;
  enableExtendedTableSyntax?: boolean;
  enableCriticMarkupSyntax?: boolean;
  protocolsWhiteList?: string;
  mathRenderingOption?: MathRenderingOption;
  mathInlineDelimiters?: string[][];
  mathBlockDelimiters?: string[][];
  mathRenderingOnlineService?: string;
  codeBlockTheme?: string;
  previewTheme?: string;
  revealjsTheme?: string;
  mermaidTheme?: string;
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
};
