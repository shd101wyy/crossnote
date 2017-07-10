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
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const markdown_preview_enhanced_view_1 = require("./markdown-preview-enhanced-view");
const utility = require("./utility");
const smAPI = require("./sm");
const imgurAPI = require("./imgur");
/**
 * Copy ans paste image at imageFilePath to config.imageForlderPath.
 * Then insert markdown image url to markdown file.
 * @param uri
 * @param imageFilePath
 */
function pasteImageFile(sourceUri, imageFilePath) {
    if (typeof (sourceUri) === 'string') {
        sourceUri = vscode.Uri.parse(sourceUri);
    }
    const imageFolderPath = vscode.workspace.getConfiguration('markdown-preview-enhanced').get('imageFolderPath');
    let imageFileName = path.basename(imageFilePath);
    const projectDirectoryPath = vscode.workspace.rootPath;
    let assetDirectoryPath, description;
    if (imageFolderPath[0] === '/') {
        assetDirectoryPath = path.resolve(projectDirectoryPath, '.' + imageFolderPath);
    }
    else {
        assetDirectoryPath = path.resolve(path.dirname(sourceUri.fsPath), imageFolderPath);
    }
    const destPath = path.resolve(assetDirectoryPath, path.basename(imageFilePath));
    vscode.window.visibleTextEditors
        .filter(editor => markdown_preview_enhanced_view_1.isMarkdownFile(editor.document) && editor.document.uri.fsPath === sourceUri.fsPath)
        .forEach(editor => {
        fs.mkdir(assetDirectoryPath, (error) => {
            fs.stat(destPath, (err, stat) => {
                if (err == null) {
                    const lastDotOffset = imageFileName.lastIndexOf('.');
                    const uid = '_' + Math.random().toString(36).substr(2, 9);
                    if (lastDotOffset > 0) {
                        description = imageFileName.slice(0, lastDotOffset);
                        imageFileName = imageFileName.slice(0, lastDotOffset) + uid + imageFileName.slice(lastDotOffset, imageFileName.length);
                    }
                    else {
                        description = imageFileName;
                        imageFileName = imageFileName + uid;
                    }
                    fs.createReadStream(imageFilePath).pipe(fs.createWriteStream(path.resolve(assetDirectoryPath, imageFileName)));
                }
                else if (err.code === 'ENOENT') {
                    fs.createReadStream(imageFilePath).pipe(fs.createWriteStream(destPath));
                    if (imageFileName.lastIndexOf('.'))
                        description = imageFileName.slice(0, imageFileName.lastIndexOf('.'));
                    else
                        description = imageFileName;
                }
                else {
                    return vscode.window.showErrorMessage(err.toString());
                }
                vscode.window.showInformationMessage(`Image ${imageFileName} has been copied to folder ${assetDirectoryPath}`);
                let url = `${imageFolderPath}/${imageFileName}`;
                if (url.indexOf(' ') >= 0)
                    url = `<${url}>`;
                editor.edit((textEditorEdit) => {
                    textEditorEdit.insert(editor.selection.active, `![${description}](${url})`);
                });
            });
        });
    });
}
exports.pasteImageFile = pasteImageFile;
function addImageURLToHistory(markdownImage) {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: save to history
        const imageHistoryPath = path.resolve(utility.extensionConfigDirectoryPath, './image_history.md');
        let data;
        try {
            data = yield utility.readFile(imageHistoryPath, { encoding: 'utf-8' });
        }
        catch (e) {
            data = '';
        }
        data = `
${markdownImage}

\`${markdownImage}\`

${(new Date()).toString()}

---

` + data;
        utility.writeFile(imageHistoryPath, data, { encoding: 'utf-8' });
    });
}
function replaceHint(editor, line, hint, withStr) {
    let textLine = editor.document.lineAt(line);
    if (textLine.text.indexOf(hint) >= 0) {
        editor.edit((textEdit) => {
            textEdit.replace(new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, textLine.text.length)), textLine.text.replace(hint, withStr));
        });
        return true;
    }
    return false;
}
function setUploadedImageURL(imageFileName, url, editor, hint, curPos) {
    let description;
    if (imageFileName.lastIndexOf('.'))
        description = imageFileName.slice(0, imageFileName.lastIndexOf('.'));
    else
        description = imageFileName;
    const withStr = `![${description}](${url})`;
    if (!replaceHint(editor, curPos.line, hint, withStr)) {
        let i = curPos.line - 20;
        while (i <= curPos.line + 20) {
            if (replaceHint(editor, i, hint, withStr))
                break;
            i++;
        }
    }
    addImageURLToHistory(withStr);
}
/**
 * Upload image at imageFilePath to config.imageUploader.
 * Then insert markdown image url to markdown file.
 * @param uri
 * @param imageFilePath
 */
function uploadImageFile(sourceUri, imageFilePath, imageUploader) {
    // console.log('uploadImageFile', sourceUri, imageFilePath, imageUploader)
    if (typeof (sourceUri) === 'string') {
        sourceUri = vscode.Uri.parse(sourceUri);
    }
    const imageFileName = path.basename(imageFilePath);
    vscode.window.visibleTextEditors
        .filter(editor => markdown_preview_enhanced_view_1.isMarkdownFile(editor.document) && editor.document.uri.fsPath === sourceUri.fsPath)
        .forEach(editor => {
        const uid = Math.random().toString(36).substr(2, 9);
        const hint = `![Uploading ${imageFileName}… (${uid})]()`;
        const curPos = editor.selection.active;
        editor.edit((textEditorEdit) => {
            textEditorEdit.insert(curPos, hint);
        });
        if (imageUploader === 'imgur') {
            // A single image
            imgurAPI.uploadFile(imageFilePath)
                .then((url) => {
                setUploadedImageURL(imageFileName, url, editor, hint, curPos);
            })
                .catch((err) => {
                vscode.window.showErrorMessage(err);
            });
        }
        else {
            smAPI.uploadFile(imageFilePath)
                .then((url) => {
                setUploadedImageURL(imageFileName, url, editor, hint, curPos);
            })
                .catch((err) => {
                vscode.window.showErrorMessage(err);
            });
        }
    });
}
exports.uploadImageFile = uploadImageFile;
