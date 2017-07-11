export declare function escapeString(str: string): string;
export declare function unescapeString(str: string): string;
export declare function readFile(file: string, options?: any): Promise<string>;
export declare function writeFile(file: string, text: any, options?: any): Promise<{}>;
export declare function write(fd: number, text: string): Promise<{}>;
export declare function tempOpen(options: any): Promise<any>;
export declare function execFile(file: string, args: string[], options?: object): Promise<string>;
export declare function mkdirp(dir: string): Promise<boolean>;
/**
 * open html file in browser or open pdf file in reader ... etc
 * @param filePath
 */
export declare function openFile(filePath: any): void;
/**
 * get "~/.mume" path
 */
export declare const extensionConfigDirectoryPath: string;
/**
 * get the directory path of this extension.
 */
export declare const extensionDirectoryPath: string;
/**
 * compile ~/.mumi/style.less and return 'css' content.
 */
export declare function getGlobalStyles(): Promise<string>;
/**
 * load ~/.mume/mermaid_config.js file.
 */
export declare function getMermaidConfig(): Promise<string>;
/**
 * load ~/.mume/phantomjs_config.js file.
 */
export declare function getPhantomjsConfig(): Promise<object>;
/**
 * load ~/.mume/mermaid_config.js file.
 */
export declare function getMathJaxConfig(): Promise<object>;
export declare function getExtensionConfig(): Promise<object>;
export declare function getParserConfig(): Promise<object>;
/**
 * Check whether two arrays are equal
 * @param x
 * @param y
 */
export declare function isArrayEqual(x: any, y: any): boolean;
/**
 * Add file:// to file path
 * @param filePath
 */
export declare function addFileProtocol(filePath: string): string;
/**
 * Remove file:// from file path
 * @param filePath
 */
export declare function removeFileProtocol(filePath: string): string;
/**
 * style.less,
 * mathjax_config.js,
 * mermaid_config.js
 * phantomjs_config.js
 * config.json
 *
 * files
 */
export declare const configs: {
    globalStyle: string;
    mathjaxConfig: object;
    mermaidConfig: string;
    phantomjsConfig: object;
    parserConfig: object;
    config: object;
};
export { uploadImage } from "./image-uploader";
