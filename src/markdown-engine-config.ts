export type MathRenderingOption = "None" | "KaTeX" | "MathJax";

export interface MarkdownEngineConfig {
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
  phantomPath?: string;
  pandocPath?: string;
  pandocMarkdownFlavor?: string;
  pandocArguments?: string[];
  latexEngine?: string;
  enableScriptExecution?: boolean;
}

export const defaultMarkdownEngineConfig: MarkdownEngineConfig = {
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
  mathInlineDelimiters: [["$", "$"], ["\\(", "\\)"]],
  mathBlockDelimiters: [["$$", "$$"], ["\\[", "\\]"]],
  mathRenderingOnlineService: "https://latex.codecogs.com/gif.latex",
  codeBlockTheme: "auto.css",
  previewTheme: "github-light.css",
  revealjsTheme: "white.css",
  mermaidTheme: "default",
  frontMatterRenderingOption: "none",
  imageFolderPath: "/assets",
  printBackground: false,
  phantomPath: "phantomjs",
  pandocPath: "pandoc",
  pandocMarkdownFlavor: "markdown-raw_tex+tex_math_single_backslash",
  pandocArguments: [],
  latexEngine: "pdflatex",
  enableScriptExecution: false,
};
