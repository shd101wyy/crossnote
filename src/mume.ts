/**
 * The core of mume package.
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as utility_ from "./utility";

let INITIALIZED = false;
let CONFIG_CHANGE_CALLBACK: () => void = null;

export const utility = utility_;
export const configs = utility.configs;
export { MarkdownEngineConfig } from "./markdown-engine-config";
export { MarkdownEngine } from "./markdown-engine";
export { CodeChunkData } from "./code-chunk-data";

/**
 * init mume config folder at ~/.mume
 */
export async function init(): Promise<void> {
  if (INITIALIZED) {
    return;
  }

  const homeDir = os.homedir();
  const extensionConfigDirectoryPath = path.resolve(homeDir, "./.mume");
  if (!fs.existsSync(extensionConfigDirectoryPath)) {
    fs.mkdirSync(extensionConfigDirectoryPath);
  }

  configs.globalStyle = await utility.getGlobalStyles();
  configs.mermaidConfig = await utility.getMermaidConfig();
  configs.mathjaxConfig = await utility.getMathJaxConfig();
  configs.katexConfig = await utility.getKaTeXConfig();
  configs.parserConfig = await utility.getParserConfig();
  configs.config = await utility.getExtensionConfig();

  fs.watch(extensionConfigDirectoryPath, (eventType, fileName) => {
    if (eventType === "change") {
      if (fileName === "style.less") {
        // || fileName==='mermaid_config.js' || fileName==='mathjax_config')
        utility.getGlobalStyles().then((css) => {
          configs.globalStyle = css;
          if (CONFIG_CHANGE_CALLBACK) {
            CONFIG_CHANGE_CALLBACK();
          }
        });
      } else if (fileName === "mermaid_config.js") {
        utility.getMermaidConfig().then((mermaidConfig) => {
          configs.mermaidConfig = mermaidConfig;
          if (CONFIG_CHANGE_CALLBACK) {
            CONFIG_CHANGE_CALLBACK();
          }
        });
      } else if (fileName === "mathjax_config.js") {
        utility.getMathJaxConfig().then((mathjaxConfig) => {
          configs.mathjaxConfig = mathjaxConfig;
          if (CONFIG_CHANGE_CALLBACK) {
            CONFIG_CHANGE_CALLBACK();
          }
        });
      } else if (fileName === "katex_config.js") {
        utility.getKaTeXConfig().then((katexConfig) => {
          configs.katexConfig = katexConfig;
          if (CONFIG_CHANGE_CALLBACK) {
            CONFIG_CHANGE_CALLBACK();
          }
        });
      } else if (fileName === "parser.js") {
        utility.getParserConfig().then((parserConfig) => {
          configs.parserConfig = parserConfig;
          if (CONFIG_CHANGE_CALLBACK) {
            CONFIG_CHANGE_CALLBACK();
          }
        });
      } else if (fileName === "config.json") {
        utility.getExtensionConfig().then((config) => {
          configs.config = config;
          if (CONFIG_CHANGE_CALLBACK) {
            CONFIG_CHANGE_CALLBACK();
          }
        });
      }
    }
  });

  INITIALIZED = true;
  return;
}

/**
 * cb will be called when global style.less like files is changed.
 * @param cb function(error, css){}
 */

export function onDidChangeConfigFile(cb: () => void) {
  CONFIG_CHANGE_CALLBACK = cb;
}
