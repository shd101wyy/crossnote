/**
 * Regression tests for #481: `deleteNote(path, true)` used to unlink the
 * path even though the second argument means "the caller already deleted
 * the file". When Git removed and then recreated a file during a checkout,
 * the delayed deletion notification from the file watcher deleted the
 * replacement file — data loss reported as unstaged deletions in
 * `git status`.
 */
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { Notebook } from '../src/notebook';

describe('Notebook.deleteNote', () => {
  let notebookPath: string;

  beforeEach(async () => {
    const base = await fs.mkdtemp(
      path.join(os.tmpdir(), 'crossnote-delete-note-'),
    );
    notebookPath = base;
    await fs.writeFile(path.join(notebookPath, 'note.md'), '# My Note\n');
  });

  afterEach(async () => {
    await fs.rm(notebookPath, { recursive: true, force: true });
  });

  async function loadedNotebook(): Promise<Notebook> {
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });
    return nb;
  }

  test('alreadyDeleted: true keeps a file that exists at the path (e.g. recreated by Git)', async () => {
    const nb = await loadedNotebook();
    expect(nb.notes['note.md']).toBeTruthy();

    await nb.deleteNote('note.md', true);

    // The file must survive — only the internal bookkeeping is refreshed.
    expect(await fs.readFile(path.join(notebookPath, 'note.md'), 'utf8')).toBe(
      '# My Note\n',
    );
    expect(nb.notes['note.md']).toBeUndefined();
  });

  test('alreadyDeleted: true on a missing file resolves without throwing', async () => {
    const nb = await loadedNotebook();
    await fs.rm(path.join(notebookPath, 'note.md'));

    await expect(nb.deleteNote('note.md', true)).resolves.toBeUndefined();
    expect(nb.notes['note.md']).toBeUndefined();
  });

  test('alreadyDeleted: false (default) deletes the file from disk', async () => {
    const nb = await loadedNotebook();

    await nb.deleteNote('note.md');

    await expect(fs.stat(path.join(notebookPath, 'note.md'))).rejects.toThrow();
    expect(nb.notes['note.md']).toBeUndefined();
  });

  test('alreadyDeleted: false on a missing file resolves without throwing', async () => {
    const nb = await loadedNotebook();
    await fs.rm(path.join(notebookPath, 'note.md'));

    await expect(nb.deleteNote('note.md')).resolves.toBeUndefined();
    expect(nb.notes['note.md']).toBeUndefined();
  });
});
