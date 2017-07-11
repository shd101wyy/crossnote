"use strict";
/**
 * ImageMagick magick command wrapper
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
const utility = require("./utility");
function svgElementToPNGFile(svgElement, pngFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const info = yield utility.tempOpen({ prefix: "mume-svg", suffix: '.svg' });
        yield utility.write(info.fd, svgElement); // write svgElement to temp .svg file
        try {
            yield utility.execFile('magick', [info.path, pngFilePath]);
        }
        catch (error) {
            throw "ImageMagick is required to be installed to convert svg to png.\n" + error.toString();
        }
        return pngFilePath;
    });
}
exports.svgElementToPNGFile = svgElementToPNGFile;
