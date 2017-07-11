import * as utility_ from "./utility";
export declare const utility: typeof utility_;
export declare const configs: {
    globalStyle: string;
    mathjaxConfig: object;
    mermaidConfig: string;
    phantomjsConfig: object;
    parserConfig: object;
    config: object;
};
export { MarkdownEngineConfig, MarkdownEngine } from "./markdown-engine";
export { CodeChunkData } from "./code-chunk-data";
/**
 * init mume config folder at ~/.mume
 */
export declare function init(): Promise<void>;
/**
 * cb will be called when global style.less like files is changed.
 * @param cb function(error, css){}
 */
export declare function onDidChangeConfigFile(cb: () => void): void;
