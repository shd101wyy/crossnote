import * as path from 'path';

/**
 * A `url()` value that already names its own protocol (or is
 * protocol-relative) and must never be resolved against a directory.
 */
export const ABSOLUTE_URL = /^(data:|https?:|file:|\/\/)/i;

/**
 * `url(...)`, with an optional trailing `format(...)` so `@font-face` `src`
 * lists can be rewritten as a unit.
 */
export const CSS_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)(\s*format\([^)]+\))?/gi;

/**
 * An absolute filesystem path: posix (`/x`) or Windows (`C:\x`, `C:/x`).
 *
 * Used to recognize the values `resolveRelativeCssUrls` produced, so they can
 * be turned into the URL form the current render target needs.
 */
const ABSOLUTE_FS_PATH = /^(\/|[A-Za-z]:[\\/])/;

/**
 * Rewrite every relative `url(...)` in `css` to the absolute filesystem path
 * it points at, so the stylesheet survives being inlined into a document that
 * lives somewhere else.
 *
 * This is the load-time half of the fix for user stylesheets: CSS `url()` is
 * resolved against the *stylesheet's* URL, but `.crossnote/style.less` is
 * compiled and inlined into a `<style>` tag, so its relative references end up
 * resolved against the preview document instead — in a VS Code webview that is
 * `vscode-webview://<uuid>/`, where nothing exists. Doing this at load time is
 * what makes it correct: a host may concatenate the global and the workspace
 * `style.less` into one `globalCss` string (the VS Code extension does), after
 * which neither half's base directory is recoverable.
 *
 * Only references that resolve to a file inside `baseDir` are rewritten.
 * Absolute URLs, fragment-only references (`url(#gradient)`), root-relative
 * references (`url(/x.png)` — ambiguous, and no more broken than before), and
 * paths that do not exist are left exactly as they were.
 */
export async function resolveRelativeCssUrls(
  css: string,
  baseDir: string,
  exists: (filePath: string) => Promise<boolean>,
): Promise<string> {
  // Normalize the boundary the same way `path.resolve` normalizes the
  // candidates, or the containment check below misfires whenever `baseDir`
  // is drive-relative (`\Users\…`) or mixes separators (`C:/x/y`). Windows
  // hosts produce both: `Notebook.init` round-trips plain `C:\…` paths
  // through `URI.parse`, which drops the drive letter, so `crossnote serve`
  // and `build-wiki` hand config code exactly such a base directory.
  const root = path.resolve(baseDir);
  // String.replace cannot await, so resolve every candidate first and then
  // substitute from the resulting queue, in match order.
  const candidates: string[] = [];
  css.replace(CSS_URL, (_whole, _quote: string, rawUrl: string) => {
    candidates.push(rawUrl.trim());
    return '';
  });

  const resolutions = await Promise.all(
    candidates.map(async (url) => {
      if (!url || url.startsWith('#') || ABSOLUTE_URL.test(url)) {
        return null;
      }
      if (ABSOLUTE_FS_PATH.test(url)) {
        return null;
      }
      // Resolve against the path only: a `?query`/`#fragment` suffix is not
      // part of the filename, but must be carried over to the rewritten value.
      const [, filePart, suffix = ''] = url.match(/^([^?#]*)([?#].*)?$/) ?? [];
      if (!filePart) {
        return null;
      }
      const resolved = path.resolve(baseDir, filePart);
      // Keep the stylesheet's own directory as the boundary, like
      // `readOfflineCss` does — `url(../../etc/passwd)` is not rewritten.
      if (resolved !== root && !resolved.startsWith(root + path.sep)) {
        return null;
      }
      if (!(await exists(resolved))) {
        return null;
      }
      return resolved + suffix;
    }),
  );

  let i = 0;
  return css.replace(
    CSS_URL,
    (whole, _quote: string, _rawUrl: string, formatPart = '') => {
      const resolved = resolutions[i++];
      if (resolved === null) {
        return whole;
      }
      return `url("${escapeCssUrl(resolved)}")${formatPart}`;
    },
  );
}

/**
 * Map every absolute-filesystem-path `url(...)` in `css` through `toUrl`.
 *
 * This is the render-time half: `resolveRelativeCssUrls` leaves filesystem
 * paths behind, which the preview and each export path then turn into the URL
 * form they can actually load (`vscode-webview://…` inside a VS Code webview,
 * `file://…` everywhere else). The CSS string escapes `escapeCssUrl` added at
 * load time are undone first, so `toUrl` receives a real filesystem path —
 * `Uri.file`/`pathToFileURL` would otherwise see doubled separators.
 *
 * A leading `/` counts as an absolute path here (on POSIX it is textually
 * identical to a resolved path), so root-relative references such as
 * `url(/files/x.woff2)` are mapped too — in `crossnote serve` they resolve
 * against the served root only if they point at a file inside it, and
 * otherwise follow the host's `file://` fallback.
 */
export function mapAbsoluteCssUrls(
  css: string,
  toUrl: (filePath: string) => string,
): string {
  return css.replace(
    CSS_URL,
    (whole, _quote: string, rawUrl: string, formatPart = '') => {
      const url = rawUrl.trim();
      if (ABSOLUTE_URL.test(url) || !ABSOLUTE_FS_PATH.test(url)) {
        return whole;
      }
      const [, filePart, suffix = ''] = url.match(/^([^?#]*)([?#].*)?$/) ?? [];
      if (!filePart) {
        return whole;
      }
      return `url("${escapeCssUrl(toUrl(unescapeCssUrl(filePart)) + suffix)}")${formatPart}`;
    },
  );
}

/**
 * Escape what would otherwise terminate the quoted `url("…")` we emit. Paths
 * may legitimately contain quotes, backslashes (every Windows path) and — in
 * the rewritten webview form — none of the above, so this is cheap insurance
 * rather than a sanitizer.
 */
function escapeCssUrl(value: string): string {
  return value.replace(/(["\\])/g, '\\$1').replace(/\n/g, '');
}

/**
 * The exact inverse of `escapeCssUrl` — undo `\\` and `\"` and nothing else,
 * so a user-authored path that already contains single backslashes is not
 * mangled (only the escapes we emitted ourselves are folded back).
 */
function unescapeCssUrl(value: string): string {
  return value.replace(/\\(["\\])/g, '$1');
}
