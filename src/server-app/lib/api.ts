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

declare global {
  interface Window {
    __CROSSNOTE_SERVER__?: ServerInfo;
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
 */
export function resolveHref(
  rootDirectories: string[],
  sourceFile: string,
  href: string,
): string {
  const cleanHref = href.split('#')[0].split('?')[0];
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

export interface WebviewFinishLoadingArgs {
  uri: string;
  systemColorScheme: 'light' | 'dark';
}

export interface UpdateHtmlPayload {
  command?: string;
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
