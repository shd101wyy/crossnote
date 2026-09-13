import * as fs from 'fs';
import * as path from 'path';
import {
  MarkdownFileInfo,
  isMarkdownFile,
  listMarkdownFiles,
} from './markdown-files';

export interface FileChange {
  /** Absolute path of the changed file. */
  absolutePath: string;
  type: 'changed' | 'deleted';
}

/**
 * Watch markdown files under a root directory.
 *
 * `fs.watch(…, {recursive: true})` is only available on macOS and Windows in
 * Node 18, so on Linux this falls back to periodic mtime polling.
 */
export class MarkdownWatcher {
  private watcher: fs.FSWatcher | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private knownFiles = new Map<string, number>();
  private pendingEvents = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly rootDirectory: string,
    private readonly onChange: (change: FileChange) => void,
    private readonly pollIntervalMs: number = 1000,
  ) {}

  public async start(): Promise<void> {
    const supportsRecursiveWatch: boolean =
      process.platform === 'darwin' || process.platform === 'win32';
    if (supportsRecursiveWatch) {
      this.watcher = fs.watch(
        this.rootDirectory,
        { recursive: true },
        (eventType, filename) => {
          if (!filename) {
            return;
          }
          const absolutePath = path.resolve(this.rootDirectory, filename);
          if (!isMarkdownFile(absolutePath)) {
            return;
          }
          fs.stat(absolutePath, (error, stat) => {
            if (error) {
              this.emitDebounced(absolutePath, 'deleted');
            } else if (stat.isFile()) {
              this.emitDebounced(absolutePath, 'changed');
            }
          });
        },
      );
      // An FSWatcher 'error' (root removed, permissions changed) is fatal
      // unless it is handled — it must not take the whole server down.
      this.watcher.on('error', (error) => {
        console.error(
          `crossnote serve: watcher error on ${this.rootDirectory}:`,
          error,
        );
      });
    } else {
      // Polling fallback for platforms without recursive fs.watch.
      this.knownFiles = new Map(
        (
          await listMarkdownFiles(this.rootDirectory, Number.MAX_SAFE_INTEGER)
        ).map(
          (file: MarkdownFileInfo) =>
            [file.absolutePath, file.mtimeMs] as const,
        ),
      );
      this.pollTimer = setInterval(() => void this.poll(), this.pollIntervalMs);
    }
  }

  private async poll(): Promise<void> {
    const files = await listMarkdownFiles(
      this.rootDirectory,
      Number.MAX_SAFE_INTEGER,
    );
    const seen = new Set<string>();
    for (const file of files) {
      seen.add(file.absolutePath);
      const previousMtime = this.knownFiles.get(file.absolutePath);
      if (previousMtime === undefined) {
        this.emitDebounced(file.absolutePath, 'changed');
      } else if (file.mtimeMs > previousMtime) {
        this.emitDebounced(file.absolutePath, 'changed');
      }
      this.knownFiles.set(file.absolutePath, file.mtimeMs);
    }
    for (const absolutePath of this.knownFiles.keys()) {
      if (!seen.has(absolutePath)) {
        this.knownFiles.delete(absolutePath);
        this.emitDebounced(absolutePath, 'deleted');
      }
    }
  }

  /**
   * Debounce events per file: editors emit several watch events per save and
   * some editors write via rename (delete + create).
   */
  private emitDebounced(absolutePath: string, type: 'changed' | 'deleted') {
    const existing = this.pendingEvents.get(absolutePath);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      this.pendingEvents.delete(absolutePath);
      this.onChange({ absolutePath, type });
    }, 200);
    this.pendingEvents.set(absolutePath, timer);
  }

  public close(): void {
    this.watcher?.close();
    this.watcher = null;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    for (const timer of this.pendingEvents.values()) {
      clearTimeout(timer);
    }
    this.pendingEvents.clear();
  }
}
