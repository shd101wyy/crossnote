export interface TransformMarkdownOutput {
    outputString: string;
    /**
     * An array of slide configs.
     */
    slideConfigs: Array<object>;
    /**
     * whehter we found [TOC] in markdown file or not.
     */
    tocBracketEnabled: boolean;
    /**
     * imported javascript and css files
     * convert .js file to <script src='...'></script>
     * convert .css file to <link href='...'></link>
     */
    JSAndCssFiles: string[];
    headings: Heading[];
    /**
     * Get `---\n...\n---\n` string.
     */
    frontMatterString: string;
}
export interface TransformMarkdownOptions {
    fileDirectoryPath: string;
    projectDirectoryPath: string;
    filesCache: {
        [key: string]: string;
    };
    useRelativeFilePath: boolean;
    forPreview: boolean;
    protocolsWhiteListRegExp: RegExp;
    notSourceFile?: boolean;
    imageDirectoryPath?: string;
    usePandocParser: boolean;
}
/**
 *
 * @param inputString
 * @param fileDirectoryPath
 * @param projectDirectoryPath
 * @param param3
 */
export declare function transformMarkdown(inputString: string, {fileDirectoryPath, projectDirectoryPath, filesCache, useRelativeFilePath, forPreview, protocolsWhiteListRegExp, notSourceFile, imageDirectoryPath, usePandocParser}: TransformMarkdownOptions): Promise<TransformMarkdownOutput>;
