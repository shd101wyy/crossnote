import { CodeChunkData } from "./code-chunk-data";
export interface MarkdownEngineRenderOption {
    useRelativeFilePath: boolean;
    isForPreview: boolean;
    hideFrontMatter: boolean;
    triggeredBySave?: boolean;
    runAllCodeChunks?: boolean;
}
export interface MarkdownEngineOutput {
    html: string;
    markdown: string;
    tocHTML: string;
    yamlConfig: any;
    /**
     * imported javascript and css files
     * convert .js file to <script src='...'></script>
     * convert .css file to <link href='...'></link>
     */
    JSAndCssFiles: string[];
}
export interface MarkdownEngineConfig {
    usePandocParser: boolean;
    breakOnSingleNewLine: boolean;
    enableTypographer: boolean;
    enableWikiLinkSyntax: boolean;
    wikiLinkFileExtension: string;
    protocolsWhiteList: string;
    /**
     * "KaTeX", "MathJax", or "None"
     */
    mathRenderingOption: string;
    mathInlineDelimiters: string[][];
    mathBlockDelimiters: string[][];
    codeBlockTheme: string;
    previewTheme: string;
    mermaidTheme: string;
    frontMatterRenderingOption: string;
    imageFolderPath: string;
    printBackground: boolean;
    phantomPath: string;
    pandocPath: string;
    pandocMarkdownFlavor: string;
    pandocArguments: string[];
}
export interface HTMLTemplateOption {
    /**
     * whether is for print.
     */
    isForPrint: boolean;
    /**
     * whether is for prince export.
     */
    isForPrince: boolean;
    /**
     * if it's for phantomjs export, what is the export file type.
     * `pdf`, `jpeg`, and `png` are available.
     */
    phantomjsType?: string;
    /**
     * whether for offline use
     */
    offline: boolean;
    /**
     * whether to embed local images as base64
     */
    embedLocalImages: boolean;
    /**
     * whether to embed svg images
     */
    embedSVG?: boolean;
}
/**
 * The markdown engine that can be used to parse markdown and export files
 */
export declare class MarkdownEngine {
    /**
     * Modify markdown source, append `result` after corresponding code chunk.
     * @param codeChunkData
     * @param result
     */
    static modifySource(codeChunkData: CodeChunkData, result: string, filePath: string): Promise<string>;
    /**
     * Bind cb to MODIFY_SOURCE
     * @param cb
     */
    static onModifySource(cb: (codeChunkData: CodeChunkData, result: string, filePath: string) => Promise<string>): void;
    /**
     * markdown file path
     */
    private readonly filePath;
    private readonly fileDirectoryPath;
    private readonly projectDirectoryPath;
    private config;
    private breakOnSingleNewLine;
    private enableTypographer;
    private protocolsWhiteListRegExp;
    private headings;
    private tocHTML;
    private md;
    private graphsCache;
    private codeChunksData;
    private filesCache;
    /**
     * cachedHTML is the cache of html generated from the markdown file.
     */
    private cachedHTML;
    constructor(args: {
        /**
         * The markdown file path.
         */
        filePath: string;
        /**
         * The project directory path.
         */
        projectDirectoryPath: string;
        /**
         * Markdown Engine configuration.
         */
        config?: MarkdownEngineConfig;
    });
    /**
     * Set default values
     */
    private initConfig();
    updateConfiguration(config: any): void;
    cacheCodeChunkResult(id: string, result: string): void;
    /**
     *
     * @param content the math expression
     * @param openTag the open tag, eg: '\('
     * @param closeTag the close tag, eg: '\)'
     * @param displayMode whether to be rendered in display mode
     */
    private parseMath({content, openTag, closeTag, displayMode});
    private configureRemarkable();
    /**
     * Embed local images. Load the image file and display it in base64 format
     */
    private embedLocalImages($);
    /**
     * Load local svg files and embed them into html directly.
     * @param $
     */
    private embedSVG($);
    /**
     * Generate scripts string for preview usage.
     */
    generateScriptsForPreview(): string;
    /**
     * Generate styles string for preview usage.
     */
    generateStylesForPreview(): string;
    /**
     * Generate HTML content
     * @param html: this is the final content you want to put.
     * @param yamlConfig: this is the front matter.
     * @param option: HTMLTemplateOption
     */
    generateHTMLFromTemplate(html: string, yamlConfig: {}, options: HTMLTemplateOption): Promise<string>;
    /**
     * generate HTML file and open it in browser
     */
    openInBrowser({runAllCodeChunks}: {
        runAllCodeChunks?: boolean;
    }): Promise<void>;
    /**
     *
     * @param filePath
     * @return dest if success, error if failure
     */
    htmlExport({offline, runAllCodeChunks}: {
        offline?: boolean;
        runAllCodeChunks?: boolean;
    }): Promise<string>;
    /**
     * Phantomjs file export
     * The config could be set by front-matter.
     * Check https://github.com/marcbachmann/node-html-pdf website.
     * @param fileType the export file type
     */
    phantomjsExport({fileType, runAllCodeChunks}: {
        fileType?: string;
        runAllCodeChunks?: boolean;
    }): Promise<string>;
    /**
     * prince pdf file export
     * @return dest if success, error if failure
     */
    princeExport({runAllCodeChunks}: {
        runAllCodeChunks?: boolean;
    }): Promise<string>;
    private eBookDownloadImages($, dest);
    /**
     *
     * @param fileType: `epub`, `pdf`, `mobi` or `html`
     * @return dest if success, error if failure
     */
    eBookExport({fileType, runAllCodeChunks}: {
        fileType?: string;
        runAllCodeChunks?: boolean;
    }): Promise<string>;
    /**
     * pandoc export
     */
    pandocExport({runAllCodeChunks}: {
        runAllCodeChunks?: boolean;
    }): Promise<string>;
    /**
     * markdown(gfm) export
     */
    markdownExport({runAllCodeChunks}: {
        runAllCodeChunks?: boolean;
    }): Promise<string>;
    /**
     *
     * @param filePath
     * @param relative: whether to use the path relative to filePath or not.
     */
    private resolveFilePath(filePath, relative);
    /**
     * Run code chunk of `id`
     * @param id
     */
    runCodeChunk(id: any): Promise<String>;
    runAllCodeChunks(): Promise<any[]>;
    /**
     * Add line numbers to code block <pre> element
     * @param
     * @param code
     */
    private addLineNumbersIfNecessary($preElement, code);
    /**
     *
     * @param preElement the cheerio element
     * @param parameters is in the format of `lang {opt1:val1, opt2:val2}` or just `lang`
     * @param text
     */
    private renderCodeBlock($, $preElement, code, parameters, {graphsCache, codeChunksArray, isForPreview, triggeredBySave});
    /**
     * This function resovle image paths and render code blocks
     * @param html the html string that we will analyze
     * @return html
     */
    private resolveImagePathAndCodeBlock(html, options);
    /**
     * return this.cachedHTML
     */
    getCachedHTML(): string;
    /**
     * clearCaches will clear filesCache, codeChunksData, graphsCache
     */
    clearCaches(): void;
    private frontMatterToTable(arg);
    /**
     * process input string, skip front-matter
     * if usePandocParser. return {
     *      content: frontMatterString
     * }
     * else if display table. return {
     *      table: string of <table>...</table> generated from data
     *      content: ''
     * }
     * else return {
     *      content: replace ---\n with ```yaml
     * }
     *
     */
    private processFrontMatter(frontMatterString, hideFrontMatter?);
    /**
     * Parse `html` to generate slides
     * @param html
     * @param slideConfigs
     * @param yamlConfig
     */
    private parseSlides(html, slideConfigs, yamlConfig);
    private parseSlidesForExport(html, slideConfigs, useRelativeFilePath);
    pandocRender(text: string, args: string[]): Promise<string>;
    parseMD(inputString: string, options: MarkdownEngineRenderOption): Promise<MarkdownEngineOutput>;
}
