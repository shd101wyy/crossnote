import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import type * as vscode from 'vscode';
import { MarkdownEngine, MarkdownEngineOutput } from '../markdown-engine';
import type { WebviewConfig } from '../notebook';
import { previewHostShimScript } from '../serve/preview-host-shim';
import { constructGraphView } from '../notebook/graph-view';
import { createNotebooksForDirectories } from '../serve/config';
import { isPathWithinRoot, listMarkdownFiles } from '../serve/markdown-files';
import {
  addFileProtocol,
  getCrossnoteBuildDirectory,
  setCrossnoteBuildDirectory,
  useExternalAddFileProtocolFunction,
} from '../utility';

/**
 * Token prefix that stands for a shared asset inside the wiki file (see
 * {@link buildWiki}); resolved to inline `<script>`/`<style>` content by the
 * shell when a note is opened.
 */
const ASSET_TOKEN_PREFIX = 'crossnote-wiki-asset:';

/**
 * Semantic tokens for the three theme slots (`preview`, `codeBlock`,
 * `reveal`) — every theme's stylesheet ships in the payload, and the shell
 * inlines whichever one the stored theme selection asks for.
 */
const THEME_TOKEN_PREFIX = 'crossnote-wiki-theme:';

/**
 * Injected right before preview.js in every embedded note document. Wiki
 * frames run sandboxed (opaque origin), so unlike the serve server's shim
 * every message must be posted with `'*'` as target origin.
 */
const WIKI_PREVIEW_HOST_SHIM = previewHostShimScript("'*'");

const IMAGE_MIME_TYPES: Record<string, string> = {
  avif: 'image/avif',
  bmp: 'image/bmp',
  gif: 'image/gif',
  ico: 'image/x-icon',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

const SCRIPT_STYLE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.css']);

/** Extensions whose files are embedded as data URIs (images travel along). */
function isImagePath(filePath: string): boolean {
  const extension = path.extname(filePath).toLowerCase().slice(1);
  return extension in IMAGE_MIME_TYPES;
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

export interface BuildWikiOptions {
  /**
   * Directories to include — like a VS Code multi-root workspace, each keeps
   * its own `.crossnote` config while the global config layer is shared.
   */
  directories: string[];
  /** Load config from VS Code user settings on top of the global config. */
  vscode?: boolean;
  /** Path to the VS Code user `settings.json` (auto-detected by default). */
  vscodeSettingsPath?: string;
  /** Override the global config directory (tests). */
  globalConfigDirectory?: string;
  /** Override the crossnote build directory (tests). */
  crossnoteBuildDirectory?: string;
  /**
   * Progress callback, called after each rendered note. `rendered`/`total`
   * count the notes of the root currently being processed.
   */
  onProgress?: (info: {
    rendered: number;
    total: number;
    root: string;
  }) => void;
}

export interface WikiFileEntry {
  /**
   * Identity of the note inside the wiki: its path relative to its root
   * (posix separators), prefixed with the root's folder name when the wiki
   * packs several roots. Deliberately not an absolute path — the wiki file
   * must not carry the exporting machine's directory layout.
   */
  path: string;
  /** Folder name of the served root the note belongs to. */
  root: string;
  /** Document title (front-matter title or file basename). */
  title: string;
  /** Modification time of the source note (picker ordering). */
  mtimeMs: number;
  /**
   * The complete preview page document for the note — the exact page the
   * serve server would render at `/preview?file=…` — with shared assets
   * referenced as `crossnote-wiki-asset:<id>` tokens.
   */
  html: string;
  /**
   * The `updateHtml` payload the shell replays into the page when it
   * finishes loading (same message the serve server would broadcast), so
   * the preview app initializes exactly like in `crossnote serve`.
   */
  update: {
    markdown: string;
    html: string;
    tocHTML: string;
    totalLineCount: number;
    sourceUri: string;
    sourceScheme: string;
    id: string;
    class: string;
    jsAndCssFiles: string[];
  };
}

export interface BuildWikiResult {
  /** The standalone HTML document. */
  html: string;
  /** Metadata of the embedded notes (without the html payloads). */
  files: Array<Pick<WikiFileEntry, 'path' | 'root' | 'title' | 'mtimeMs'>>;
  rootDirectories: string[];
  /** Notes that failed to render, skipped from the wiki. */
  failures: Array<{ path: string; error: string }>;
}

/**
 * Build a standalone, single-file wiki (a la TiddlyWiki) from a list of
 * directories: every markdown note is rendered as a regular *preview* page
 * (the same page `crossnote serve` shows, marked `isWiki` so the webview is
 * read-only), and all pages are embedded into one shell document running the
 * serve app itself. Shared assets (preview.js, mermaid, themes, …) are
 * stored once and referenced by tokens that the shell inlines when a note is
 * opened; local images travel along as data URIs.
 *
 * The result is read-only by construction: notes are pre-rendered, the
 * embedded webview config carries `isWiki: true` (hiding editing UI), and
 * the sandboxed note frames have no write channel back to anything.
 */
export async function buildWiki(
  options: BuildWikiOptions,
): Promise<BuildWikiResult> {
  const buildDirectory = path.resolve(
    options.crossnoteBuildDirectory ?? getCrossnoteBuildDirectory(),
  );
  setCrossnoteBuildDirectory(buildDirectory);

  const { rootDirectories, notebooks } = await createNotebooksForDirectories(
    options.directories,
    {
      vscode: options.vscode,
      vscodeSettingsPath: options.vscodeSettingsPath,
      globalConfigDirectory: options.globalConfigDirectory,
    },
  );

  // The wiki file is meant to be shared; it carries no absolute paths of
  // the machine it was exported on. Notes are keyed by their path relative
  // to their root (prefixed with the root's folder name when several roots
  // are packed), and the payload lists root names, not root paths.
  const multiRoot = rootDirectories.length > 1;
  const rootNames = rootDirectories.map((root) => path.basename(root) || root);
  const noteKeyFor = (absolutePath: string, rootIndex: number): string => {
    const relative = toPosixPath(
      path.relative(rootDirectories[rootIndex], absolutePath),
    );
    return multiRoot ? `${rootNames[rootIndex]}/${relative}` : relative;
  };

  // Token registry: one entry per distinct asset file, filled by the
  // addFileProtocol mapper while the templates are generated.
  const assetIds = new Map<string, string>(); // absolute path → token id
  let assetCounter = 0;
  const tokenFor = (filePath: string): string => {
    const resolved = path.resolve(filePath);
    let id = assetIds.get(resolved);
    if (id === undefined) {
      id = String(assetCounter++);
      assetIds.set(resolved, id);
    }
    return `${ASSET_TOKEN_PREFIX}${id}`;
  };

  const dataUriForImage = (filePath: string): string | null => {
    const extension = path.extname(filePath).toLowerCase().slice(1);
    const mime = IMAGE_MIME_TYPES[extension];
    if (!mime) {
      return null;
    }
    // Raw HTML may carry percent-encoded srcs (`./my%20image.png`) — try the
    // literal path first, then the decoded one.
    const cleanPath = resolvedPath(filePath);
    const candidates = [cleanPath];
    try {
      const decoded = decodeURIComponent(cleanPath);
      if (decoded !== cleanPath) {
        candidates.push(decoded);
      }
    } catch {
      // Invalid percent-encoding — the literal path is all we have.
    }
    for (const candidate of candidates) {
      try {
        const base64 = fs.readFileSync(candidate).toString('base64');
        return `data:${mime};base64,${base64}`;
      } catch {
        // Try the next candidate.
      }
    }
    // Unreadable image — keep a dead reference rather than failing the
    // whole wiki build.
    return null;
  };

  function resolvedPath(filePath: string): string {
    return filePath.replace(/\?.+$/, ''); // drop the mapper's cache busters
  }

  // A truthy panel makes `utility.addFileProtocol` consult the mapper below;
  // the engine never dereferences the panel. The mapper is global state, so
  // it is restored afterwards — a host that renders its own previews
  // concurrently (the serve server) must not start emitting wiki tokens.
  const dummyPanel = {} as unknown as vscode.WebviewPanel;
  const restoreMapper = useExternalAddFileProtocolFunction(
    (filePath: string) => {
      const cleanPath = resolvedPath(filePath);
      if (isPathWithinRoot(buildDirectory, cleanPath)) {
        // The three theme slots are resolved at open time — the wiki's
        // context-menu theme picker persists its selection to localStorage —
        // so they get stable semantic tokens instead of per-file asset ids.
        const relativeToBuild = toPosixPath(
          path.relative(buildDirectory, cleanPath),
        );
        if (relativeToBuild.startsWith('styles/preview_theme/')) {
          return `${THEME_TOKEN_PREFIX}preview`;
        }
        if (relativeToBuild.startsWith('styles/prism_theme/')) {
          return `${THEME_TOKEN_PREFIX}codeBlock`;
        }
        if (relativeToBuild.startsWith('dependencies/reveal/css/theme/')) {
          return `${THEME_TOKEN_PREFIX}reveal`;
        }
        return tokenFor(cleanPath);
      }
      for (const root of rootDirectories) {
        if (!isPathWithinRoot(root, cleanPath)) {
          continue;
        }
        if (isImagePath(cleanPath)) {
          // Images must be final in the note HTML itself — the webview's
          // sanitizer would strip an unknown asset-token scheme.
          const dataUri = dataUriForImage(cleanPath);
          if (dataUri) {
            return dataUri;
          }
          return addFileProtocol(cleanPath);
        }
        if (
          SCRIPT_STYLE_EXTENSIONS.has(path.extname(cleanPath).toLowerCase())
        ) {
          // Workspace js/css (@import files) — inlined like build assets.
          return tokenFor(cleanPath);
        }
        // Everything else (note links, …) keeps a root-relative path, which
        // the shell resolves against the wiki payload on click.
        const relative = path.relative(root, cleanPath);
        return `/${toPosixPath(relative)}`;
      }
      return addFileProtocol(cleanPath);
    },
  );

  const files: WikiFileEntry[] = [];
  const failures: Array<{ path: string; error: string }> = [];
  // Remote images are fetched once per URL for the whole build — a
  // TiddlyWiki-style self-contained file: the reader needs no network for
  // images.
  const remoteImageCache = new Map<string, string | null>();

  try {
    for (let rootIndex = 0; rootIndex < rootDirectories.length; rootIndex++) {
      const root = rootDirectories[rootIndex];
      const notebook = notebooks[rootIndex];
      const markdownFiles = await listMarkdownFiles(root);
      let processedInRoot = 0;
      for (const file of markdownFiles) {
        try {
          const text = await fs.promises.readFile(file.absolutePath, 'utf-8');
          const engine = notebook.getNoteMarkdownEngine(file.absolutePath);
          const output: MarkdownEngineOutput = await engine.parseMD(text, {
            isForPreview: true,
            useRelativeFilePath: false,
            hideFrontMatter: false,
            vscodePreviewPanel: dummyPanel,
          });
          output.html = await embedRemoteImages(output.html, remoteImageCache);
          const noteKey = noteKeyFor(file.absolutePath, rootIndex);
          const html = await engine.generateHTMLTemplateForPreview({
            inputString: text,
            parsedOutput: output,
            vscodePreviewPanel: dummyPanel,
            config: {
              sourceUri: noteKey,
              isVSCode: false,
              isServerApp: true,
              isWiki: true,
            } as WebviewConfig,
            scripts: WIKI_PREVIEW_HOST_SHIM,
            // No <base>: same-document `#anchor` links must keep resolving to
            // the note document itself.
            head: '',
          });
          const yamlConfig = output.yamlConfig as Record<string, unknown>;
          const title =
            (typeof yamlConfig['title'] === 'string' &&
              yamlConfig['title'].trim()) ||
            path.basename(file.absolutePath, path.extname(file.absolutePath));
          const mtimeMs = (await fs.promises.stat(file.absolutePath)).mtimeMs;
          files.push({
            path: noteKey,
            root: rootNames[rootIndex],
            title,
            mtimeMs,
            html,
            update: {
              markdown: text,
              html: output.html,
              tocHTML: output.tocHTML,
              totalLineCount: text.split('\n').length,
              sourceUri: noteKey,
              sourceScheme: 'file',
              id: (yamlConfig['id'] as string) || '',
              class: (yamlConfig['class'] as string) || '',
              jsAndCssFiles: output.JSAndCssFiles,
            },
          });
        } catch (error) {
          failures.push({
            path: file.absolutePath,
            error: String(error),
          });
        }
        processedInRoot += 1;
        options.onProgress?.({
          rendered: processedInRoot,
          total: markdownFiles.length,
          root,
        });
      }
    }
  } finally {
    restoreMapper();
  }

  if (files.length === 0) {
    throw new Error(
      'no markdown notes found to build a wiki from' +
        (failures.length > 0
          ? ` (${failures.length} notes failed to render)`
          : ''),
    );
  }

  const assets: Record<string, string> = {};
  for (const [filePath, id] of assetIds) {
    assets[id] =
      path.extname(filePath).toLowerCase() === '.css'
        ? await readStylesheetWithInlinedUrls(filePath)
        : await fs.promises.readFile(filePath, 'utf-8').catch(() => '');
  }
  // The graph view page, assembled by the shell from these bundles.
  assets['graph-view.js'] = await fs.promises
    .readFile(path.join(buildDirectory, 'webview', 'graph-view.js'), 'utf-8')
    .catch(() => '');
  assets['graph-view.css'] = await readStylesheetWithInlinedUrls(
    path.join(buildDirectory, 'webview', 'graph-view.css'),
  ).catch(() => '');

  const themes = await collectThemeAssets(buildDirectory, notebooks[0]);

  // Graph view + backlinks: both need the note index, so they are computed
  // here and embedded — the wiki file has no server behind it.
  const graph: Record<string, WikiGraphPayload> = {};
  const backlinks: Record<string, WikiBacklinkPayload[]> = {};
  for (let rootIndex = 0; rootIndex < rootDirectories.length; rootIndex++) {
    const notebook = notebooks[rootIndex];
    try {
      await notebook.refreshNotesIfNotLoaded({
        dir: '.',
        includeSubdirectories: true,
      });
      graph[rootNames[rootIndex]] = constructGraphView(
        notebook,
      ) as WikiGraphPayload;
    } catch (error) {
      console.error(
        `crossnote build-wiki: failed to build graph data for ${rootDirectories[rootIndex]}:`,
        error,
      );
    }
    for (const file of files) {
      if (file.root !== rootNames[rootIndex]) {
        continue;
      }
      try {
        backlinks[file.path] = (
          (await notebook.getNoteBacklinks(
            path.join(rootDirectories[rootIndex], ...file.path.split('/')),
          )) ?? []
        ).map((backlink) =>
          scrubBacklinkForWiki(backlink, rootDirectories[rootIndex]),
        );
      } catch {
        backlinks[file.path] = [];
      }
    }
  }

  const html = buildShellHTML({
    rootNames,
    files,
    assets,
    themes,
    graph,
    backlinks,
    buildDirectory,
  });

  return {
    html,
    files: files.map(({ path, root, title, mtimeMs }) => ({
      path,
      root,
      title,
      mtimeMs,
    })),
    rootDirectories,
    failures,
  };
}

/**
 * The shape of the `themes` section of the wiki payload: every available
 * stylesheet for the three theme slots, the `auto.css` code-block
 * resolution map, and the theme names the note pages were built with.
 */
/** Graph view data as embedded in the wiki payload (one per root). */
export interface WikiGraphPayload {
  hash: string;
  nodes: Array<{ id: string; label: string }>;
  links: Array<{ source: string; target: string }>;
}

/** A backlink entry, path-scrubbed for the wiki (relative note keys). */
export interface WikiBacklinkPayload {
  note: {
    /** `file:///`-shaped base so the panel links resolve back into the wiki. */
    notebookPath: { scheme: string; path: string };
    /** Root-relative note key. */
    filePath: string;
    title: string;
    config?: Record<string, unknown>;
  };
  references: Array<Record<string, unknown>>;
  referenceHtmls: string[];
}

/**
 * Strip the exporting machine's absolute paths from a backlink entry:
 * note paths become root-relative keys, the notebook base becomes
 * `file:///` (so the panel's `joinPath` links produce `file:///<key>`
 * hrefs the shell resolves back into the wiki), and the reference snippets'
 * link hrefs are rewritten the same way.
 */
function scrubBacklinkForWiki(
  backlink: {
    note?: {
      notebookPath?: unknown;
      filePath?: string;
      title?: string;
      config?: unknown;
    };
    references?: unknown;
    referenceHtmls?: string[];
  },
  rootDirectory: string,
): WikiBacklinkPayload {
  return {
    note: {
      notebookPath: { scheme: 'file', path: '/' },
      filePath: (backlink.note?.filePath ?? '').replace(/\\/g, '/'),
      title: backlink.note?.title ?? '',
      config: backlink.note?.config as Record<string, unknown> | undefined,
    },
    references: (backlink.references ?? []) as Array<Record<string, unknown>>,
    referenceHtmls: (backlink.referenceHtmls ?? []).map((html) =>
      scrubWikiHtmlLinks(html, rootDirectory),
    ),
  };
}

/**
 * Rewrite `href`/`src` values that point into `rootDirectory` (in any of
 * the encodings the note index produces — raw, forward-slashed or
 * percent-encoded) into `file:///<root-relative key>` links.
 */
function scrubWikiHtmlLinks(html: string, rootDirectory: string): string {
  try {
    const $ = cheerio.load(html);
    $('a[href], img[src]').each((_, element) => {
      for (const attribute of ['href', 'src']) {
        const value = $(element).attr(attribute);
        if (!value) {
          continue;
        }
        let decoded = value;
        try {
          decoded = decodeURIComponent(value);
        } catch {
          // Keep the raw value.
        }
        // The index emits mixed separators (`C:\root/notes\x.md`).
        const normalized = decoded.replace(/\//g, path.sep);
        if (!isPathWithinRoot(rootDirectory, normalized)) {
          continue;
        }
        const relative = path
          .relative(rootDirectory, normalized)
          .split(path.sep)
          .join('/');
        $(element).attr(attribute, `file:///${relative}`);
      }
    });
    return $.html();
  } catch {
    return html;
  }
}

export interface WikiThemesPayload {
  /** `github-light.css` → stylesheet text. */
  preview: Record<string, string>;
  /** `default.css` → stylesheet text (prism). */
  codeBlock: Record<string, string>;
  /** `beige.css` → stylesheet text (reveal.js presentation themes). */
  reveal: Record<string, string>;
  /** preview theme → code-block theme, for `codeBlock: 'auto.css'`. */
  codeBlockAuto: Record<string, string>;
  /** The notebook config the note pages were rendered with. */
  build: { preview: string; codeBlock: string; reveal: string };
}

/**
 * Read every preview/code-block/reveal theme stylesheet from the build
 * directory so the wiki's context-menu theme picker can switch between
 * them at open time, plus the `auto.css` resolution map.
 */
async function collectThemeAssets(
  buildDirectory: string,
  notebook: {
    config: {
      previewTheme: string;
      codeBlockTheme: string;
      revealjsTheme: string;
    };
  },
): Promise<WikiThemesPayload> {
  const readThemeDirectory = async (
    relativeDirectory: string,
  ): Promise<Record<string, string>> => {
    const absoluteDirectory = path.join(
      buildDirectory,
      ...relativeDirectory.split('/'),
    );
    const entries = await fs.promises
      .readdir(absoluteDirectory)
      .catch(() => [] as string[]);
    const map: Record<string, string> = {};
    for (const entry of entries) {
      if (!entry.toLowerCase().endsWith('.css')) {
        continue;
      }
      map[entry] = await readStylesheetWithInlinedUrls(
        path.join(absoluteDirectory, entry),
      );
    }
    return map;
  };
  return {
    preview: await readThemeDirectory('styles/preview_theme'),
    codeBlock: await readThemeDirectory('styles/prism_theme'),
    reveal: await readThemeDirectory('dependencies/reveal/css/theme'),
    codeBlockAuto: { ...MarkdownEngine.AutoPrismThemeMap },
    build: {
      preview: notebook.config.previewTheme,
      codeBlock: notebook.config.codeBlockTheme,
      reveal: notebook.config.revealjsTheme,
    },
  };
}

/** Fetch limit and timeout for embedding remote images. */
const REMOTE_IMAGE_TIMEOUT_MS = 10_000;
const REMOTE_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

/**
 * Replace `<img src="http(s)://…">` references with fetched data URIs so the
 * wiki renders its images without any network. Best-effort: a URL that
 * fails, times out or exceeds the size cap keeps its remote reference, and
 * each URL is fetched at most once per build through `cache` (which also
 * memoizes failures, `null`).
 */
export async function embedRemoteImages(
  html: string,
  cache: Map<string, string | null>,
): Promise<string> {
  const urls = new Set<string>();
  for (const match of html.matchAll(/<img[^>]*\ssrc="(https?:[^"]+)"/g)) {
    urls.add(match[1]);
  }
  if (urls.size === 0) {
    return html;
  }
  const replacements = new Map<string, string>();
  await Promise.all(
    Array.from(urls).map(async (url) => {
      let cached = cache.get(url);
      if (cached === undefined) {
        cached = await fetchRemoteImage(url);
        cache.set(url, cached);
      }
      if (cached) {
        replacements.set(url, cached);
      }
    }),
  );
  if (replacements.size === 0) {
    return html;
  }
  return html.replace(
    /(<img[^>]*\ssrc=")(https?:[^"]+)(")/g,
    (match, prefix: string, url: string, suffix: string) =>
      replacements.has(url)
        ? `${prefix}${replacements.get(url)}${suffix}`
        : match,
  );
}

async function fetchRemoteImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REMOTE_IMAGE_TIMEOUT_MS),
      redirect: 'follow',
    });
    if (!response.ok) {
      return null;
    }
    const declaredLength = parseInt(
      response.headers.get('content-length') ?? '',
      10,
    );
    if (
      Number.isInteger(declaredLength) &&
      declaredLength > REMOTE_IMAGE_MAX_BYTES
    ) {
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > REMOTE_IMAGE_MAX_BYTES) {
      return null;
    }
    const mime = (response.headers.get('content-type') ?? '').split(';')[0];
    if (!mime.startsWith('image/')) {
      return null;
    }
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

/**
 * Read a stylesheet and inline every `url(...)` it references (fonts,
 * images) as data URIs. Inlined stylesheets have no base URL inside a wiki
 * note document, so relative references would otherwise break.
 */
async function readStylesheetWithInlinedUrls(cssPath: string): Promise<string> {
  let css: string;
  try {
    css = await fs.promises.readFile(cssPath, 'utf-8');
  } catch {
    return '';
  }
  const directory = path.dirname(cssPath);
  const cache = new Map<string, string>();
  return css.replace(
    /url\(\s*(['"]?)([^'")]+)\1\s*\)/g,
    (match, _quote: string, ref: string) => {
      if (
        ref.startsWith('data:') ||
        ref.startsWith('#') ||
        /^[a-z][a-z0-9+.-]*:/i.test(ref) ||
        ref.startsWith('//')
      ) {
        return match;
      }
      let dataUri = cache.get(ref);
      if (dataUri === undefined) {
        dataUri = '';
        try {
          const assetPath = path.resolve(directory, decodeURIComponent(ref));
          const extension = path.extname(assetPath).toLowerCase().slice(1);
          const mime =
            IMAGE_MIME_TYPES[extension] ??
            (extension === 'woff2'
              ? 'font/woff2'
              : extension === 'woff'
                ? 'font/woff'
                : extension === 'ttf'
                  ? 'font/ttf'
                  : extension === 'otf'
                    ? 'font/otf'
                    : extension === 'eot'
                      ? 'application/vnd.ms-fontobject'
                      : 'application/octet-stream');
          const base64 = fs.readFileSync(assetPath).toString('base64');
          dataUri = `data:${mime};base64,${base64}`;
        } catch {
          // Unreadable asset — keep the original (dead) reference.
        }
        cache.set(ref, dataUri);
      }
      return dataUri ? `url("${dataUri}")` : match;
    },
  );
}

/**
 * Assemble the shell document: the serve app bundle (inlined from the build
 * directory) plus every note document and shared asset embedded as one JSON
 * payload. The payload carries root *names* only — no absolute path of the
 * machine the wiki was exported on is written into the file.
 */
function buildShellHTML({
  rootNames,
  files,
  assets,
  themes,
  graph,
  backlinks,
  buildDirectory,
}: {
  rootNames: string[];
  files: WikiFileEntry[];
  assets: Record<string, string>;
  themes: WikiThemesPayload;
  graph: Record<string, WikiGraphPayload>;
  backlinks: Record<string, WikiBacklinkPayload[]>;
  buildDirectory: string;
}): string {
  const appScriptPath = path.join(
    buildDirectory,
    'server-app',
    'server-app.js',
  );
  const appStylePath = path.join(
    buildDirectory,
    'server-app',
    'server-app.css',
  );
  let appScript: string;
  let appStyle: string;
  try {
    appScript = fs.readFileSync(appScriptPath, 'utf-8');
    appStyle = fs.readFileSync(appStylePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `the server app bundle is missing (looked at ${appScriptPath}); rebuild crossnote so out/server-app/ exists`,
      { cause: error },
    );
  }
  // Escape `</script>`-breakouts: `<` inside the JSON payload (and inside
  // the inlined app, for good measure) becomes a JS unicode escape.
  const payload = JSON.stringify({
    rootDirectories: rootNames,
    assets,
    themes,
    graph,
    backlinks,
    files,
  }).replace(/</g, '\\u003c');
  const safeAppScript = appScript.replace(/<\/script/g, '<\\/script');
  const safeAppStyle = appStyle.replace(/<\/style/g, '<\\/style');

  const title = `wiki — ${rootNames[0] ?? ''}`;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHTML(title)}</title>
<style>${safeAppStyle}</style>
</head>
<body>
<script>window.__CROSSNOTE_WIKI__ = ${payload};</script>
<div id="root"></div>
<script>${safeAppScript}</script>
</body>
</html>`;
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
