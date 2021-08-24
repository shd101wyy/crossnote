/**
 * The core of mume package.
 */
import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";

import * as utility_ from "./utility";

let INITIALIZED = false;
let CONFIG_CHANGE_CALLBACK: () => void = null;

export const utility = utility_;
export const configs = utility.configs;
export { MarkdownEngineConfig } from "./markdown-engine-config";
export { MarkdownEngine } from "./markdown-engine";
export { CodeChunkData } from "./code-chunk-data";

let extensionConfigPath = utility.getConfigPath();

/**
 * init mume config folder at ~/.config/mume
 */
export async function init(configPath: string | null = null): Promise<void> {
  if (INITIALIZED) {
    return;
  }

  configPath = configPath ? path.resolve(configPath) : utility.getConfigPath();
  extensionConfigPath = configPath;

  if (!fs.existsSync(configPath)) {
    mkdirp.sync(configPath);
  }

  configs.globalStyle = await utility.getGlobalStyles(configPath);
  configs.mermaidConfig = await utility.getMermaidConfig(configPath);
  configs.mathjaxConfig = await utility.getMathJaxConfig(configPath);
  configs.katexConfig = await utility.getKaTeXConfig(configPath);
  configs.parserConfig = await utility.getParserConfig(configPath);
  configs.config = await utility.getExtensionConfig(configPath);

  fs.watch(configPath, (eventType, fileName) => {
    if (eventType === "change") {
      if (fileName === "style.less") {
        // || fileName==='mermaid_config.js' || fileName==='mathjax_config')
        utility.getGlobalStyles(configPath).then((css) => {
          configs.globalStyle = css;
          if (CONFIG_CHANGE_CALLBACK) {
            CONFIG_CHANGE_CALLBACK();
          }
        });
      } else if (fileName === "mermaid_config.js") {
        utility.getMermaidConfig(configPath).then((mermaidConfig) => {
          configs.mermaidConfig = mermaidConfig;
          if (CONFIG_CHANGE_CALLBACK) {
            CONFIG_CHANGE_CALLBACK();
          }
        });
      } else if (fileName === "mathjax_config.js") {
        utility.getMathJaxConfig(configPath).then((mathjaxConfig) => {
          configs.mathjaxConfig = mathjaxConfig;
          if (CONFIG_CHANGE_CALLBACK) {
            CONFIG_CHANGE_CALLBACK();
          }
        });
      } else if (fileName === "katex_config.js") {
        utility.getKaTeXConfig(configPath).then((katexConfig) => {
          configs.katexConfig = katexConfig;
          if (CONFIG_CHANGE_CALLBACK) {
            CONFIG_CHANGE_CALLBACK();
          }
        });
      } else if (fileName === "parser.js") {
        utility.getParserConfig(configPath).then((parserConfig) => {
          configs.parserConfig = parserConfig;
          if (CONFIG_CHANGE_CALLBACK) {
            CONFIG_CHANGE_CALLBACK();
          }
        });
      } else if (fileName === "config.json") {
        utility.getExtensionConfig(configPath).then((config) => {
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

export function getExtensionConfigPath() {
  return extensionConfigPath;
}
