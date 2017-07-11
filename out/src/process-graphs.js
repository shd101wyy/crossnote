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
const cheerio = require("cheerio");
const plantumlAPI = require("./puml");
const utility = require("./utility");
const magick_1 = require("./magick");
// import {mermaidToPNG} from "./mermaid"
const code_chunk_1 = require("./code-chunk");
const Viz = require(path.resolve(utility.extensionDirectoryPath, './dependencies/viz/viz.js'));
const jsonic = require(path.resolve(utility.extensionDirectoryPath, './dependencies/jsonic/jsonic.js'));
const md5 = require(path.resolve(utility.extensionDirectoryPath, './dependencies/javascript-md5/md5.js'));
function processGraphs(text, { fileDirectoryPath, projectDirectoryPath, imageDirectoryPath, imageFilePrefix, useRelativeFilePath, codeChunksData, graphsCache }) {
    return __awaiter(this, void 0, void 0, function* () {
        let lines = text.split('\n');
        const codes = [];
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const trimmedLine = line.trim();
            if (trimmedLine.match(/^```(.+)\"?cmd\"?\:/) ||
                trimmedLine.match(/^```(puml|plantuml|dot|viz|mermaid)/)) {
                const numOfSpacesAhead = line.match(/^\s*/).length;
                let j = i + 1;
                let content = '';
                while (j < lines.length) {
                    if (lines[j].trim() == '```' && lines[j].match(/^\s*/).length == numOfSpacesAhead) {
                        let options = {}, optionsStr = '', optionsMatch;
                        if (optionsMatch = trimmedLine.match(/\{(.+)\}$/)) {
                            try {
                                options = jsonic(optionsMatch[0]);
                                optionsStr = optionsMatch[1];
                            }
                            catch (error) {
                                options = {};
                            }
                        }
                        codes.push({
                            start: i,
                            end: j,
                            content,
                            options,
                            optionsStr
                        });
                        i = j;
                        break;
                    }
                    content += (lines[j] + '\n');
                    j += 1;
                }
            }
            else if (trimmedLine.match(/^```\S/)) {
                const indexOfFirstSpace = line.indexOf(' ', line.indexOf('```'));
                if (indexOfFirstSpace > 0)
                    lines[i] = line.slice(0, indexOfFirstSpace);
            }
            else if (!trimmedLine) {
                lines[i] = '  ';
            }
            i += 1;
        }
        if (!imageFilePrefix)
            imageFilePrefix = (Math.random().toString(36).substr(2, 9) + '_');
        imageFilePrefix = imageFilePrefix.replace(/[\/&]/g, '_ss_');
        imageFilePrefix = encodeURIComponent(imageFilePrefix);
        let imgCount = 0;
        const asyncFunctions = [], imagePaths = [];
        let currentCodeChunk = null;
        for (let key in codeChunksData) {
            if (!codeChunksData[key].prev) {
                currentCodeChunk = codeChunksData[key];
                break;
            }
        }
        function clearCodeBlock(lines, start, end) {
            let i = start;
            while (i <= end) {
                lines[i] = '';
                i += 1;
            }
        }
        function convertSVGToPNGFile(svg, lines, start, end, modifyCodeBlock) {
            return __awaiter(this, void 0, void 0, function* () {
                const pngFilePath = path.resolve(imageDirectoryPath, imageFilePrefix + imgCount + '.png');
                yield magick_1.svgElementToPNGFile(svg, pngFilePath);
                let displayPNGFilePath;
                if (useRelativeFilePath) {
                    displayPNGFilePath = path.relative(fileDirectoryPath, pngFilePath) + '?' + Math.random();
                }
                else {
                    displayPNGFilePath = '/' + path.relative(projectDirectoryPath, pngFilePath) + '?' + Math.random();
                }
                displayPNGFilePath = displayPNGFilePath.replace(/\\/g, '/'); // fix windows path error.
                imgCount++;
                if (modifyCodeBlock) {
                    clearCodeBlock(lines, start, end);
                    lines[end] += '\n' + `![](${displayPNGFilePath})  `;
                }
                imagePaths.push(pngFilePath);
                return displayPNGFilePath;
            });
        }
        for (let i = 0; i < codes.length; i++) {
            const codeData = codes[i];
            const { start, end, content, options, optionsStr } = codeData;
            const def = lines[start].trim().slice(3).trim();
            if (def.match(/^(puml|plantuml)/)) {
                try {
                    const checksum = md5(optionsStr + content);
                    let svg;
                    if (!(svg = graphsCache[checksum])) {
                        svg = yield plantumlAPI.render(content, fileDirectoryPath);
                    }
                    yield convertSVGToPNGFile(svg, lines, start, end, true);
                }
                catch (error) {
                    clearCodeBlock(lines, start, end);
                    lines[end] += `\n` + `\`\`\`\n${error}\n\`\`\`  \n`;
                }
            }
            else if (def.match(/^(viz|dot)/)) {
                try {
                    const checksum = md5(optionsStr + content);
                    let svg;
                    if (!(svg = graphsCache[checksum])) {
                        const engine = options['engine'] || 'dot';
                        svg = Viz(content, { engine });
                    }
                    yield convertSVGToPNGFile(svg, lines, start, end, true);
                }
                catch (error) {
                    clearCodeBlock(lines, start, end);
                    lines[end] += `\n` + `\`\`\`\n${error}\n\`\`\`  \n`;
                }
            }
            else if (def.match(/^mermaid/)) {
                // do nothing as it doesn't work well...
                /*
                try {
                  const pngFilePath = path.resolve(imageDirectoryPath, imageFilePrefix+imgCount+'.png')
                  imgCount++
                  await mermaidToPNG(content, pngFilePath)
          
                  let displayPNGFilePath
                  if (useRelativeFilePath) {
                    displayPNGFilePath = path.relative(fileDirectoryPath, pngFilePath) + '?' + Math.random()
                  } else {
                    displayPNGFilePath = '/' + path.relative(projectDirectoryPath, pngFilePath) + '?' + Math.random()
                  }
                  clearCodeBlock(lines, start, end)
                  
                  lines[end] += '\n' + `![](${displayPNGFilePath})  `
          
                  imagePaths.push(pngFilePath)
                } catch(error) {
                  clearCodeBlock(lines, start, end)
                  lines[end] += `\n` + `\`\`\`\n${error}\n\`\`\`  \n`
                }
                */
            }
            else if (currentCodeChunk) {
                if (currentCodeChunk.options['hide']) {
                    clearCodeBlock(lines, start, end);
                }
                else {
                    const line = lines[start];
                    const indexOfFirstSpace = line.indexOf(' ', line.indexOf('```'));
                    lines[start] = line.slice(0, indexOfFirstSpace);
                }
                if (currentCodeChunk.result) {
                    let result = currentCodeChunk.result;
                    const options = currentCodeChunk.options;
                    if (options['output'] === 'html' || options['matplotlib']) {
                        const $ = cheerio.load(currentCodeChunk.result, { xmlMode: true }); // xmlMode here is necessary...
                        const svg = $('svg');
                        if (svg.length === 1) {
                            const pngFilePath = (yield convertSVGToPNGFile($.html('svg'), lines, start, end, false)).replace(/\\/g, '/');
                            result = `![](${pngFilePath})  \n`;
                        }
                    }
                    else if (options['cmd'].match(/^(la)?tex$/)) {
                        result = yield code_chunk_1.compileLaTeX(content, fileDirectoryPath, Object.assign({}, options, { latex_svg_dir: imageDirectoryPath }));
                    }
                    else if (currentCodeChunk.options['output'] === 'markdown') {
                        result = currentCodeChunk.plainResult;
                    }
                    lines[end] += ('\n' + result);
                }
                currentCodeChunk = codeChunksData[currentCodeChunk.next];
            }
        }
        yield Promise.all(asyncFunctions);
        const outputString = lines.filter((line) => line).join('\n');
        return { outputString, imagePaths };
    });
}
exports.processGraphs = processGraphs;
