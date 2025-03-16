import structuredClone from '@ungap/structured-clone';
import * as child_process from 'child_process';
import * as path from 'path';
import Sval from 'sval';
import * as temp from 'temp';
import { JsonObject } from 'type-fest';
import { fileURLToPath } from 'url';
import * as vm from 'vm';
import * as vscode from 'vscode';
import * as YAML from 'yaml';
import { BlockInfo } from './lib/block-info';

// Polyfill structuredClone if it's not supported
if (!('structuredClone' in globalThis)) {
  globalThis.structuredClone = structuredClone;
}

temp.track();

export function tempOpen(options: temp.AffixOptions): Promise<temp.OpenFile> {
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
 * Do nothing and sleep for `ms` milliseconds
 * @param ms
 */
export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      return resolve();
    }, ms);
  });
}

export function parseYAML(yaml: string = ''): JsonObject {
  if (yaml.startsWith('---')) {
    yaml = yaml
      .trim()
      .replace(/^---\r?\n/, '')
      .replace(/\r?\n---$/, '');
  }
  try {
    return YAML.parse(yaml);
  } catch (error) {
    return {
      error: error.toString(),
    };
  }
}

/**
 * NOTE: The __dirname is actually the ./out/(esm|cjs) directory
 * Get the `./out` directory.
 */
let crossnoteBuildDirectory_: string = (() => {
  if (typeof __dirname !== 'undefined') {
    return path.resolve(__dirname, '../');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
  } else if (import.meta.url) {
    // esm
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.resolve(__dirname, '../');
  } else {
    return '';
  }
})();

export function setCrossnoteBuildDirectory(path: string) {
  crossnoteBuildDirectory_ = path;
}

/**
 * Get the directory path of this npm package with the following directory structure:
 * You can use the `setCrossnoteBuildDirectory` function to set the directory path.
 * ```
 *  out
 *  ├── cjs
 *  ├── dependencies
 *  ├── esm
 *  ├── styles
 *  ├── types
 *  └── webview
 * ```
 * @returns
 */
export function getCrossnoteBuildDirectory() {
  return crossnoteBuildDirectory_;
}

let _externalAddFileProtocolFunction:
  | ((filePath: string, vscodePreviewPanel: vscode.WebviewPanel) => string)
  | null = null;

export function useExternalAddFileProtocolFunction(
  func: (
    filePath: string,
    vscodePreviewPanel?: vscode.WebviewPanel | null,
  ) => string,
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
    filePath = filePath.replace(/^file:\/+/, 'file:///');
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
  const regex =
    /^(?:(?:file|(vscode)-(?:webview-)?resource|vscode--resource):\/+)(.*)/m;

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

export { uploadImage } from './tools/image-uploader';

/**
 * Allow unsafed `eval` function
 * Referred from:
 *     https://github.com/atom/loophole/blob/master/src/loophole.coffee
 * @param fn
 */
export function allowUnsafeEval(fn) {
  const previousEval = globalThis.eval;
  try {
    globalThis.eval = (source) => vm.runInThisContext(source);

    return fn();
  } finally {
    globalThis.eval = previousEval;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function allowUnsafeEvalAync(fn: () => Promise<any>) {
  const previousEval = globalThis.eval;
  try {
    globalThis.eval = (source) => vm.runInThisContext(source);

    return await fn();
  } finally {
    globalThis.eval = previousEval;
  }
}

export function allowUnsafeNewFunction(fn) {
  const previousFunction = globalThis.Function;
  try {
    globalThis.Function = Function as FunctionConstructor;
    return fn();
  } finally {
    globalThis.Function = previousFunction;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function allowUnsafeNewFunctionAsync(fn: () => Promise<any>) {
  const previousFunction = globalThis.Function;
  try {
    globalThis.Function = Function as FunctionConstructor;
    return await fn();
  } finally {
    globalThis.Function = previousFunction;
  }
}

export async function allowUnsafeEvalAndUnsafeNewFunctionAsync(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: () => Promise<any>,
) {
  const previousFunction = globalThis.Function;
  const previousEval = globalThis.eval;
  try {
    globalThis.Function = Function as FunctionConstructor;
    globalThis.eval = (source) => vm.runInThisContext(source);
    return await fn();
  } finally {
    globalThis.eval = previousEval;
    globalThis.Function = previousFunction;
  }
}

export const loadDependency = (dependencyPath: string) =>
  allowUnsafeEval(() =>
    allowUnsafeNewFunction(() =>
      require(
        path.resolve(
          getCrossnoteBuildDirectory(),
          'dependencies',
          dependencyPath,
        ),
      ),
    ),
  );

export const extractCommandFromBlockInfo = (info: BlockInfo) =>
  info.attributes['cmd'] === true ? info.language : info.attributes['cmd'];

export function Function(...args: string[]) {
  let body = '';
  const paramLists: string[] = [];
  if (args.length) {
    body = args[args.length - 1];
    for (let i = 0; i < args.length - 1; i++) {
      paramLists.push(args[i]);
    }
  }

  const params = [];
  for (let j = 0, len = paramLists.length; j < len; j++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let paramList: any = paramLists[j];
    if (typeof paramList === 'string') {
      paramList = paramList.split(/\s*,\s*/);
    }
    // eslint-disable-next-line prefer-spread
    params.push.apply(params, paramList);
  }

  return vm.runInThisContext(`
    (function(${params.join(', ')}) {
      ${body}
    })
  `);
}
Function.prototype = globalThis.Function.prototype;

export function isVSCodeWebExtension() {
  return process.env.IS_VSCODE_WEB_EXTENSION === 'true';
}

/**
 * This function is used to evaluate the config.js and parser.js
 * @param code
 */
export function interpretJS(code: string) {
  code = code.trim().replace(/[;,]+$/, '');
  if (isVSCodeWebExtension()) {
    const interpreter = new Sval({
      sandBox: true,
      ecmaVer: 2019,
    });
    interpreter.run(`exports.result = (${code})`);
    return interpreter.exports.result;
  } else {
    const context = {};
    vm.runInNewContext(`result = (${code})`, context);
    return context['result'];
  }
}

export function findClosingTagIndex(
  inputString: string,
  tagName: string,
  startIndex = 0,
) {
  const openTag = `<${tagName}`;
  const closeTag = `</${tagName}>`;
  const stack: number[] = [];
  let inComment = false;

  // Start searching from the specified startIndex
  for (let i = startIndex; i < inputString.length; i++) {
    // Check for the start of a comment
    if (inputString.substring(i, i + 4) === '<!--') {
      inComment = true;
      i += 3; // Skip the comment start
    }

    // Check for the end of a comment
    if (inComment && inputString.substring(i, i + 3) === '-->') {
      inComment = false;
      i += 2; // Skip the comment end
    }

    // Skip characters inside comments
    if (inComment) continue;

    // Check for the opening tag
    if (inputString.substring(i, i + openTag.length) === openTag) {
      stack.push(i);
    }

    // Check for the closing tag
    if (inputString.substring(i, i + closeTag.length) === closeTag) {
      if (stack.length === 0) {
        // No matching opening tag found, return -1
        return -1;
      } else {
        stack.pop(); // Remove the corresponding opening tag
        if (stack.length === 0) {
          // If the stack is empty, the closing tag is found
          return i;
        }
      }
    }
  }

  // If we reach here, no closing tag was found, return -1
  return -1;
}

export function replaceVariablesInString(
  inputString: string,
  replacements: { [key: string]: string } = {},
) {
  return inputString.replace(/\${([^}]+)}/g, (match, token) => {
    if (token.startsWith('env:')) {
      return process.env[token.replace(/^env:/, '').trim()] ?? '';
    } else {
      return replacements[token] ?? match;
    }
  });
}
