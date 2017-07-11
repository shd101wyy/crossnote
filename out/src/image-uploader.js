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
// sm.ms api
const request = require("request");
const fs = require("fs");
const path = require("path");
const utility = require("./utility");
// imgur api
// referred from node-imgur:
// https://github.com/kaimallea/node-imgur/blob/master/lib/imgur.js
// The following client ID is tied to the
// registered 'node-imgur' app and is available
// here for public, anonymous usage via this node
// module only.
const IMGUR_API_URL = process.env.IMGUR_API_URL || 'https://api.imgur.com/3/';
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || 'f0ea04148a54268';
/**
 *
 * @param imageFilePath local image file path
 * @param imageUrl http://... image url
 */
function addImageURLToHistory(imageFilePath, imageUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        let description;
        if (imageFilePath.lastIndexOf('.'))
            description = imageFilePath.slice(0, imageFilePath.lastIndexOf('.'));
        else
            description = imageFilePath;
        const markdownImage = `![${description}](${imageUrl})`;
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
/**
 * Upload image to imgur
 * @param filePath
 */
function imgurUploadImage(filePath) {
    return new Promise((resolve, reject) => {
        const headers = {
            Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
        };
        request.post({
            url: `${IMGUR_API_URL}image`,
            encoding: 'utf8',
            formData: { image: fs.createReadStream(filePath) },
            json: true,
            headers
        }, (err, httpResponse, body) => {
            if (err) {
                return reject(err);
            }
            if (body.success) {
                const url = body.data.link;
                addImageURLToHistory(filePath, url);
                return resolve(url);
            }
            else {
                return resolve(body.data.error.message);
            }
        });
    });
}
/**
 * Upload image to sm.ms
 * @param filePath
 */
function smmsUploadImage(filePath) {
    return new Promise((resolve, reject) => {
        const headers = {
            authority: 'sm.ms',
            'user-agent': 'mume'
        };
        request.post({
            url: 'https://sm.ms/api/upload',
            formData: { smfile: fs.createReadStream(filePath) },
            headers: headers
        }, (err, httpResponse, body) => {
            try {
                body = JSON.parse(body);
                if (err)
                    return reject('Failed to upload image');
                else if (body.code === 'error')
                    return reject(body.msg);
                else {
                    const url = body.data.url;
                    addImageURLToHistory(filePath, url);
                    return resolve(url);
                }
            }
            catch (error) {
                return reject('Failed to connect to sm.ms host');
            }
        });
    });
}
/**
 * Upload image
 * @param imageFilePath
 * @param method 'imgur' or 'sm.ms'
 */
function uploadImage(imageFilePath, { method = "imgur" }) {
    if (method === 'imgur') {
        return imgurUploadImage(imageFilePath);
    }
    else {
        return smmsUploadImage(imageFilePath);
    }
}
exports.uploadImage = uploadImage;
