import * as child_process from "child_process";
import * as fs from "fs";
import * as matter from "gray-matter";
import * as less from "less";
import * as mkdirp_ from "mkdirp";
import * as os from "os";
import * as path from "path";
import * as vm from "vm";

import * as temp from "temp";
temp.track();

const TAGS_TO_REPLACE = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "\\": "&#x5C;",
};

const TAGS_TO_REPLACE_REVERSE = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#x27;": "'",
  "&#x2F;": "/",
  "&#x5C;": "\\",
};

export function escapeString(str: string = ""): string {
  return str.replace(/[&<>"'\/\\]/g, (tag) => TAGS_TO_REPLACE[tag] || tag);
}

export function unescapeString(str: string = ""): string {
  return str.replace(
    /\&(amp|lt|gt|quot|apos|\#x27|\#x2F|\#x5C)\;/g,
    (whole) => TAGS_TO_REPLACE_REVERSE[whole] || whole,
  );
}

/**
 * Do nothing and sleep for `ms` milliseconds
 * @param ms
 */
export function sleep(ms: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      return resolve();
    }, ms);
  });
}

export function parseYAML(yaml: string = "") {
  // YAML doesn't work well with front-matter
  /*
  try {
    return YAML.parse(yaml)
  } catch(error) {
    return {}
  }
  */
  if (!yaml.startsWith("---")) {
    yaml = "---\n" + yaml.trim() + "\n---\n";
  }
  try {
    return matter(yaml).data;
  } catch (error) {
    return {};
  }
}

export function readFile(file: string, options?): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(file, options, (error, text) => {
      if (error) {
        return reject(error.toString());
      } else {
        return resolve(text.toString());
      }
    });
  });
}

export function writeFile(file: string, text, options?) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, text, options, (error) => {
      if (error) {
        return reject(error.toString());
      } else {
        return resolve();
      }
    });
  });
}

export function write(fd: number, text: string) {
  return new Promise((resolve, reject) => {
    fs.write(fd, text, (error) => {
      if (error) {
        return reject(error.toString());
      } else {
        return resolve();
      }
    });
  });
}

export function tempOpen(options): Promise<any> {
  return new Promise((resolve, reject) => {
    temp.open(options, (error, info) => {
      if (error) {
        return reject(error.toString());
      } else {
        return resolve(info);
      }
    });
  });
}

export function execFile(
  file: string,
  args: string[],
  options?: object,
): Promise<string> {
  return new Promise((resolve, reject) => {
    child_process.execFile(file, args, options, (error, stdout, stderr) => {
      if (error) {
        return reject(error.toString());
      } else if (stderr) {
        return reject(stderr);
      } else {
        return resolve(stdout);
      }
    });
  });
}

export function mkdirp(dir: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    mkdirp_(dir, (error, made) => {
      if (error) {
        return reject(error);
      } else {
        return resolve(made);
      }
    });
  });
}

/**
 * open html file in browser or open pdf file in reader ... etc
 * @param filePath
 */
export function openFile(filePath) {
  let cmd;
  if (process.platform === "win32") {
    cmd = "explorer.exe";
  } else if (process.platform === "darwin") {
    cmd = "open";
  } else {
    cmd = "xdg-open";
  }

  child_process.execFile(cmd, [filePath]);
}

/**
 * get "~/.mume" path
 */
export const extensionConfigDirectoryPath = path.resolve(
  os.homedir(),
  "./.mume",
);

/**
 * get the directory path of this extension.
 */
export const extensionDirectoryPath = path.resolve(__dirname, "../../");

/**
 * compile ~/.mumi/style.less and return 'css' content.
 */
export async function getGlobalStyles(): Promise<string> {
  const homeDir = os.homedir();
  const globalLessFilePath = path.resolve(homeDir, "./.mume/style.less");

  let fileContent: string;
  try {
    fileContent = await readFile(globalLessFilePath, { encoding: "utf-8" });
  } catch (e) {
    // create style.less file
    fileContent = `
/* Please visit the URL below for more information: */
/*   https://shd101wyy.github.io/markdown-preview-enhanced/#/customize-css */ 

.markdown-preview.markdown-preview {
  // modify your style here
  // eg: background-color: blue;  
}
`;
    await writeFile(globalLessFilePath, fileContent, { encoding: "utf-8" });
  }

  return await new Promise<string>((resolve, reject) => {
    less.render(
      fileContent,
      { paths: [path.dirname(globalLessFilePath)] },
      (error, output) => {
        if (error) {
          return resolve(`html body:before {
  content: "Failed to compile \`style.less\`. ${error}" !important;
  padding: 2em !important;
}
.mume.mume { display: none !important; }`);
        } else {
          return resolve(output.css || "");
        }
      },
    );
  });
}

/**
 * load ~/.mume/mermaid_config.js file.
 */
export async function getMermaidConfig(): Promise<string> {
  const homeDir = os.homedir();
  const mermaidConfigPath = path.resolve(homeDir, "./.mume/mermaid_config.js");

  let mermaidConfig: string;
  if (fs.existsSync(mermaidConfigPath)) {
    try {
      mermaidConfig = await readFile(mermaidConfigPath, { encoding: "utf-8" });
    } catch (e) {
      mermaidConfig = `MERMAID_CONFIG = {startOnLoad: false}`;
    }
  } else {
    const fileContent = `// config mermaid init call
// http://knsv.github.io/mermaid/#configuration
//
// You can edit the 'MERMAID_CONFIG' variable below.
MERMAID_CONFIG = {
  startOnLoad: false
}
`;
    await writeFile(mermaidConfigPath, fileContent, { encoding: "utf-8" });
    mermaidConfig = `MERMAID_CONFIG = {startOnLoad: false}`;
  }

  return mermaidConfig;
}

/**
 * load ~/.mume/phantomjs_config.js file.
 */
export async function getPhantomjsConfig(): Promise<object> {
  const homeDir = os.homedir();
  const phantomjsConfigPath = path.resolve(
    homeDir,
    "./.mume/phantomjs_config.js",
  );

  let phantomjsConfig: object;
  if (fs.existsSync(phantomjsConfigPath)) {
    try {
      delete require.cache[phantomjsConfigPath]; // return uncached
      phantomjsConfig = require(phantomjsConfigPath);
    } catch (e) {
      phantomjsConfig = {};
    }
  } else {
    const fileContent = `/*
configure header and footer (and other options)
more information can be found here:
    https://github.com/marcbachmann/node-html-pdf
Attention: this config will override your config in exporter panel.

eg:

  let config = {
    "header": {
      "height": "45mm",
      "contents": '<div style="text-align: center;">Author: Marc Bachmann</div>'
    },
    "footer": {
      "height": "28mm",
      "contents": '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>'
    }
  }
*/
// you can edit the 'config' variable below
let config = {
}

module.exports = config || {}
`;
    await writeFile(phantomjsConfigPath, fileContent, { encoding: "utf-8" });
    phantomjsConfig = {};
  }

  return phantomjsConfig;
}

export const defaultMathjaxConfig = {
  extensions: ["tex2jax.js"],
  jax: ["input/TeX", "output/HTML-CSS"],
  messageStyle: "none",
  tex2jax: {
    processEnvironments: false,
    processEscapes: true,
  },
  TeX: {
    extensions: [
      "AMSmath.js",
      "AMSsymbols.js",
      "noErrors.js",
      "noUndefined.js",
    ],
  },
  "HTML-CSS": { availableFonts: ["TeX"] },
};

/**
 * load ~/.mume/mermaid_config.js file.
 */
export async function getMathJaxConfig(): Promise<object> {
  const homeDir = os.homedir();
  const mathjaxConfigPath = path.resolve(homeDir, "./.mume/mathjax_config.js");

  let mathjaxConfig: object;
  if (fs.existsSync(mathjaxConfigPath)) {
    try {
      delete require.cache[mathjaxConfigPath]; // return uncached
      mathjaxConfig = require(mathjaxConfigPath);
    } catch (e) {
      mathjaxConfig = defaultMathjaxConfig;
    }
  } else {
    const fileContent = `
module.exports = {
  extensions: ['tex2jax.js'],
  jax: ['input/TeX','output/HTML-CSS'],
  messageStyle: 'none',
  tex2jax: {
    processEnvironments: false,
    processEscapes: true
  },
  TeX: {
    extensions: ['AMSmath.js', 'AMSsymbols.js', 'noErrors.js', 'noUndefined.js']
  },
  'HTML-CSS': { availableFonts: ['TeX'] }
}
`;
    await writeFile(mathjaxConfigPath, fileContent, { encoding: "utf-8" });
    mathjaxConfig = defaultMathjaxConfig;
  }

  return mathjaxConfig;
}

export async function getExtensionConfig(): Promise<object> {
  const homeDir = os.homedir();
  const extensionConfigFilePath = path.resolve(homeDir, "./.mume/config.json");

  let config: object;
  if (fs.existsSync(extensionConfigFilePath)) {
    try {
      delete require.cache[extensionConfigFilePath]; // return uncached
      config = require(extensionConfigFilePath);
    } catch (error) {
      config = { error };
    }
  } else {
    config = {};
    await writeFile(extensionConfigFilePath, "{}", { encoding: "utf-8" });
  }
  return config;
}

/**
 * Update ~/.mume/config.json
 * @param newConfig The new config.
 */
export async function updateExtensionConfig(newConfig = {}): Promise<void> {
  let config = await getExtensionConfig();
  config = Object.assign(config, newConfig);

  const homeDir = os.homedir();
  fs.writeFile(
    path.resolve(homeDir, "./.mume/config.json"),
    JSON.stringify(config, null, 2),
    { encoding: "utf-8" },
    () => {
      return;
    },
  );
}

export async function getParserConfig(): Promise<object> {
  const homeDir = os.homedir();
  const parserConfigPath = path.resolve(homeDir, "./.mume/parser.js");

  let parserConfig: object;
  if (fs.existsSync(parserConfigPath)) {
    try {
      delete require.cache[parserConfigPath]; // return uncached
      parserConfig = require(parserConfigPath);
    } catch (error) {
      parserConfig = {};
    }
  } else {
    const template = `module.exports = {
  onWillParseMarkdown: function(markdown) {
    return new Promise((resolve, reject)=> {
      return resolve(markdown)
    })
  },
  onDidParseMarkdown: function(html) {
    return new Promise((resolve, reject)=> {
      return resolve(html)
    })
  }
}`;
    await writeFile(parserConfigPath, template, { encoding: "utf-8" });

    parserConfig = {};
  }

  return parserConfig;
}

/**
 * Check whether two arrays are equal
 * @param x
 * @param y
 */
export function isArrayEqual(x, y) {
  if (x.length !== y.length) {
    return false;
  }
  for (let i = 0; i < x.length; i++) {
    if (x[i] !== y[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Add file:// to file path
 * @param filePath
 */
export function addFileProtocol(filePath: string): string {
  if (!filePath.startsWith("file://")) {
    filePath = "file:///" + filePath;
  }
  filePath = filePath.replace(/^file\:\/+/, "file:///");
  return filePath;
}

/**
 * Remove file:// from file path
 * @param filePath
 */
export function removeFileProtocol(filePath: string): string {
  if (process.platform === "win32") {
    return filePath.replace(/^file\:\/+/, "");
  } else {
    return filePath.replace(/^file\:\/+/, "/");
  }
}

/**
 * style.less,
 * mathjax_config.js,
 * mermaid_config.js
 * phantomjs_config.js
 * config.json
 *
 * files
 */
export const configs: {
  globalStyle: string;
  mathjaxConfig: object;
  mermaidConfig: string;
  phantomjsConfig: object;
  parserConfig: object;
  /**
   * Please note that this is not necessarily MarkdownEngineConfig
   */
  config: object;
} = {
  globalStyle: "",
  mathjaxConfig: defaultMathjaxConfig,
  mermaidConfig: "MERMAID_CONFIG = {startOnLoad: false}",
  phantomjsConfig: {},
  parserConfig: {},
  config: {},
};

export { uploadImage } from "./image-uploader";

/**
 * Allow unsafed `eval` function
 * Referred from:
 *     https://github.com/atom/loophole/blob/master/src/loophole.coffee
 * @param fn
 */
export function allowUnsafeEval(fn) {
  const previousEval = global.eval;
  try {
    global.eval = (source) => {
      vm.runInThisContext(source);
    };
    return fn();
  } finally {
    global.eval = previousEval;
  }
}

export async function allowUnsafeEvalAync(fn: () => Promise<any>) {
  const previousEval = global.eval;
  try {
    global.eval = (source) => {
      vm.runInThisContext(source);
    };
    return await fn();
  } finally {
    global.eval = previousEval;
  }
}

export function allowUnsafeNewFunction(fn) {
  const previousFunction = global.Function;
  try {
    global.Function = Function as FunctionConstructor;
    return fn();
  } finally {
    global.Function = previousFunction;
  }
}

export async function allowUnsafeNewFunctionAsync(fn: () => Promise<any>) {
  const previousFunction = global.Function;
  try {
    global.Function = Function as FunctionConstructor;
    return await fn();
  } finally {
    global.Function = previousFunction;
  }
}

export async function allowUnsafeEvalAndUnsafeNewFunctionAsync(
  fn: () => Promise<any>,
) {
  const previousFunction = global.Function;
  const previousEval = global.eval;
  try {
    global.Function = Function as FunctionConstructor;
    global.eval = (source) => {
      vm.runInThisContext(source);
    };
    return await fn();
  } finally {
    global.eval = previousEval;
    global.Function = previousFunction;
  }
}

export function Function(...args: string[]) {
  let body = "";
  const paramLists: string[] = [];
  if (args.length) {
    body = arguments[args.length - 1];
    for (let i = 0; i < args.length - 1; i++) {
      paramLists.push(args[i]);
    }
  }

  const params = [];
  for (let j = 0, len = paramLists.length; j < len; j++) {
    let paramList: any = paramLists[j];
    if (typeof paramList === "string") {
      paramList = paramList.split(/\s*,\s*/);
    }
    params.push.apply(params, paramList);
  }

  return vm.runInThisContext(`
    (function(${params.join(", ")}) {
      ${body}
    })
  `);
}
Function.prototype = global.Function.prototype;
