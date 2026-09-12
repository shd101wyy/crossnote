import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

export const MARKDOWN_EXTENSIONS = ['.md', '.markdown', '.mdx'];

const SKIPPED_DIRECTORY_NAMES = new Set(['node_modules', '.git']);

export function isMarkdownFile(filePath: string): boolean {
  return MARKDOWN_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

/**
 * URL-encode each path segment so spaces, `#`, `?`, … don't break the URL,
 * while keeping `/` separators.
 */
export function encodePathSegments(relativePath: string): string {
  return relativePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

/**
 * Whether `candidate` is `root` itself or located underneath it. The
 * separator must be part of the check, otherwise a sibling directory that
 * merely shares a name prefix (`<root>-evil`) passes.
 */
export function isPathWithinRoot(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(root + path.sep);
}

export interface MarkdownFileInfo {
  /** Path relative to the served root, using `/` separators. */
  relativePath: string;
  /** Absolute path on disk (used as the tab/preview identity). */
  absolutePath: string;
  mtimeMs: number;
}

/**
 * Recursively list markdown files under `rootDirectory`, skipping
 * `node_modules`, `.git`, dot-directories and anything excluded by the
 * root's `.gitignore` (when present).
 */
export async function listMarkdownFiles(
  rootDirectory: string,
  limit: number = 5000,
): Promise<MarkdownFileInfo[]> {
  const gitignorePath = path.join(rootDirectory, '.gitignore');
  let isIgnored: (relativePath: string) => boolean = () => false;
  try {
    if (fs.existsSync(gitignorePath)) {
      const gitignore = ignore();
      gitignore.add(fs.readFileSync(gitignorePath, 'utf-8'));
      isIgnored = (relativePath: string) => gitignore.ignores(relativePath);
    }
  } catch {
    // A broken .gitignore shouldn't take the file list down.
  }

  const results: MarkdownFileInfo[] = [];
  const queue: string[] = [rootDirectory];
  while (queue.length > 0 && results.length < limit) {
    const directory = queue.shift() as string;
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = path
        .relative(rootDirectory, absolutePath)
        .split(path.sep)
        .join('/');
      if (isIgnored(relativePath)) {
        continue;
      }
      if (entry.isDirectory()) {
        if (
          entry.name.startsWith('.') ||
          SKIPPED_DIRECTORY_NAMES.has(entry.name)
        ) {
          continue;
        }
        queue.push(absolutePath);
      } else if (entry.isFile() && isMarkdownFile(entry.name)) {
        try {
          const stat = await fs.promises.stat(absolutePath);
          results.push({
            relativePath,
            absolutePath,
            mtimeMs: stat.mtimeMs,
          });
        } catch {
          // File vanished between readdir and stat; skip it.
        }
      }
    }
  }
  return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
