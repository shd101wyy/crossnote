import { WikiData, WikiFileMeta } from './api';

/**
 * Assemble the srcdoc of one embedded wiki note at open time.
 *
 * The build step (`crossnote build-wiki`) generates every note as a regular
 * preview page and references shared assets (preview.js, mermaid, themes,
 * workspace js/css, …) as `crossnote-wiki-asset:<id>` tokens so each asset
 * is stored once in the file. Here the tokens are resolved against the
 * embedded asset map:
 *
 * - `<script src=TOKEN>` → `<script>…inlined…</script>`
 * - `<link href=TOKEN>`  → `<style>…inlined…</style>`
 * - every other token (e.g. `<img src=TOKEN>`) → a `data:` URI
 *
 * Assembled documents are cached per note: switching tabs re-sets the same
 * srcdoc, and only ever one copy of each asset string exists in memory.
 */

const TOKEN_PREFIX = 'crossnote-wiki-asset:';

/** `</script` inside an inline script would close the element early. */
function inlineScript(source: string): string {
  return source.replace(/<\/script/gi, '<\\/script');
}

function inlineStyle(source: string): string {
  return source.replace(/<\/style/gi, '<\\/style');
}

export function assembleWikiDocument(
  data: WikiData,
  file: WikiFileMeta,
): string {
  // Quote styles differ across the templates the engine emits (`src="…"` and
  // reveal.js's `src='…'`), so both are handled.
  return file.html
    .replace(
      /<script\b[^>]*\ssrc=(['"])crossnote-wiki-asset:([^'"]+)\1[^>]*>\s*<\/script>/g,
      (_match, _quote: string, id: string) =>
        `<script>${inlineScript(asset(data, id))}</script>`,
    )
    .replace(
      /<link\b[^>]*\shref=(['"])crossnote-wiki-asset:([^'"]+)\1[^>]*>/g,
      (_match, _quote: string, id: string) =>
        `<style>${inlineStyle(asset(data, id))}</style>`,
    )
    .replace(
      /=(['"])crossnote-wiki-asset:([^'"]+)\1/g,
      (_match, quote: string, id: string) =>
        `=${quote}${asset(data, id)}${quote}`,
    );
}

function asset(data: WikiData, id: string): string {
  // An unknown token (asset failed to read at build time) is left as-is:
  // the reference just breaks, exactly like a dead file:// URL would.
  return data.assets[id] ?? `${TOKEN_PREFIX}${id}`;
}

/** Posix-normalized identity of a note path (the wiki's lookup key). */
export function wikiKeyOf(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export function createWikiIndex(data: WikiData): Map<string, WikiFileMeta> {
  return new Map(data.files.map((file) => [wikiKeyOf(file.path), file]));
}

/** File-list entries for the quick-open picker, from the embedded payload. */
export function wikiFileList(data: WikiData): Array<{
  absolutePath: string;
  relativePath: string;
  mtimeMs: number;
  rootPath: string;
}> {
  const multiRoot = data.rootDirectories.length > 1;
  return data.files.map((file) => {
    const key = wikiKeyOf(file.path);
    const rootKey = wikiKeyOf(file.root);
    const relative = key.startsWith(rootKey)
      ? key.slice(rootKey.length).replace(/^\//, '')
      : key;
    return {
      absolutePath: file.path,
      relativePath: multiRoot ? `${rootName(file.root)}/${relative}` : relative,
      mtimeMs: file.mtimeMs,
      rootPath: file.root,
    };
  });
}

function rootName(root: string): string {
  const parts = root.replace(/[\\/]+$/, '').split(/[\\/]/);
  return parts[parts.length - 1] || root;
}
