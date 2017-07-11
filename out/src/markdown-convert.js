"use strict";
/**
 * Convert MPE markdown to Githb Flavored Markdown
 */
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
const mkdirp = require("mkdirp");
// processGraphs = require './process-graphs'
// encrypt = require './encrypt'
// CACHE = require './cache'
const transformer_1 = require("./transformer");
const utility = require("./utility");
const process_graphs_1 = require("./process-graphs");
const md5 = require(path.resolve(utility.extensionDirectoryPath, './dependencies/javascript-md5/md5.js'));
/**
 * Convert all math expressions inside markdown to images.
 * @param text input markdown text
 * @param config
 */
function processMath(text, { mathInlineDelimiters, mathBlockDelimiters }) {
    let line = text.replace(/\\\$/g, '#slash_dollarsign#');
    const inline = mathInlineDelimiters;
    const block = mathBlockDelimiters;
    const inlineBegin = '(?:' + inline.map((x) => x[0])
        .join('|')
        .replace(/\\/g, '\\\\')
        .replace(/([\(\)\[\]\$])/g, '\\$1') + ')';
    const inlineEnd = '(?:' + inline.map((x) => x[1])
        .join('|')
        .replace(/\\/g, '\\\\')
        .replace(/([\(\)\[\]\$])/g, '\\$1') + ')';
    const blockBegin = '(?:' + block.map((x) => x[0])
        .join('|')
        .replace(/\\/g, '\\\\')
        .replace(/([\(\)\[\]\$])/g, '\\$1') + ')';
    const blockEnd = '(?:' + block.map((x) => x[1])
        .join('|')
        .replace(/\\/g, '\\\\')
        .replace(/([\(\)\[\]\$])/g, '\\$1') + ')';
    // display
    line = line.replace(new RegExp(`(\`\`\`(?:[\\s\\S]+?)\`\`\`\\s*(?:\\n|$))|(?:${blockBegin}([\\s\\S]+?)${blockEnd})`, 'g'), ($0, $1, $2) => {
        if ($1)
            return $1;
        let math = $2;
        math = math.replace(/\n/g, '').replace(/\#slash\_dollarsign\#/g, '\\\$');
        math = utility.escapeString(math);
        return `<p align="center"><img src=\"https://latex.codecogs.com/gif.latex?${math.trim()}\"/></p>`;
    });
    // inline
    line = line.replace(new RegExp(`(\`\`\`(?:[\\s\\S]+?)\`\`\`\\s*(?:\\n|$))|(?:${inlineBegin}([\\s\\S]+?)${inlineEnd})`, 'g'), ($0, $1, $2) => {
        if ($1)
            return $1;
        let math = $2;
        math = math.replace(/\n/g, '').replace(/\#slash\_dollarsign\#/g, '\\\$');
        math = utility.escapeString(math);
        return `<img src=\"https://latex.codecogs.com/gif.latex?${math.trim()}\"/>`;
    });
    line = line.replace(/\#slash\_dollarsign\#/g, '\\\$');
    return line;
}
/**
 * Format paths
 * @param text
 * @param fileDirectoryPath
 * @param projectDirectoryPath
 * @param useRelativeFilePath
 * @param protocolsWhiteListRegExp
 */
function processPaths(text, fileDirectoryPath, projectDirectoryPath, useRelativeFilePath, protocolsWhiteListRegExp) {
    let match = null, offset = 0, output = '';
    function resolvePath(src) {
        if (src.match(protocolsWhiteListRegExp)) {
            // do nothing
        }
        else if (useRelativeFilePath) {
            if (src.startsWith('/'))
                src = path.relative(fileDirectoryPath, path.resolve(projectDirectoryPath, '.' + src));
        }
        else {
            if (!src.startsWith('/'))
                src = '/' + path.relative(projectDirectoryPath, path.resolve(fileDirectoryPath, src));
        }
        return src.replace(/\\/g, '/'); // https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/17
    }
    let inBlock = false;
    let lines = text.split('\n');
    lines = lines.map((line) => {
        if (line.match(/^\s*```/)) {
            inBlock = !inBlock;
            return line;
        }
        else if (inBlock)
            return line;
        else {
            // replace path in ![](...) and []()
            let r = /(\!?\[.*?]\()([^\)|^'|^"]*)(.*?\))/gi;
            line = line.replace(r, (whole, a, b, c) => {
                if (b[0] === '<') {
                    b = b.slice(1, b.length - 1);
                    return a + '<' + resolvePath(b.trim()) + '> ' + c;
                }
                else {
                    return a + resolvePath(b.trim()) + ' ' + c;
                }
            });
            // replace path in tag
            r = /(<[img|a|iframe].*?[src|href]=['"])(.+?)(['"].*?>)/gi;
            line = line.replace(r, (whole, a, b, c) => {
                return a + resolvePath(b) + c;
            });
            return line;
        }
    });
    return lines.join('\n');
}
function markdownConvert(text, { projectDirectoryPath, fileDirectoryPath, protocolsWhiteListRegExp, filesCache, mathInlineDelimiters, mathBlockDelimiters, codeChunksData, graphsCache, usePandocParser }, config) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!config['path'])
            throw '{path} has to be specified';
        if (!config['image_dir'])
            throw '{image_dir} has to be specified';
        // dest
        let outputFilePath;
        if (config['path'][0] == '/')
            outputFilePath = path.resolve(projectDirectoryPath, '.' + config['path']);
        else
            outputFilePath = path.resolve(fileDirectoryPath, config['path']);
        for (let key in filesCache) {
            if (key.endsWith('.pdf'))
                delete (filesCache[key]);
        }
        let imageDirectoryPath;
        if (config['image_dir'][0] === '/')
            imageDirectoryPath = path.resolve(projectDirectoryPath, '.' + config['image_dir']);
        else
            imageDirectoryPath = path.resolve(fileDirectoryPath, config['image_dir']);
        const useRelativeFilePath = !config['absolute_image_path'];
        // import external files
        const data = yield transformer_1.transformMarkdown(text, { fileDirectoryPath, projectDirectoryPath, useRelativeFilePath, filesCache, forPreview: false, protocolsWhiteListRegExp, imageDirectoryPath, usePandocParser });
        text = data.outputString;
        // change link path to project '/' path
        // this is actually differnet from pandoc-convert.coffee
        text = processPaths(text, fileDirectoryPath, projectDirectoryPath, useRelativeFilePath, protocolsWhiteListRegExp);
        text = processMath(text, { mathInlineDelimiters, mathBlockDelimiters });
        return yield new Promise((resolve, reject) => {
            mkdirp(imageDirectoryPath, (error, made) => {
                if (error)
                    return reject(error.toString());
                process_graphs_1.processGraphs(text, { fileDirectoryPath, projectDirectoryPath, imageDirectoryPath, imageFilePrefix: md5(outputFilePath), useRelativeFilePath, codeChunksData, graphsCache })
                    .then(({ outputString }) => {
                    fs.writeFile(outputFilePath, outputString, { encoding: 'utf-8' }, (error) => {
                        if (error)
                            return reject(error.toString());
                        return resolve(outputFilePath);
                    });
                });
            });
        });
    });
}
exports.markdownConvert = markdownConvert;
