import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { isPathWithinRoot } from './markdown-files';

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
 * Resolve a mounted URL path (`urlPrefix/...`) to a real file under one of
 * `mountRoots`. When multiple roots are mounted, the same relative path can
 * exist in several of them — `preferredRootIndex` (from the `?root=` query
 * that the URL mapper appends) disambiguates, and the remaining roots are
 * tried in order as a fallback.
 *
 * Returns the resolved file path or null (traversal / not found).
 */
export function resolveMountedFile(
  mountRoots: string[],
  urlPrefix: string,
  urlPath: string,
  preferredRootIndex: number | null,
): string | null {
  const relativePath = decodeURIComponent(urlPath.slice(urlPrefix.length));
  const candidates: number[] = [];
  if (
    preferredRootIndex !== null &&
    preferredRootIndex >= 0 &&
    preferredRootIndex < mountRoots.length
  ) {
    candidates.push(preferredRootIndex);
  }
  for (let index = 0; index < mountRoots.length; index++) {
    if (!candidates.includes(index)) {
      candidates.push(index);
    }
  }
  for (const index of candidates) {
    const root = path.resolve(mountRoots[index]);
    const filePath = path.resolve(
      root,
      `.${path.sep}${relativePath.replace(/\//g, path.sep)}`,
    );
    if (!isPathWithinRoot(root, filePath)) {
      continue;
    }
    try {
      if (fs.statSync(filePath).isFile()) {
        return filePath;
      }
    } catch {
      // Try the next root.
    }
  }
  return null;
}

/** Stream `filePath` to the response with the right content type. */
export function serveFileFromPath(
  response: http.ServerResponse,
  filePath: string,
  cacheControl: string = 'no-cache',
): void {
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
