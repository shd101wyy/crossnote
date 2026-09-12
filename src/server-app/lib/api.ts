export interface MarkdownFileInfo {
  relativePath: string;
  absolutePath: string;
  mtimeMs: number;
}

export interface ServerInfo {
  rootDirectory: string;
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
      rootDirectory: '',
      vscode: false,
      url: window.location.origin,
    }
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
  return '/' + stack.join('/');
}

/**
 * Resolve an href from a markdown link (as sent by the webview's
 * `clickTagA`, already percent-decoded) to an absolute file path. Absolute
 * hrefs are relative to the served root, like crossnote's own
 * `resolveFilePath`.
 */
export function resolveHref(
  rootDirectory: string,
  sourceFile: string,
  href: string,
): string {
  const cleanHref = href.split('#')[0].split('?')[0];
  if (cleanHref.startsWith('/')) {
    return normalize(rootDirectory + '/' + cleanHref);
  }
  return normalize(dirname(sourceFile) + '/' + cleanHref);
}

export function isMarkdownPath(filePath: string): boolean {
  return /\.(md|markdown|mdx)$/i.test(filePath);
}

/**
 * URL for a workspace file under the `/files/` mount. The route maps the
 * URL path relative to the served root, so absolute paths are rebased first.
 * Returns null for paths outside the root.
 */
export function filePathToFilesUrl(
  rootDirectory: string,
  absolutePath: string,
): string | null {
  const root = rootDirectory.replace(/\/+$/, '');
  if (absolutePath !== root && !absolutePath.startsWith(root + '/')) {
    return null;
  }
  const relative = absolutePath.slice(root.length);
  const encoded = relative
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `/files${encoded}`;
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
