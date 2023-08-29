import * as child_process from 'child_process';
import * as fs from 'fs';
import * as YAML from 'yaml';
import * as less from 'less';
import * as os from 'os';
import * as path from 'path';
import * as vm from 'vm';
import * as temp from 'temp';
import * as vscode from 'vscode';
import { BlockInfo } from './lib/block-info';

temp.track();

const TAGS_TO_REPLACE = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '\\': '&#x5C;',
};

const TAGS_TO_REPLACE_REVERSE = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#x27;': "'",
  '&#x2F;': '/',
  '&#x5C;': '\\',
};

export function escapeString(str: string = ''): string {
  return str.replace(/[&<>"'\/\\]/g, tag => TAGS_TO_REPLACE[tag] || tag);
}

export function unescapeString(str: string = ''): string {
  return str.replace(
    /\&(amp|lt|gt|quot|apos|\#x27|\#x2F|\#x5C)\;/g,
    whole => TAGS_TO_REPLACE_REVERSE[whole] || whole,
  );
}

export interface ParserConfig {
  onWillParseMarkdown?: (markdown: string) => Promise<string>;
  onDidParseMarkdown?: (
    html: string,
    opts: { cheerio: CheerioAPI },
  ) => Promise<string>;
  onWillTransformMarkdown?: (markdown: string) => Promise<string>;
  onDidTransformMarkdown?: (markdown: string) => Promise<string>;
}

/**
 * Do nothing and sleep for `ms` milliseconds
 * @param ms
 */
export function sleep(ms: number) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      return resolve();
    }, ms);
  });
}

export function parseYAML(yaml: string = '') {
  // YAML doesn't work well with front-matter
  /*
  try {
    return YAML.parse(yaml)
  } catch(error) {
    return {}
  }
  */
  if (yaml.startsWith('---')) {
    yaml = yaml
      .trim()
      .replace(/^---\r?\n/, '')
      .replace(/\r?\n---$/, '');
  }
  try {
    return YAML.parse(yaml);
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
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(file, text, options, error => {
      if (error) {
        return reject(error.toString());
      } else {
        return resolve();
      }
    });
  });
}

export function write(fd: number, text: string) {
  return new Promise<void>((resolve, reject) => {
    fs.write(fd, text, error => {
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
        return resolve(stdout as any);
      }
    });
  });
}

/**
 * open html file in browser or open pdf file in reader ... etc
 * @param filePath
 */
export function openFile(filePath: string) {
  if (process.platform === 'win32') {
    if (filePath.match(/^[a-zA-Z]:\\/)) {
      // C:\ like url.
      filePath = 'file:///' + filePath;
    }
    if (filePath.startsWith('file:///')) {
      return child_process.execFile('explorer.exe', [filePath]);
    } else {
      return child_process.exec(`start ${filePath}`);
    }
  } else if (process.platform === 'darwin') {
    child_process.execFile('open', [filePath]);
  } else {
    child_process.execFile('xdg-open', [filePath]);
  }
}

/**
 * get the directory path of this extension.
 */
export const extensionDirectoryPath = path.resolve(__dirname, '../../');

/**
 * compile ~/.mumi/style.less and return 'css' content.
 */
export async function getGlobalStyles(configPath: string): Promise<string> {
  const globalLessFilePath = configPath
    ? path.resolve(configPath, './style.less')
    : path.resolve(getConfigPath(), './style.less');

  let fileContent: string;
  try {
    fileContent = await readFile(globalLessFilePath, { encoding: 'utf-8' });
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
    await writeFile(globalLessFilePath, fileContent, { encoding: 'utf-8' });
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
          return resolve(output.css || '');
        }
      },
    );
  });
}

/**
 * Get default config path
 * @
 */
export function getConfigPath() {
  const oldDefault = path.resolve(os.homedir(), './.mume');

  // For compatibility, use the old directory if either it exists
  // or the user is on windows
  if (fs.existsSync(oldDefault) || process.platform === 'win32') {
    return oldDefault;
  } else {
    // Calculate new default
    if (
      typeof process.env.XDG_CONFIG_HOME === 'string' &&
      process.env.XDG_CONFIG_HOME !== ''
    ) {
      return path.resolve(process.env.XDG_CONFIG_HOME, './mume');
    } else {
      return path.resolve(os.homedir(), './.local/state/mume');
    }
  }
}

/**
 * load ~/.config/mume/mermaid_config.js file.
 */
export async function getMermaidConfig(configPath: string): Promise<string> {
  const mermaidConfigPath = configPath
    ? path.resolve(configPath, './mermaid_config.js')
    : path.resolve(getConfigPath(), './mermaid_config.js');

  let mermaidConfig: string;
  if (fs.existsSync(mermaidConfigPath)) {
    try {
      mermaidConfig = await readFile(mermaidConfigPath, { encoding: 'utf-8' });
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
    await writeFile(mermaidConfigPath, fileContent, { encoding: 'utf-8' });
    mermaidConfig = `MERMAID_CONFIG = {startOnLoad: false}`;
  }

  return mermaidConfig;
}

export const defaultMathjaxConfig = {
  extensions: ['tex2jax.js'],
  jax: ['input/TeX', 'output/HTML-CSS'],
  messageStyle: 'none',
  tex2jax: {
    processEnvironments: false,
    processEscapes: true,
  },
  TeX: {
    extensions: [
      'AMSmath.js',
      'AMSsymbols.js',
      'noErrors.js',
      'noUndefined.js',
    ],
  },
  'HTML-CSS': { availableFonts: ['TeX'] },
};

export const defaultKaTeXConfig = {
  macros: {},
};

/**
 * load ~/.config/mume/mathjax_config.js file.
 */
export async function getMathJaxConfig(configPath: string): Promise<object> {
  const mathjaxConfigPath = configPath
    ? path.resolve(configPath, './mathjax_config.js')
    : path.resolve(getConfigPath(), './mathjax_config.js');

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
    await writeFile(mathjaxConfigPath, fileContent, { encoding: 'utf-8' });
    mathjaxConfig = defaultMathjaxConfig;
  }

  return mathjaxConfig;
}

/**
 * load ~/.config/mume/katex_config.js file
 */
export async function getKaTeXConfig(configPath: string): Promise<object> {
  const katexConfigPath = configPath
    ? path.resolve(configPath, './katex_config.js')
    : path.resolve(getConfigPath(), './katex_config.js');

  let katexConfig: object;
  if (fs.existsSync(katexConfigPath)) {
    try {
      delete require.cache[katexConfigPath]; // return uncached
      katexConfig = require(katexConfigPath);
    } catch (e) {
      katexConfig = defaultKaTeXConfig;
    }
  } else {
    const fileContent = `
module.exports = {
  macros: {}
}`;
    await writeFile(katexConfigPath, fileContent, { encoding: 'utf-8' });
    katexConfig = defaultKaTeXConfig;
  }
  return katexConfig;
}

export async function getExtensionConfig(configPath: string): Promise<object> {
  const extensionConfigFilePath = configPath
    ? path.resolve(configPath, './config.json')
    : path.resolve(getConfigPath(), './config.json');

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
    await writeFile(extensionConfigFilePath, '{}', { encoding: 'utf-8' });
  }
  return config;
}

export async function getParserConfig(
  configPath: string,
): Promise<ParserConfig> {
  const parserConfigPath = configPath
    ? path.resolve(configPath, './parser.js')
    : path.resolve(getConfigPath(), './parser.js');

  let parserConfig: ParserConfig;
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
  onDidParseMarkdown: function(html, {cheerio}) {
    return new Promise((resolve, reject)=> {
      return resolve(html)
    })
  },
  onWillTransformMarkdown: function (markdown) {
        return new Promise((resolve, reject) => {
            return resolve(markdown);
        });
    },
  onDidTransformMarkdown: function (markdown) {
      return new Promise((resolve, reject) => {
          return resolve(markdown);
      });
  }
}`;
    await writeFile(parserConfigPath, template, { encoding: 'utf-8' });

    parserConfig = {};
  }

  return parserConfig;
}

let _externalAddFileProtocolFunction:
  | ((filePath: string, vscodePreviewPanel: vscode.WebviewPanel) => string)
  | null = null;

export function useExternalAddFileProtocolFunction(
  func: (filePath: string, vscodePreviewPanel: vscode.WebviewPanel) => string,
) {
  _externalAddFileProtocolFunction = func;
}

/**
 * Add file:/// to file path
 * If it's for VSCode preview, add vscode-resource:/// to file path
 * @param filePath
 */
export function addFileProtocol(
  filePath: string,
  vscodePreviewPanel?: vscode.WebviewPanel | null,
): string {
  if (_externalAddFileProtocolFunction && vscodePreviewPanel) {
    return _externalAddFileProtocolFunction(filePath, vscodePreviewPanel);
  } else {
    if (!filePath.startsWith('file://')) {
      filePath = 'file:///' + filePath;
    }
    filePath = filePath.replace(/^file\:\/+/, 'file:///');
  }
  return filePath;
}

/**
 * Remove file:// from file path
 * @param filePath
 */
export function removeFileProtocol(filePath: string): string {
  // See https://regex101.com/r/YlpEur/8/
  // - "file://///a///b//c/d"                   ---> "a///b//c/d"
  // - "vscode-resource://///file///a///b//c/d" ---> "file///a///b//c/d"
  const regex = /^(?:(?:file|(vscode)-(?:webview-)?resource|vscode--resource):\/+)(.*)/m;

  return filePath.replace(regex, (m, isVSCode, rest) => {
    if (isVSCode) {
      // For vscode urls -> Remove host: `file///C:/a/b/c` -> `C:/a/b/c`
      rest = rest.replace(/^file\/+/, '');
    }

    if (process.platform !== 'win32' && !rest.startsWith('/')) {
      // On Linux platform, add a slash at the front
      return '/' + rest;
    } else {
      return rest;
    }
  });
}

/**
 * style.less,
 * mathjax_config.js,
 * mermaid_config.js
 * config.json
 *
 * files
 */
// @ts-ignore
export const configs: {
  globalStyle: string;
  mathjaxConfig: object;
  katexConfig: object;
  mermaidConfig: string;
  parserConfig: ParserConfig;
  /**
   * Please note that this is not necessarily MarkdownEngineConfig
   */
  config: object;
} = {
  globalStyle: '',
  mathjaxConfig: defaultMathjaxConfig,
  katexConfig: defaultKaTeXConfig,
  mermaidConfig: 'MERMAID_CONFIG = {startOnLoad: false}',
  parserConfig: {},
  config: {},
};

export { uploadImage } from './image-uploader';

/**
 * Allow unsafed `eval` function
 * Referred from:
 *     https://github.com/atom/loophole/blob/master/src/loophole.coffee
 * @param fn
 */
export function allowUnsafeEval(fn) {
  const previousEval = global.eval;
  try {
    global.eval = source => {
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
    global.eval = source => {
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
    global.eval = source => {
      vm.runInThisContext(source);
    };
    return await fn();
  } finally {
    global.eval = previousEval;
    global.Function = previousFunction;
  }
}

export const loadDependency = (dependencyPath: string) =>
  allowUnsafeEval(() =>
    allowUnsafeNewFunction(() =>
      require(path.resolve(
        extensionDirectoryPath,
        'dependencies',
        dependencyPath,
      )),
    ),
  );

export const extractCommandFromBlockInfo = (info: BlockInfo) =>
  info.attributes['cmd'] === true ? info.language : info.attributes['cmd'];

export function Function(...args: string[]) {
  let body = '';
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
    if (typeof paramList === 'string') {
      paramList = paramList.split(/\s*,\s*/);
    }
    params.push.apply(params, paramList);
  }

  return vm.runInThisContext(`
    (function(${params.join(', ')}) {
      ${body}
    })
  `);
}
Function.prototype = global.Function.prototype;
