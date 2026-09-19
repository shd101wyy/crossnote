import { WikiData, WikiFileMeta, WikiThemesPayload, dirname } from './api';

/**
 * Assemble the srcdoc of one embedded wiki note at open time.
 *
 * The build step (`crossnote build-wiki`) generates every note as a regular
 * preview page and references shared assets (preview.js, mermaid, workspace
 * js/css, …) as `crossnote-wiki-asset:<id>` tokens so each asset is stored
 * once in the file. Here the tokens are resolved against the embedded asset
 * map:
 *
 * - `<script src=TOKEN>` → `<script>…inlined…</script>`
 * - `<link href=TOKEN>`  → `<style>…inlined…</style>`
 * - every other token (e.g. `<img src=TOKEN>`) → a `data:` URI
 *
 * The three theme slots use stable `crossnote-wiki-theme:<slot>` tokens
 * instead: every available stylesheet ships in the payload, and the one
 * being inlined follows the stored theme selection (the wiki's
 * context-menu theme picker persists to localStorage).
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

/** The wiki's current theme selection (theme *file names*, like the menus). */
export interface WikiThemeSelection {
  preview: string;
  codeBlock: string;
  reveal: string;
}

export function assembleWikiDocument(
  data: WikiData,
  file: WikiFileMeta,
  themes?: WikiThemeSelection,
): string {
  const styles = resolveWikiThemeStyles(data, themes);
  // Quote styles differ across the templates the engine emits (`src="…"` and
  // reveal.js's `src='…'`), so both are handled.
  return file.html
    .replace(
      /<link\b[^>]*\shref=(['"])crossnote-wiki-theme:(preview|codeBlock|reveal)\1[^>]*>/g,
      (_match, _quote: string, slot: 'preview' | 'codeBlock' | 'reveal') =>
        `<style data-crossnote-theme="${slot}">${inlineStyle(
          styles[slot],
        )}</style>`,
    )
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
    )
    .replace(
      // Reflect the selection in the config meta so the reopened page's
      // context menu marks the active theme. The meta attribute is
      // HTML-escaped JSON; theme names are plain `[a-z0-9-]+\.css`.
      /(&quot;previewTheme&quot;:&quot;)[^&]+(&quot;)/g,
      `$1${styles.selection.preview}$2`,
    )
    .replace(
      /(&quot;codeBlockTheme&quot;:&quot;)[^&]+(&quot;)/g,
      `$1${styles.selection.codeBlock}$2`,
    )
    .replace(
      /(&quot;revealjsTheme&quot;:&quot;)[^&]+(&quot;)/g,
      `$1${styles.selection.reveal}$2`,
    );
}

function asset(data: WikiData, id: string): string {
  // An unknown token (asset failed to read at build time) is left as-is:
  // the reference just breaks, exactly like a dead file:// URL would.
  return data.assets[id] ?? `${TOKEN_PREFIX}${id}`;
}

/** The final stylesheet text for each theme slot, plus the raw selection. */
function resolveWikiThemeStyles(
  data: WikiData,
  themes: WikiThemeSelection | undefined,
): {
  selection: WikiThemeSelection;
  preview: string;
  codeBlock: string;
  reveal: string;
} {
  const payload: WikiThemesPayload = data.themes ?? {
    preview: {},
    codeBlock: {},
    reveal: {},
    codeBlockAuto: {},
    build: { preview: '', codeBlock: '', reveal: '' },
  };
  const pick = (
    map: Record<string, string>,
    requested: string | undefined,
    fallback: string,
  ): string => {
    if (requested && requested in map) {
      return map[requested];
    }
    return map[fallback] ?? Object.values(map)[0] ?? '';
  };
  const selection: WikiThemeSelection = {
    preview: themes?.preview ?? payload.build.preview,
    codeBlock: themes?.codeBlock ?? payload.build.codeBlock,
    reveal: themes?.reveal ?? payload.build.reveal,
  };
  const previewCss = pick(
    payload.preview,
    selection.preview,
    payload.build.preview,
  );
  // `codeBlock: 'auto.css'` follows the (possibly just changed) preview
  // theme, mirroring the engine's build-time resolution.
  const codeBlockFile =
    selection.codeBlock === 'auto.css'
      ? (payload.codeBlockAuto[selection.preview] ?? 'default.css')
      : selection.codeBlock;
  return {
    selection,
    preview: previewCss,
    codeBlock: pick(
      payload.codeBlock,
      codeBlockFile,
      payload.build.codeBlock === 'auto.css'
        ? 'default.css'
        : payload.build.codeBlock,
    ),
    reveal: pick(payload.reveal, selection.reveal, payload.build.reveal),
  };
}

/**
 * Read the persisted theme selection for this wiki from localStorage.
 * Names the payload no longer knows (a wiki built by an older crossnote,
 * or a selection stored by a different file sharing the origin) fall back
 * to the build-time themes.
 */
export function readWikiThemeSelection(
  data: WikiData,
  storage: Pick<Storage, 'getItem'>,
): WikiThemeSelection | null {
  let raw: string | null;
  try {
    raw = storage.getItem(wikiThemesStorageKey(data));
  } catch {
    return null;
  }
  if (!raw) {
    return null;
  }
  let parsed: Partial<WikiThemeSelection>;
  try {
    parsed = JSON.parse(raw) as Partial<WikiThemeSelection>;
  } catch {
    return null;
  }
  const themes = data.themes;
  if (!themes) {
    return null;
  }
  const valid = (name: unknown, map: Record<string, string>): boolean =>
    typeof name === 'string' && (name === 'auto.css' || name in map);
  const selection: WikiThemeSelection = {
    preview: valid(parsed.preview, themes.preview)
      ? (parsed.preview as string)
      : themes.build.preview,
    codeBlock: valid(parsed.codeBlock, themes.codeBlock)
      ? (parsed.codeBlock as string)
      : themes.build.codeBlock,
    reveal: valid(parsed.reveal, themes.reveal)
      ? (parsed.reveal as string)
      : themes.build.reveal,
  };
  if (
    selection.preview === themes.build.preview &&
    selection.codeBlock === themes.build.codeBlock &&
    selection.reveal === themes.build.reveal
  ) {
    return null; // nothing to override
  }
  return selection;
}

export function writeWikiThemeSelection(
  data: WikiData,
  storage: Pick<Storage, 'setItem'>,
  selection: WikiThemeSelection,
): void {
  try {
    storage.setItem(wikiThemesStorageKey(data), JSON.stringify(selection));
  } catch {
    // Storage unavailable (sandboxed/opaque origin) — best effort only.
  }
}

function wikiThemesStorageKey(data: WikiData): string {
  return `crossnote:wiki:themes:${data.rootDirectories.join('|')}`;
}

/** Posix-normalized identity of a note path (the wiki's lookup key). */
export function wikiKeyOf(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export function createWikiIndex(data: WikiData): Map<string, WikiFileMeta> {
  return new Map(data.files.map((file) => [wikiKeyOf(file.path), file]));
}

/**
 * Resolve a clicked href inside the wiki to a note key. Wiki note paths are
 * root-relative (single root) or `<root name>/<relative>` (multi-root), and
 * hrefs are either root-relative (`/notes/x.md`) or relative to the source
 * note's directory — no absolute paths exist in a wiki file.
 */
export function resolveWikiHref(
  data: WikiData,
  sourceKey: string,
  href: string,
): string {
  const cleanHref = href.split('#')[0].split('?')[0];
  if (!cleanHref) {
    return '';
  }
  const multiRoot = data.rootDirectories.length > 1;
  const anchor = (relative: string): string => {
    const normalized = normalizePosixPath(relative);
    if (!multiRoot) {
      return normalized;
    }
    // Multi-root keys are `<root name>/<relative>` by construction, so the
    // source's root is the key's first segment.
    const rootName = sourceKey.split('/')[0] ?? '';
    return rootName ? `${rootName}/${normalized}` : normalized;
  };
  if (cleanHref.startsWith('/')) {
    return anchor(cleanHref.replace(/^\/+/, ''));
  }
  return anchor(`${dirname(sourceKey)}/${cleanHref}`);
}

/** Collapse `.`/`..`/empty segments of a posix-ish path. */
function normalizePosixPath(input: string): string {
  const stack: string[] = [];
  for (const part of input.split('/')) {
    if (part === '' || part === '.') {
      continue;
    }
    if (part === '..') {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return stack.join('/');
}

/** File-list entries for the quick-open picker, from the embedded payload. */
export function wikiFileList(data: WikiData): Array<{
  absolutePath: string;
  relativePath: string;
  mtimeMs: number;
  rootPath: string;
}> {
  const multiRoot = data.rootDirectories.length > 1;
  return data.files.map((file) => ({
    absolutePath: file.path,
    // Multi-root keys carry their root-name prefix; the picker re-adds it
    // from `rootPath`, so hand it the bare relative path.
    relativePath:
      multiRoot && file.root && file.path.startsWith(`${file.root}/`)
        ? file.path.slice(file.root.length + 1)
        : file.path,
    mtimeMs: file.mtimeMs,
    rootPath: file.root,
  }));
}
