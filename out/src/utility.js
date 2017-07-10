"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const os = require("os");
const child_process_1 = require("child_process");
const child_process = require("child_process");
const less = require("less");
const mkdirp_ = require("mkdirp");
const temp = require("temp");
temp.track();
const TAGS_TO_REPLACE = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#x27;',
    '\/': '&#x2F;',
    '\\': '&#x5C;',
};
const TAGS_TO_REPLACE_REVERSE = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': '\'',
    '&#x27;': '\'',
    '&#x2F;': '\/',
    '&#x5C;': '\\',
};
function escapeString(str) {
    return str.replace(/[&<>"'\/\\]/g, (tag) => (TAGS_TO_REPLACE[tag] || tag));
}
exports.escapeString = escapeString;
function unescapeString(str) {
    return str.replace(/\&(amp|lt|gt|quot|apos|\#x27|\#x2F|\#x5C)\;/g, (whole) => (TAGS_TO_REPLACE_REVERSE[whole] || whole));
}
exports.unescapeString = unescapeString;
function readFile(file, options) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, options, (error, text) => {
            if (error)
                return reject(error.toString());
            else
                return resolve(text);
        });
    });
}
exports.readFile = readFile;
function writeFile(file, text, options) {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, text, options, (error) => {
            if (error)
                return reject(error.toString());
            else
                return resolve();
        });
    });
}
exports.writeFile = writeFile;
function write(fd, text) {
    return new Promise((resolve, reject) => {
        fs.write(fd, text, (error) => {
            if (error)
                return reject(error.toString());
            return resolve();
        });
    });
}
exports.write = write;
function tempOpen(options) {
    return new Promise((resolve, reject) => {
        temp.open(options, function (error, info) {
            if (error)
                return reject(error.toString());
            return resolve(info);
        });
    });
}
exports.tempOpen = tempOpen;
function execFile(file, args, options) {
    return new Promise((resolve, reject) => {
        child_process.execFile(file, args, options, (error, stdout, stderr) => {
            if (error)
                return reject(error.toString());
            else if (stderr)
                return reject(stderr);
            else
                return resolve(stdout);
        });
    });
}
exports.execFile = execFile;
function mkdirp(dir) {
    return new Promise((resolve, reject) => {
        mkdirp_(dir, (error, made) => {
            if (error)
                return reject(error);
            return resolve(made);
        });
    });
}
exports.mkdirp = mkdirp;
/**
 * open html file in browser or open pdf file in reader ... etc
 * @param filePath
 */
function openFile(filePath) {
    let cmd;
    if (process.platform === 'win32')
        cmd = 'explorer';
    else if (process.platform === 'darwin')
        cmd = 'open';
    else
        cmd = 'xdg-open';
    child_process_1.exec(`${cmd} ${filePath}`);
}
exports.openFile = openFile;
/**
 * get "~/.mume" path
 */
exports.extensionConfigDirectoryPath = path.resolve(os.homedir(), './.mume');
/**
 * get the directory path of this extension.
 */
exports.extensionDirectoryPath = path.resolve(__dirname, "../../");
/**
 * compile ~/.mumi/style.less and return 'css' content.
 */
function getGlobalStyles() {
    return __awaiter(this, void 0, void 0, function* () {
        const homeDir = os.homedir();
        const globalLessFilePath = path.resolve(homeDir, './.mume/style.less');
        let fileContent;
        try {
            fileContent = yield readFile(globalLessFilePath, { encoding: 'utf-8' });
        }
        catch (e) {
            // create style.less file 
            fileContent = `
body {
  // modify your style here
  // eg: background-color: blue;
}    `;
            yield writeFile(globalLessFilePath, fileContent, { encoding: 'utf-8' });
        }
        return yield new Promise((resolve, reject) => {
            less.render(fileContent, { paths: [path.dirname(globalLessFilePath)] }, (error, output) => {
                if (error)
                    return reject(error);
                return resolve(output.css || '');
            });
        });
    });
}
exports.getGlobalStyles = getGlobalStyles;
/**
 * load ~/.mume/mermaid_config.js file.
 */
function getMermaidConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const homeDir = os.homedir();
        const mermaidConfigPath = path.resolve(homeDir, './.mume/mermaid_config.js');
        let mermaidConfig;
        if (fs.existsSync(mermaidConfigPath)) {
            try {
                mermaidConfig = yield readFile(mermaidConfigPath, { encoding: 'utf-8' });
            }
            catch (e) {
                mermaidConfig = `MERMAID_CONFIG = {startOnLoad: false}`;
            }
        }
        else {
            const fileContent = `// config mermaid init call
// http://knsv.github.io/mermaid/#configuration
//
// You can edit the 'MERMAID_CONFIG' variable below.
MERMAID_CONFIG = {
  startOnLoad: false
}
`;
            yield writeFile(mermaidConfigPath, fileContent, { encoding: 'utf-8' });
            mermaidConfig = `MERMAID_CONFIG = {startOnLoad: false}`;
        }
        return mermaidConfig;
    });
}
exports.getMermaidConfig = getMermaidConfig;
/**
 * load ~/.mume/phantomjs_config.js file.
 */
function getPhantomjsConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const homeDir = os.homedir();
        const phantomjsConfigPath = path.resolve(homeDir, './.mume/phantomjs_config.js');
        let phantomjsConfig;
        if (fs.existsSync(phantomjsConfigPath)) {
            try {
                delete require.cache[phantomjsConfigPath]; // return uncached
                phantomjsConfig = require(phantomjsConfigPath);
            }
            catch (e) {
                phantomjsConfig = {};
            }
        }
        else {
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
            yield writeFile(phantomjsConfigPath, fileContent, { encoding: 'utf-8' });
            phantomjsConfig = {};
        }
        return phantomjsConfig;
    });
}
exports.getPhantomjsConfig = getPhantomjsConfig;
const defaultMathjaxConfig = {
    extensions: ['tex2jax.js'],
    jax: ['input/TeX', 'output/HTML-CSS'],
    messageStyle: 'none',
    tex2jax: {
        processEnvironments: false,
        processEscapes: true
    },
    TeX: {
        extensions: ['AMSmath.js', 'AMSsymbols.js', 'noErrors.js', 'noUndefined.js']
    },
    'HTML-CSS': { availableFonts: ['TeX'] }
};
/**
 * load ~/.mume/mermaid_config.js file.
 */
function getMathJaxConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const homeDir = os.homedir();
        const mathjaxConfigPath = path.resolve(homeDir, './.mume/mathjax_config.js');
        let mathjaxConfig;
        if (fs.existsSync(mathjaxConfigPath)) {
            try {
                delete require.cache[mathjaxConfigPath]; // return uncached
                mathjaxConfig = require(mathjaxConfigPath);
            }
            catch (e) {
                mathjaxConfig = defaultMathjaxConfig;
            }
        }
        else {
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
            yield writeFile(mathjaxConfigPath, fileContent, { encoding: 'utf-8' });
            mathjaxConfig = defaultMathjaxConfig;
        }
        return mathjaxConfig;
    });
}
exports.getMathJaxConfig = getMathJaxConfig;
function getExtensionConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const homeDir = os.homedir();
        const extensionConfigFilePath = path.resolve(homeDir, './.mume/config.json');
        let config;
        if (fs.existsSync(extensionConfigFilePath)) {
            try {
                delete require.cache[extensionConfigFilePath]; // return uncached
                config = require(extensionConfigFilePath);
            }
            catch (error) {
                config = { error: error };
            }
        }
        else {
            config = {};
            yield writeFile(extensionConfigFilePath, '{}', { encoding: 'utf-8' });
        }
        return config;
    });
}
exports.getExtensionConfig = getExtensionConfig;
function getParserConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const homeDir = os.homedir();
        const parserConfigPath = path.resolve(homeDir, './.mume/parser.js');
        let parserConfig;
        if (fs.existsSync(parserConfigPath)) {
            try {
                delete require.cache[parserConfigPath]; // return uncached
                parserConfig = require(parserConfigPath);
            }
            catch (error) {
                parserConfig = {};
            }
        }
        else {
            const template = `module.exports = {
  onWillParseMarkdown: async function(markdown) {
    return markdown
  },
  onDidParseMarkdown: async function(html) {
    return html
  }
}
`;
            yield writeFile(parserConfigPath, template, { encoding: 'utf-8' });
            parserConfig = {};
        }
        return parserConfig;
    });
}
exports.getParserConfig = getParserConfig;
/**
 * Check whether two arrays are equal
 * @param x
 * @param y
 */
function isArrayEqual(x, y) {
    if (x.length !== y.length)
        return false;
    for (let i = 0; i < x.length; i++) {
        if (x[i] !== y[i])
            return false;
    }
    return true;
}
exports.isArrayEqual = isArrayEqual;
/**
 * Add file:// to file path
 * @param filePath
 */
function addFileProtocol(filePath) {
    if (!filePath.startsWith('file://')) {
        filePath = 'file:///' + filePath;
    }
    filePath = filePath.replace(/^file\:\/+/, 'file:///');
    return filePath;
}
exports.addFileProtocol = addFileProtocol;
/**
 * Remove file:// from file path
 * @param filePath
 */
function removeFileProtocol(filePath) {
    if (process.platform === 'win32') {
        return filePath.replace(/^file\:\/+/, '');
    }
    else {
        return filePath.replace(/^file\:\/+/, '/');
    }
}
exports.removeFileProtocol = removeFileProtocol;
/**
 * style.less,
 * mathjax_config.js,
 * mermaid_config.js
 * phantomjs_config.js
 * config.json
 *
 * files
 */
exports.extensionConfig = {
    globalStyle: "",
    mathjaxConfig: null,
    mermaidConfig: "MERMAID_CONFIG = {startOnLoad: false}",
    phantomjsConfig: {},
    parserConfig: {},
    config: {}
};
