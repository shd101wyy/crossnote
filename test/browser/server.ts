import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';

const MATHJAX_DIR = path.resolve(__dirname, '../../node_modules/mathjax');
const WAVEDROM_DIR = path.resolve(__dirname, '../../dependencies/wavedrom');

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.html': 'text/html; charset=utf-8',
};

const PAGE = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"></head>
  <body><div id="hidden" class="hidden-preview"></div></body>
</html>`;

export interface TestServer {
  url: string;
  close(): Promise<void>;
}

/**
 * Serve a blank preview page at `/` and the locally installed MathJax 4
 * package under `/mathjax/...` over real HTTP (so the speech-rule-engine's
 * web worker, which won't run from a `file://` origin, works as it does in the
 * actual webview).
 */
// URL prefix → on-disk root. Static assets are served from these so MathJax's
// component loader and WaveDrom's skins resolve their siblings over real HTTP.
const STATIC_MOUNTS: { prefix: string; root: string }[] = [
  { prefix: '/mathjax/', root: MATHJAX_DIR },
  { prefix: '/wavedrom/', root: WAVEDROM_DIR },
];

export async function startServer(): Promise<TestServer> {
  const server = http.createServer((req, res) => {
    const url = (req.url || '/').split('?')[0];
    if (url === '/' || url === '/index.html') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(PAGE);
      return;
    }
    const mount = STATIC_MOUNTS.find((m) => url.startsWith(m.prefix));
    if (mount) {
      const rel = decodeURIComponent(url.slice(mount.prefix.length));
      // Resolve within the mount root and refuse path traversal.
      const filePath = path.resolve(mount.root, rel);
      if (!filePath.startsWith(mount.root)) {
        res.writeHead(403);
        res.end('forbidden');
        return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('not found');
          return;
        }
        const type =
          CONTENT_TYPES[path.extname(filePath)] || 'application/octet-stream';
        res.writeHead(200, { 'content-type': type });
        res.end(data);
      });
      return;
    }
    res.writeHead(404);
    res.end('not found');
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('failed to bind test server');
  }
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      ),
  };
}
