/**
 * Containment guarantees for the note-index walk (#2376 in
 * vscode-markdown-preview-enhanced):
 *
 * 1. A notebook rooted at a filesystem root (`/`) must never walk —
 *    indexing it would stat/read files across the whole machine.
 * 2. The walk must not follow symbolic links out of the notebook root
 *    (a symlinked directory previously let the walk escape the
 *    workspace entirely).
 * 3. A notebook rooted at the user's home directory is refused for the
 *    same reason — hosts resolve a loose markdown file's notebook root
 *    to its parent directory, and a file directly in `~` would index
 *    `~/Library` (Mail, Messages, iCloud data on macOS).
 * 4. A walk that stats an unusual number of entries warns once, naming
 *    the root, so a user report is actionable on its own.
 */
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { URI } from 'vscode-uri';
import {
  FileSystemApi,
  FileSystemStats,
  Notebook,
  OVERSIZED_WALK_WARN_THRESHOLD,
} from '../src/notebook';

/**
 * An fs mock that records every readdir/stat call and fails the test
 * if any of them happen.  `Notebook.init` only touches `exists` (for
 * `/.crossnote`), so anything beyond that means the guard leaked.
 */
function fsThatMustNotBeWalked(): FileSystemApi & {
  accessed: string[];
} {
  const accessed: string[] = [];
  const boom = (op: string, p: string) => {
    accessed.push(`${op}:${p}`);
    throw new Error(`unexpected fs.${op}("${p}") — the walk must not run`);
  };
  return {
    accessed,
    readFile: async (p) => boom('readFile', p),
    writeFile: async (p) => boom('writeFile', p),
    mkdir: async (p) => boom('mkdir', p),
    exists: async () => false,
    stat: async (p) => boom('stat', p),
    readdir: async (p) => boom('readdir', p),
    unlink: async (p) => boom('unlink', p),
  };
}

/**
 * An fs mock presenting one flat directory of regular files: `readdir`
 * returns `fileNames` for any directory, `stat` reports a small plain
 * file.  `.gitignore` reads (and any other read) throw — the walk's
 * loader catches that.  With non-markdown extensions this lets a walk
 * stat thousands of entries without any note being indexed.
 */
function flatDirectoryFs(fileNames: string[]): FileSystemApi {
  const fileStat: FileSystemStats = {
    isFile: () => true,
    isDirectory: () => false,
    isSymbolicLink: () => false,
    size: 16,
    mtimeMs: 1,
    ctimeMs: 1,
  };
  return {
    exists: async () => false,
    readFile: async () => {
      throw new Error('unexpected readFile');
    },
    writeFile: async () => {
      throw new Error('unexpected writeFile');
    },
    mkdir: async () => {
      throw new Error('unexpected mkdir');
    },
    readdir: async () => fileNames,
    stat: async () => fileStat,
    unlink: async () => {
      throw new Error('unexpected unlink');
    },
  };
}

describe('notebook walk containment', () => {
  describe('filesystem-root notebook', () => {
    it('refreshNotes does not walk and returns no notes', async () => {
      const mock = fsThatMustNotBeWalked();
      const nb = await Notebook.init({
        notebookPath: 'file:///',
        fs: mock,
        config: { markdownParser: 'markdown-it' },
      });

      const notes = await nb.refreshNotes({
        dir: '.',
        includeSubdirectories: true,
      });

      expect(Object.keys(notes)).toHaveLength(0);
      expect(nb.hasLoadedNotes).toBe(false);
      expect(mock.accessed).toHaveLength(0);
    });

    it('refreshNotesIfNotLoaded and refreshNotesIncremental do not walk', async () => {
      const mock = fsThatMustNotBeWalked();
      const nb = await Notebook.init({
        notebookPath: 'file:///',
        fs: mock,
        config: { markdownParser: 'markdown-it' },
      });

      await nb.refreshNotesIfNotLoaded({
        dir: '.',
        includeSubdirectories: true,
      });
      await nb.refreshNotesIncremental({
        dir: '.',
        includeSubdirectories: true,
      });

      expect(mock.accessed).toHaveLength(0);
    });

    it('a dot-path spelling of the root (file:///., the untitled-document fallback) does not walk', async () => {
      const mock = fsThatMustNotBeWalked();
      const nb = await Notebook.init({
        notebookPath: 'file:///.',
        fs: mock,
        config: { markdownParser: 'markdown-it' },
      });

      const notes = await nb.refreshNotes({
        dir: '.',
        includeSubdirectories: true,
      });

      expect(Object.keys(notes)).toHaveLength(0);
      expect(mock.accessed).toHaveLength(0);
    });
  });

  describe('home-directory notebook', () => {
    // Notebook.init round-trips the path through vscode-uri, which
    // lowercases Windows drive letters (`C:\Users\…` → fsPath
    // `c:\Users\…`) — the exact spelling hosts pass, so on win32 this
    // also covers the case-insensitive home comparison.
    const homeNotebookPath = URI.file(os.homedir()).toString();

    it('refreshNotes does not walk and returns no notes', async () => {
      const mock = fsThatMustNotBeWalked();
      const nb = await Notebook.init({
        notebookPath: homeNotebookPath,
        fs: mock,
        config: { markdownParser: 'markdown-it' },
      });

      const notes = await nb.refreshNotes({
        dir: '.',
        includeSubdirectories: true,
      });

      expect(Object.keys(notes)).toHaveLength(0);
      expect(nb.hasLoadedNotes).toBe(false);
      expect(mock.accessed).toHaveLength(0);
    });

    it('refreshNotesIfNotLoaded and refreshNotesIncremental do not walk', async () => {
      const mock = fsThatMustNotBeWalked();
      const nb = await Notebook.init({
        notebookPath: homeNotebookPath,
        fs: mock,
        config: { markdownParser: 'markdown-it' },
      });

      await nb.refreshNotesIfNotLoaded({
        dir: '.',
        includeSubdirectories: true,
      });
      await nb.refreshNotesIncremental({
        dir: '.',
        includeSubdirectories: true,
      });

      expect(mock.accessed).toHaveLength(0);
    });
  });

  describe('oversized walk warning', () => {
    it('warns exactly once when a refresh stats past the threshold', async () => {
      const fileNames = Array.from(
        { length: OVERSIZED_WALK_WARN_THRESHOLD + 100 },
        (_, i) => `entry-${i}.txt`,
      );
      const nb = await Notebook.init({
        // A path that is neither a filesystem root nor the home
        // directory; the mock fs means nothing touches disk.
        notebookPath: path.join(os.tmpdir(), 'crossnote-canary-notebook'),
        fs: flatDirectoryFs(fileNames),
        config: { markdownParser: 'markdown-it' },
      });

      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        await nb.refreshNotes({ dir: '.', includeSubdirectories: true });
        // A second refresh re-crosses the threshold but must not
        // re-warn.
        await nb.refreshNotesIncremental({
          dir: '.',
          includeSubdirectories: true,
        });
        // Asserted before the finally: mockRestore() clears mock.calls.
        const oversizedWarnings = warn.mock.calls.filter(([message]) =>
          String(message).includes('filesystem entries'),
        );
        expect(oversizedWarnings).toHaveLength(1);
        expect(String(oversizedWarnings[0][0])).toContain(
          nb.notebookPath.fsPath,
        );
        // The entries are not markdown, so nothing was indexed — the
        // walk still paid for every stat, which is what is reported.
        expect(Object.keys(nb.notes)).toHaveLength(0);
      } finally {
        warn.mockRestore();
      }
    });

    it('does not warn for walks under the threshold', async () => {
      const fileNames = Array.from({ length: 10 }, (_, i) => `note-${i}.txt`);
      const nb = await Notebook.init({
        notebookPath: path.join(os.tmpdir(), 'crossnote-quiet-notebook'),
        fs: flatDirectoryFs(fileNames),
        config: { markdownParser: 'markdown-it' },
      });

      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        await nb.refreshNotes({ dir: '.', includeSubdirectories: true });
        // Asserted before the finally: mockRestore() clears mock.calls.
        expect(
          warn.mock.calls.filter(([message]) =>
            String(message).includes('filesystem entries'),
          ),
        ).toHaveLength(0);
      } finally {
        warn.mockRestore();
      }
    });
  });

  // Symlink creation needs elevated privileges on Windows.
  (process.platform === 'win32' ? describe.skip : describe)(
    'symbolic links',
    () => {
      let notebookPath: string;
      let outsidePath: string;

      beforeEach(async () => {
        const base = await fs.mkdtemp(
          path.join(os.tmpdir(), 'crossnote-containment-'),
        );
        notebookPath = path.join(base, 'notebook');
        outsidePath = path.join(base, 'outside');
        await fs.mkdir(notebookPath);
        await fs.mkdir(outsidePath);
        await fs.mkdir(path.join(outsidePath, 'deep'));
        await fs.writeFile(path.join(outsidePath, 'secret.md'), 'outside file');
        await fs.writeFile(
          path.join(outsidePath, 'deep', 'secret.md'),
          'outside nested file',
        );
        await fs.writeFile(path.join(notebookPath, 'inside.md'), 'inside');
      });

      afterEach(async () => {
        await fs.rm(path.dirname(notebookPath), {
          recursive: true,
          force: true,
        });
      });

      async function loaded(): Promise<Notebook> {
        const nb = await Notebook.init({
          notebookPath,
          config: { markdownParser: 'markdown-it' },
        });
        await nb.refreshNotes({ dir: '.', includeSubdirectories: true });
        return nb;
      }

      it('does not index through a symlinked directory', async () => {
        await fs.symlink(outsidePath, path.join(notebookPath, 'escape'), 'dir');
        const nb = await loaded();

        expect(Object.keys(nb.notes)).toEqual(['inside.md']);
      });

      it('does not index a symlinked file', async () => {
        await fs.symlink(
          path.join(outsidePath, 'secret.md'),
          path.join(notebookPath, 'link.md'),
          'file',
        );
        const nb = await loaded();

        expect(Object.keys(nb.notes)).toEqual(['inside.md']);
      });

      it('incremental refresh also skips symlinks', async () => {
        await fs.symlink(outsidePath, path.join(notebookPath, 'escape'), 'dir');
        const nb = await loaded();
        await nb.refreshNotesIncremental({
          dir: '.',
          includeSubdirectories: true,
        });

        expect(Object.keys(nb.notes)).toEqual(['inside.md']);
      });
    },
  );
});
