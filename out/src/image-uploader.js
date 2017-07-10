"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// sm.ms api
const request = require("request");
const fs = require("fs");
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
                return resolve(body.data.link);
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
                else
                    return resolve(body.data.url);
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
