/**
 * @return outputFilePath
 */
export declare function pandocConvert(text: any, {fileDirectoryPath, projectDirectoryPath, sourceFilePath, filesCache, protocolsWhiteListRegExp, codeChunksData, graphsCache, imageDirectoryPath, pandocMarkdownFlavor, pandocPath}: {
    fileDirectoryPath: any;
    projectDirectoryPath: any;
    sourceFilePath: any;
    filesCache: any;
    protocolsWhiteListRegExp: any;
    codeChunksData: any;
    graphsCache: any;
    imageDirectoryPath: any;
    pandocMarkdownFlavor: any;
    pandocPath: any;
}, config?: {}): Promise<string>;
