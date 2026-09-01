// sm.ms api
import * as fs from 'fs';
import * as path from 'path';

// imgur api
// referred from node-imgur:
// https://github.com/kaimallea/node-imgur/blob/master/lib/imgur.js
// The following client ID is tied to the
// registered 'node-imgur' app and is available
// here for public, anonymous usage via this node
// module only.
const IMGUR_API_URL = 'https://api.imgur.com/3/';
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || 'f0ea04148a54268';

// IPv4 ranges that never name a public host: this-network, loopback,
// CGNAT, private, link-local, reserved/benchmark/documentation, and
// multicast/broadcast space. [start, end] as 32-bit integers.
const RESERVED_IPV4_RANGES: Array<[number, number]> = [
  [0x00000000, 0x00ffffff], // 0.0.0.0/8 "this network"
  [0x0a000000, 0x0affffff], // 10.0.0.0/8 private
  [0x64400000, 0x657fffff], // 100.64.0.0/10 CGNAT
  [0x7f000000, 0x7fffffff], // 127.0.0.0/8 loopback
  [0xa9fe0000, 0xa9feffff], // 169.254.0.0/16 link-local
  [0xac100000, 0xac1fffff], // 172.16.0.0/12 private
  [0xc0000000, 0xc00000ff], // 192.0.0.0/24 IETF protocol assignments
  [0xc0000200, 0xc00003ff], // 192.0.2.0/24 documentation
  [0xc0a80000, 0xc0a8ffff], // 192.168.0.0/16 private
  [0xc6120000, 0xc613ffff], // 198.18.0.0/15 benchmarking
  [0xc6336400, 0xc63364ff], // 198.51.100.0/24 documentation
  [0xcb007100, 0xcb0071ff], // 203.0.113.0/24 documentation
  [0xe0000000, 0xffffffff], // 224.0.0.0/3 multicast + reserved
];

function ipv4ToNumber(host: string): number | null {
  const parts = host.split('.');
  if (parts.length !== 4) {
    return null;
  }
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }
    const octet = Number(part);
    if (octet > 255) {
      return null;
    }
    value = value * 256 + octet;
  }
  return value;
}

const RESERVED_HOSTNAMES =
  /^(localhost|.*\.localhost|.*\.local|.*\.internal|.*\.home\.arpa)$/i;

function isReservedHost(hostname: string): boolean {
  // URL#hostname strips the brackets of `[::1]`-style IPv6 literals.
  const host = hostname.toLowerCase();
  if (RESERVED_HOSTNAMES.test(host)) {
    return true;
  }
  const ipv4 = ipv4ToNumber(host);
  if (ipv4 !== null) {
    return RESERVED_IPV4_RANGES.some(
      ([start, end]) => ipv4 >= start && ipv4 <= end,
    );
  }
  if (host.includes(':')) {
    // IPv6 literal — URL#hostname keeps the surrounding brackets.
    const bare = host.replace(/^\[|\]$/g, '');
    // IPv4-mapped (::ffff:0:0/96): WHATWG URLs serialize the IPv4 tail as
    // two hex groups (`::ffff:a00:1`) or a dotted quad (`::ffff:10.0.0.1`).
    const v4Mapped = bare.match(/^::ffff:(.+)$/i);
    if (v4Mapped) {
      const tail = v4Mapped[1];
      if (tail.includes('.')) {
        return isReservedHost(tail);
      }
      const groups = tail.split(':');
      if (
        groups.length === 2 &&
        groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))
      ) {
        const high = parseInt(groups[0], 16);
        const low = parseInt(groups[1], 16);
        return isReservedHost(
          `${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`,
        );
      }
    }
    // Otherwise: loopback, unspecified, unique-local (fc00::/7),
    // link-local (fe80::/10), multicast (ff00::/8).
    return (
      bare === '::1' ||
      bare === '::' ||
      /^f[cd]/.test(bare) ||
      /^fe[89ab]/.test(bare) ||
      /^ff/.test(bare)
    );
  }
  return false;
}

/**
 * Resolve the imgur API base URL. The `IMGUR_API_URL` override exists for
 * self-hosted proxies; it must be http(s) and must not point at localhost,
 * loopback, private, or reserved addresses — otherwise the uploader could
 * be repurposed to send upload payloads (and the client id) at hosts
 * inside the local network.
 *
 * @throws Error when the override is not a valid public http(s) URL.
 */
export function resolveImgurApiUrl(): string {
  const override = process.env.IMGUR_API_URL;
  if (!override) {
    return IMGUR_API_URL;
  }
  let url: URL;
  try {
    url = new URL(override);
  } catch {
    throw new Error(`IMGUR_API_URL is not a valid URL: ${override}`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('IMGUR_API_URL must use http:// or https://');
  }
  if (!url.hostname || isReservedHost(url.hostname)) {
    throw new Error(
      'IMGUR_API_URL must not point at a localhost, private, or reserved address',
    );
  }
  return url.toString();
}

/**
 *
 * @param imageFilePath local image file path
 * @param imageUrl http://... image url
 */
async function addImageURLToHistory(
  imageFilePath: string,
  imageUrl: string,
  imageHistoryPath?: string,
) {
  let description;
  if (imageFilePath.lastIndexOf('.')) {
    description = imageFilePath.slice(0, imageFilePath.lastIndexOf('.'));
  } else {
    description = imageFilePath;
  }

  const markdownImage = `![${description}](${imageUrl})`;

  // TODO: save to history
  /*
  const imageHistoryPath = path.resolve(
    getExtensionConfigPath(),
    './image_history.md',
  );
  */
  if (!imageHistoryPath) {
    return;
  }
  let data: string;
  try {
    data = fs.readFileSync(imageHistoryPath, { encoding: 'utf-8' });
  } catch {
    data = '';
  }
  data =
    `
${markdownImage}

\`${markdownImage}\`

${new Date().toString()}

---

` + data;
  fs.writeFileSync(imageHistoryPath, data, { encoding: 'utf-8' });
}

/**
 * Upload image to imgur
 * @param filePath
 */
async function imgurUploadImage(filePath: string): Promise<string> {
  const fileContent = fs.readFileSync(filePath);
  const formData = new FormData();
  formData.append('image', new Blob([fileContent]), path.basename(filePath));

  const response = await fetch(`${resolveImgurApiUrl()}image`, {
    method: 'POST',
    headers: { Authorization: `Client-ID ${IMGUR_CLIENT_ID}` },
    body: formData,
  });
  const body = (await response.json()) as {
    success: boolean;
    data: { link?: string; error?: { message: string } };
  };

  if (body.success && body.data.link) {
    await addImageURLToHistory(filePath, body.data.link);
    return body.data.link;
  }
  return body.data.error?.message ?? 'Unknown imgur error';
}

/**
 * Upload image to sm.ms
 * @param filePath
 */
async function smmsUploadImage(filePath: string): Promise<string> {
  const fileContent = fs.readFileSync(filePath);
  const formData = new FormData();
  formData.append('smfile', new Blob([fileContent]), path.basename(filePath));

  try {
    const response = await fetch('https://sm.ms/api/v2/upload', {
      method: 'POST',
      headers: { 'authority': 'sm.ms', 'user-agent': 'crossnote' },
      body: formData,
    });
    const body = (await response.json()) as {
      code: string;
      msg?: string;
      data?: { url: string };
    };

    if (body.code === 'error') {
      throw new Error(body.msg ?? 'Upload failed');
    }
    const url = body.data!.url;
    await addImageURLToHistory(filePath, url);
    return url;
  } catch {
    throw new Error('Failed to connect to sm.ms host');
  }
}

/**
 * Upload image to qiniu
 * @param filePath
 * @param AccessKey
 * @param SecretKey
 * @param Bucket
 * @param Domain
 */
function qiniuUploadImage(
  filePath: string,
  AccessKey: string,
  SecretKey: string,
  Bucket: string,
  Domain: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!AccessKey) {
      return reject('Error: Qiniu AccessKey is missing');
    }
    if (!SecretKey) {
      return reject('Error: Qiniu SecretKey is missing');
    }
    if (!Bucket) {
      return reject('Error: Qiniu Bucket is missing');
    }
    if (!Domain) {
      return reject('Error: Qiniu Domain is missing');
    }

    import('qiniu')
      .then((qiniu) => {
        const mac = new qiniu.auth.digest.Mac(AccessKey, SecretKey);
        const putPolicy = new qiniu.rs.PutPolicy({ scope: Bucket });
        const uploadToken = putPolicy.uploadToken(mac);
        const config = new qiniu.conf.Config();
        const key = path.basename(filePath);
        const formUploader = new qiniu.form_up.FormUploader(config);
        const putExtra = new qiniu.form_up.PutExtra();

        return formUploader.putFile(
          uploadToken,
          key,
          filePath,
          putExtra,
          (respErr, respBody, respInfo) => {
            if (respErr) {
              // console.log(respErr);
              return reject(respErr.message);
            }

            if (respInfo.statusCode === 200) {
              const bucketManager = new qiniu.rs.BucketManager(mac, config);
              const url = bucketManager.publicDownloadUrl(Domain, key);
              return resolve(url);
            } else {
              // console.log(respInfo);
              return reject(respInfo.error);
            }
          },
        );
      })
      .catch((error) => reject(error));
  });
}

/**
 * Upload image
 * @param imageFilePath
 * @param method 'imgur' or 'sm.ms'
 * @param qiniu {AccessKey, SecretKey, Bucket, Domain}
 */
export function uploadImage(
  imageFilePath: string,
  {
    method = 'imgur',
    qiniu = { AccessKey: '', SecretKey: '', Bucket: '', Domain: '' },
  }: {
    method?: string;
    qiniu?: {
      AccessKey: string;
      SecretKey: string;
      Bucket: string;
      Domain: string;
    };
  } = {},
): Promise<string> {
  if (method === 'imgur') {
    return imgurUploadImage(imageFilePath);
  } else if (method === 'qiniu') {
    return qiniuUploadImage(
      imageFilePath,
      qiniu.AccessKey,
      qiniu.SecretKey,
      qiniu.Bucket,
      qiniu.Domain,
    );
  } else {
    // sm.ms
    return smmsUploadImage(imageFilePath);
  }
}
