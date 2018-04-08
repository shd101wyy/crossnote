export type MathRenderingOption = "None" | "KaTeX" | "MathJax";

export interface MarkdownEngineConfig {
  usePandocParser?: boolean;
  breakOnSingleNewLine?: boolean;
  enableTypographer?: boolean;
  enableWikiLinkSyntax?: boolean;
  wikiLinkFileExtension?: string;
  enableEmojiSyntax?: boolean;
  enableExtendedTableSyntax?: boolean;
  enableCriticMarkupSyntax?: boolean;
  protocolsWhiteList?: string;
  mathRenderingOption?: MathRenderingOption;
  mathInlineDelimiters?: string[][];
  mathBlockDelimiters?: string[][];
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
  enableEmojiSyntax: true,
  enableExtendedTableSyntax: false,
  enableCriticMarkupSyntax: false,
  wikiLinkFileExtension: ".md",
  protocolsWhiteList: "http://, https://, atom://, file://, mailto:, tel:",
  mathRenderingOption: "KaTeX",
  mathInlineDelimiters: [["$", "$"], ["\\(", "\\)"]],
  mathBlockDelimiters: [["$$", "$$"], ["\\[", "\\]"]],
  codeBlockTheme: "auto.css",
  previewTheme: "github-light.css",
  revealjsTheme: "white.css",
  mermaidTheme: "mermaid.css",
  frontMatterRenderingOption: "none",
  imageFolderPath: "/assets",
  printBackground: false,
  phantomPath: "phantomjs",
  pandocPath: "pandoc",
  pandocMarkdownFlavor: "markdown-raw_tex+tex_math_single_backslash",
  pandocArguments: [],
  latexEngine: "pdflatex",
  enableScriptExecution: true,
};
