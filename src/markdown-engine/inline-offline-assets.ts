import * as fs from 'fs';
import * as path from 'path';

const ABSOLUTE_URL = /^(data:|https?:|file:|\/\/)/i;
const CSS_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)(\s*format\([^)]+\))?/gi;
const FALLBACK_FONT_EXTS = new Set(['.woff', '.ttf', '.eot', '.otf']);

const MIME_BY_EXT: Record<string, string> = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

/**
 * Read a JS file and wrap it as an inline `<script>` tag for a
 * self-contained HTML export. A literal `</script>` in the source is
 * escaped so it cannot close the wrapping tag.
 */
export async function readOfflineJs(absPath: string): Promise<string> {
  const js = await fs.promises.readFile(absPath, 'utf8');
  const escaped = js.replace(/<\/script/gi, '<\\/script');
  return `<script type="text/javascript">\n${escaped}\n</script>`;
}

/**
 * Read a CSS file, rewrite relative `url(...)` references to data URIs,
 * and wrap the result as an inline `<style>` tag.
 *
 * Absolute `data:` / `http(s):` / `file:` URLs are left as-is. Missing
 * files are dropped rather than left as broken relative paths. When a
 * `@font-face` lists woff2 + woff/ttf fallbacks, only the woff2 file is
 * embedded.
 */
export async function readOfflineCss(absPath: string): Promise<string> {
  const css = await fs.promises.readFile(absPath, 'utf8');
  const rewritten = rewriteCssUrls(css, path.dirname(absPath));
  return `<style>\n${rewritten}\n</style>`;
}

function rewriteCssUrls(css: string, cssDir: string): string {
  const rewritten = css.replace(
    CSS_URL,
    (whole, _quote: string, rawUrl: string, formatPart = '') => {
      const url = rawUrl.trim();
      if (ABSOLUTE_URL.test(url)) {
        return whole;
      }

      const resolved = path.resolve(cssDir, url);
      const ext = path.extname(resolved).toLowerCase();

      if (FALLBACK_FONT_EXTS.has(ext)) {
        const woff2 = resolved.slice(0, -ext.length) + '.woff2';
        if (fs.existsSync(woff2)) {
          return '';
        }
      }

      if (!fs.existsSync(resolved)) {
        return '';
      }

      const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream';
      const b64 = fs.readFileSync(resolved).toString('base64');
      return `url("data:${mime};base64,${b64}")${formatPart}`;
    },
  );

  return rewritten
    .replace(/,\s*,+/g, ',')
    .replace(/:\s*,/g, ':')
    .replace(/,\s*(?=[;}])/g, '');
}
