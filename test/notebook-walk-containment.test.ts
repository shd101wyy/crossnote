/**
 * Containment guarantees for the note-index walk (#2376 in
 * vscode-markdown-preview-enhanced):
 *
 * 1. A notebook rooted at a filesystem root (`/`) must never walk —
 *    indexing it would stat/read files across the whole machine.
 * 2. The walk must not follow symbolic links out of the notebook root
 *    (a symlinked directory previously let the walk escape the
 *    workspace entirely).
 */
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { FileSystemApi, Notebook } from '../src/notebook';

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
