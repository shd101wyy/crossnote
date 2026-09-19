export interface MarkdownFileInfo {
  relativePath: string;
  absolutePath: string;
  mtimeMs: number;
  /** The served root this file belongs to (multi-root support). */
  rootPath?: string;
}

export interface ServerInfo {
  /** All served roots, in the order they were given. */
  rootDirectories: string[];
  vscode: boolean;
  url: string;
}

/** The `updateHtml` payload the wiki shell replays into a preview frame. */
export interface WikiNoteUpdate {
  markdown: string;
  html: string;
  tocHTML: string;
  totalLineCount: number;
  sourceUri: string;
  sourceScheme: string;
  id: string;
  class: string;
  jsAndCssFiles?: string[];
}

export interface WikiFileMeta {
  path: string;
  root: string;
  title: string;
  mtimeMs: number;
  /**
   * The complete preview page document (the exact `/preview` page the serve
   * app would render), with crossnote build/workspace assets referenced as
   * `crossnote-wiki-asset:<id>` tokens.
   */
  html: string;
  update: WikiNoteUpdate;
}

/** The theme slots the wiki's context-menu picker can switch between. */
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

/** Graph view nodes/links, as produced by crossnote's `constructGraphView`. */
export interface WikiGraphData {
  hash: string;
  nodes: Array<{ id: string; label: string }>;
  links: Array<{ source: string; target: string }>;
}

/** A backlink entry, as the preview webview's backlinks panel expects. */
export interface WikiBacklink {
  note: {
    /** `file:///`-shaped so the panel's links resolve back into the wiki. */
    notebookPath: { scheme: string; path: string };
    /** Root-relative note key. */
    filePath: string;
    title: string;
    config?: Record<string, unknown>;
  };
  references: Array<Record<string, unknown>>;
  referenceHtmls: string[];
}

export interface WikiData {
  rootDirectories: string[];
  /** Token → asset content: JS/CSS source to inline, or a data URI. */
  assets: Record<string, string>;
  /** Every available theme stylesheet, for the runtime theme picker. */
  themes: WikiThemesPayload;
  /** Graph view data per root (single entry: root name → data). */
  graph: Record<string, WikiGraphData>;
  /** Backlinks per note key (empty array when a note has none). */
  backlinks: Record<string, WikiBacklink[]>;
  files: WikiFileMeta[];
}

declare global {
  interface Window {
    __CROSSNOTE_SERVER__?: ServerInfo;
    __CROSSNOTE_WIKI__?: WikiData;
  }
}

export function getServerInfo(): ServerInfo {
  return (
    window.__CROSSNOTE_SERVER__ ?? {
      rootDirectories: [],
      vscode: false,
      url: window.location.origin,
    }
  );
}

export function getWikiData(): WikiData | null {
  return window.__CROSSNOTE_WIKI__ ?? null;
}

/**
 * Normalize a server-provided root path: posix separators, no trailing `/`.
 * Roots arrive from the server as Node paths, so on Windows they carry `\`.
 */
function cleanRootPath(root: string): string {
  return root.replace(/\\/g, '/').replace(/\/+$/, '');
}

/** Index of the served root containing `filePath`, or -1. */
export function rootContaining(
  rootDirectories: string[],
  filePath: string,
): number {
  const normalized = filePath.replace(/\\/g, '/');
  return rootDirectories.findIndex(
    (root) =>
      normalized === cleanRootPath(root) ||
      normalized.startsWith(cleanRootPath(root) + '/'),
  );
}

export async function fetchFiles(): Promise<MarkdownFileInfo[]> {
  const response = await fetch('/api/files');
  if (!response.ok) {
    throw new Error(`failed to list files: ${response.status}`);
  }
  const body = (await response.json()) as { files: MarkdownFileInfo[] };
  return body.files;
}

export async function sendCommand(
  file: string,
  command: string,
  args: unknown[],
): Promise<void> {
  try {
    await fetch('/api/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ file, command, args }),
    });
  } catch (error) {
    console.error('crossnote serve: command failed:', command, error);
  }
}

/** Posix-style basename of a path (works for both `/` and `\` separators). */
export function basename(filePath: string): string {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1] || filePath;
}

/** Posix-style dirname. */
export function dirname(filePath: string): string {
  const index = filePath.replace(/\\/g, '/').lastIndexOf('/');
  if (index === -1) {
    return '';
  }
  return filePath.slice(0, index);
}

function normalize(absolutePath: string): string {
  const parts = absolutePath.replace(/\\/g, '/').split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '' || part === '.') {
      continue;
    }
    if (part === '..') {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  // A Windows drive-letter path ('C:/…') must not gain a leading '/', or it
  // would no longer match the absolute paths the server and file lists use.
  const joined = stack.join('/');
  return /^[A-Za-z]:/.test(joined) ? joined : '/' + joined;
}

/**
 * Resolve an href from a markdown link (as sent by the webview's
 * `clickTagA`, already percent-decoded) to an absolute file path. Absolute
 * hrefs (`/...`) are relative to the root that contains the source file —
 * matching crossnote's own `resolveFilePath`, which anchors them to the
 * file's project directory.
 *
 * Hrefs under `/files/` are the serve server's own file-mount URLs (the
 * preview renders local links as `<a href="/files/…">`): the mount prefix
 * is undone here, honoring the `?root=` hint the server's URL mapper adds
 * in multi-root setups.
 */
export function resolveHref(
  rootDirectories: string[],
  sourceFile: string,
  href: string,
): string {
  const [pathAndFragment, query] = href.split('?');
  const cleanHref = pathAndFragment.split('#')[0];
  const filesMount = '/files/';
  if (cleanHref.startsWith(filesMount)) {
    const rootHint = new URLSearchParams(query ?? '').get('root');
    const hinted =
      rootHint !== null ? rootDirectories[parseInt(rootHint, 10)] : undefined;
    const root =
      hinted ??
      rootDirectories.find(
        (candidate) => rootContaining([candidate], sourceFile) !== -1,
      ) ??
      rootDirectories[0] ??
      '';
    return normalize(
      cleanRootPath(root) + '/' + cleanHref.slice(filesMount.length),
    );
  }
  if (cleanHref.startsWith('/')) {
    const sourceRootIndex = rootContaining(rootDirectories, sourceFile);
    const base =
      sourceRootIndex === -1
        ? (rootDirectories[0] ?? '')
        : rootDirectories[sourceRootIndex];
    return normalize(base + '/' + cleanHref);
  }
  return normalize(dirname(sourceFile) + '/' + cleanHref);
}

export function isMarkdownPath(filePath: string): boolean {
  return /\.(md|markdown|mdx)$/i.test(filePath);
}

/**
 * URL for a workspace file under the `/files/` mount. The route maps the
 * URL path relative to the containing served root; with several roots the
 * `?root=` hint pins the mount (the server's URL mapper does the same).
 * Returns null for paths outside every root.
 */
export function filePathToFilesUrl(
  rootDirectories: string[],
  absolutePath: string,
): string | null {
  const rootIndex = rootContaining(rootDirectories, absolutePath);
  if (rootIndex === -1) {
    return null;
  }
  const root = cleanRootPath(rootDirectories[rootIndex]);
  const relative = absolutePath.replace(/\\/g, '/').slice(root.length);
  const encoded = relative
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const rootHint = rootDirectories.length > 1 ? `?root=${rootIndex}` : '';
  return `/files${encoded}${rootHint}`;
}

export interface WebviewCommandMessage {
  command: string;
  args?: unknown[];
}

/**
 * Pseudo-file key identifying the graph view pane tab: the prefix plus the
 * anchor note (whose neighborhood is highlighted). Exactly one graph tab
 * exists at a time, like VS Code's single graph view panel.
 */
export const GRAPH_VIEW_TAB_PREFIX = '__crossnote-graph-view__:';

export function graphTabFile(anchorFile: string): string {
  return GRAPH_VIEW_TAB_PREFIX + anchorFile;
}

export function isGraphTab(file: string): boolean {
  return file.startsWith(GRAPH_VIEW_TAB_PREFIX);
}

/** The anchor note of a graph tab (everything after the prefix). */
export function graphAnchorFile(file: string): string {
  return file.slice(GRAPH_VIEW_TAB_PREFIX.length);
}

export interface WebviewFinishLoadingArgs {
  uri: string;
  systemColorScheme: 'light' | 'dark';
}

/** What the shell sends into a frame to (re)hydrate a preview. */
export interface UpdateHtmlPayload extends WikiNoteUpdate {
  command?: string;
}
