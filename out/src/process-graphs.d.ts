export declare function processGraphs(text: string, {fileDirectoryPath, projectDirectoryPath, imageDirectoryPath, imageFilePrefix, useRelativeFilePath, codeChunksData, graphsCache}: {
    fileDirectoryPath: string;
    projectDirectoryPath: string;
    imageDirectoryPath: string;
    imageFilePrefix: string;
    useRelativeFilePath: boolean;
    codeChunksData: {
        [key: string]: CodeChunkData;
    };
    graphsCache: {
        [key: string]: string;
    };
}): Promise<{
    outputString: string;
    imagePaths: string[];
}>;
