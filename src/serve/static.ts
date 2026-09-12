import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { encodePathSegments, isPathWithinRoot } from './markdown-files';

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
  '.gz': 'application/gzip',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

/**
 * Serve a file from `rootDirectory` that was requested under `urlPrefix`
 * (e.g. `/assets/...` from the crossnote build dir, `/files/...` from the
 * served workspace). Path traversal is rejected.
 */
export function serveFileFromRoot(
  response: http.ServerResponse,
  rootDirectory: string,
  urlPrefix: string,
  urlPath: string,
  cacheControl: string = 'no-cache',
): void {
  const relativePath = decodeURIComponent(urlPath.slice(urlPrefix.length));
  const filePath = path.resolve(
    rootDirectory,
    `.${path.sep}${relativePath.replace(/\//g, path.sep)}`,
  );
  if (!isPathWithinRoot(path.resolve(rootDirectory), filePath)) {
    response.writeHead(403, { 'content-type': 'text/plain' });
    response.end('forbidden');
    return;
  }
  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('not found');
      return;
    }
    const contentType: string =
      CONTENT_TYPES[path.extname(filePath).toLowerCase()] ??
      'application/octet-stream';
    // Let the browser revalidate on every use so edited files (images,
    // scripts) show fresh content without hard refreshes.
    response.writeHead(200, {
      'content-type': contentType,
      'content-length': stat.size,
      'cache-control': cacheControl,
    });
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      response.destroy();
    });
    stream.pipe(response);
  });
}

/** Map an absolute path to a servable URL, or `null` when out of bounds. */
export function filePathToUrl(
  rootDirectory: string,
  urlPrefix: string,
  absolutePath: string,
): string | null {
  const root = path.resolve(rootDirectory);
  if (!isPathWithinRoot(root, absolutePath)) {
    return null;
  }
  const relativePath = path
    .relative(root, absolutePath)
    .split(path.sep)
    .join('/');
  return `${urlPrefix}/${encodePathSegments(relativePath)}`;
}
