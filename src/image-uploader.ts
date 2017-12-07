// sm.ms api
import * as request from "request"
import * as fs from "fs"
import * as path from "path"
import * as utility from "./utility"

// imgur api
// referred from node-imgur:
// https://github.com/kaimallea/node-imgur/blob/master/lib/imgur.js
// The following client ID is tied to the
// registered 'node-imgur' app and is available
// here for public, anonymous usage via this node
// module only.
const IMGUR_API_URL = process.env.IMGUR_API_URL || 'https://api.imgur.com/3/';
const IMGUR_CLIENT_ID    = process.env.IMGUR_CLIENT_ID || 'f0ea04148a54268';

/**
 * 
 * @param imageFilePath local image file path
 * @param imageUrl http://... image url
 */
async function addImageURLToHistory(imageFilePath, imageUrl) {
  let description
  if (imageFilePath.lastIndexOf('.'))
    description = imageFilePath.slice(0, imageFilePath.lastIndexOf('.'))
  else
    description = imageFilePath

  const markdownImage = `![${description}](${imageUrl})`

    // TODO: save to history
  const imageHistoryPath = path.resolve(utility.extensionConfigDirectoryPath, './image_history.md')
  let data:string
  try {
    data = await utility.readFile(imageHistoryPath, {encoding: 'utf-8'})
  } catch(e) {
    data = ''
  }
  data = `
${markdownImage}

\`${markdownImage}\`

${(new Date()).toString()}

---

` + data 
  utility.writeFile(imageHistoryPath, data, {encoding: 'utf-8'})
}

/**
 * Upload image to imgur
 * @param filePath 
 */
function imgurUploadImage(filePath:string):Promise<string> {
  return new Promise((resolve, reject)=> {
    const headers = {
      Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
    }

    request.post({
      url: `${IMGUR_API_URL}image`,
      encoding: 'utf8',
      formData: {image: fs.createReadStream(filePath)},
      json: true,
      headers
    },
    (err, httpResponse, body)=> {
      if (err) {
        return reject(err)
      } 
      if (body.success) {
        const url = body.data.link
        addImageURLToHistory(filePath, url)
        return resolve(url)
      } else {
        return resolve(body.data.error.message)
      }
    })
  })
}

/**
 * Upload image to sm.ms
 * @param filePath 
 */
function smmsUploadImage(filePath:string):Promise<string> {
  return new Promise((resolve, reject)=> {
    const headers = {
      authority: 'sm.ms',
      'user-agent': 'mume'

    }
    request.post({
      url:'https://sm.ms/api/upload', 
      formData: {smfile: fs.createReadStream(filePath)}, 
      headers:headers
    }, 
    (err, httpResponse, body)=> {
      try {
        body = JSON.parse(body)
        if (err)
          return reject('Failed to upload image')
        else if (body.code === 'error')
          return reject(body.msg)
        else {
          const url = body.data.url
          addImageURLToHistory(filePath, url)
          return resolve(url)
        }
      } catch (error) {
        return reject('Failed to connect to sm.ms host')
      }
    })
  })
}

/**
 * Upload image to qiniu
 * @param filePath
 * @param AccessKey
 * @param SecretKey
 * @param Bucket
 * @param Domain
 */
function qiniuUploadImage(filePath:string, AccessKey:string, SecretKey:string, Bucket:string, Domain:string):Promise<string> {
  return new Promise((resolve, reject) => {
      const qiniu = require('qiniu');
      var mac = new qiniu.auth.digest.Mac(AccessKey, SecretKey);
      var putPolicy = new qiniu.rs.PutPolicy({scope : Bucket});
      var uploadToken=putPolicy.uploadToken(mac);
      var config = new qiniu.conf.Config();
      var key = path.basename(filePath);
      var formUploader = new qiniu.form_up.FormUploader(config);
      var putExtra = new qiniu.form_up.PutExtra();

      return formUploader.putFile(uploadToken, key, filePath, putExtra, function(respErr,respBody, respInfo) {
          if (respErr) {
              console.log(respErr);
              return reject(respErr.message);
          }

          if (respInfo.statusCode == 200) {
            var bucketManager = new qiniu.rs.BucketManager(mac, config);
            var url = bucketManager.publicDownloadUrl(Domain, key);
            return resolve(url);
        } else {
            console.log(respInfo);
            return reject(respInfo.error);
        }
    });
});
}

/**
 * Upload image
 * @param imageFilePath 
 * @param method 'imgur' or 'sm.ms' 
 */
export function uploadImage(imageFilePath:string, {method="imgur"}):Promise<string> {
  if (method === 'imgur') {
    return imgurUploadImage(imageFilePath)
  }else if (method === 'qiniu'){
    return qiniuUploadImage(imageFilePath, arguments[2], arguments[3], arguments[4], arguments[5]);
  } else { // sm.ms
    return smmsUploadImage(imageFilePath)
  }
}
