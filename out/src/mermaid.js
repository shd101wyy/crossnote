"use strict";
/**
 * A wrapper of mermaid CLI
 * http://knsv.github.io/mermaid/#mermaid-cli
 * But it doesn't work well
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
const fs = require("fs");
const path = require("path");
const utility = require("./utility");
function mermaidToPNG(mermaidCode, pngFilePath, css = "mermaid.css") {
    return __awaiter(this, void 0, void 0, function* () {
        const info = yield utility.tempOpen({ prefix: 'mume-mermaid', suffix: '.mermaid' });
        yield utility.write(info.fd, mermaidCode);
        try {
            yield utility.execFile('mermaid', [info.path, '-p',
                '-o', path.dirname(info.path),
                '--css', path.resolve(utility.extensionDirectoryPath, './dependencies/mermaid/' + css)
            ]);
            console.log(info.path);
            fs.createReadStream(info.path + '.png').pipe(fs.createWriteStream(pngFilePath));
            fs.unlink(info.path + '.png', () => { });
            return pngFilePath;
        }
        catch (error) {
            throw "mermaid CLI is required to be installed.\nCheck http://knsv.github.io/mermaid/#mermaid-cli for more information.\n\n" + error.toString();
        }
    });
}
exports.mermaidToPNG = mermaidToPNG;
