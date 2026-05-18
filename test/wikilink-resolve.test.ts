/**
 * Tests for Notebook.resolveWikilink():
 *  - Bug fix: empty currentNoteFilePath no longer escapes above the notebook root
 *  - Enhancement: 'shortest' mode now uses suffix-matching so partial paths
 *    like [[summary/report]] resolve to notes ending with that sub-path
 */
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { Notebook } from '../src/notebook';

describe('resolveWikilink', () => {
  let notebookPath: string;

  beforeEach(async () => {
    notebookPath = await fs.mkdtemp(
      path.join(os.tmpdir(), 'crossnote-resolve-'),
    );
  });

  afterEach(async () => {
    await fs.rm(notebookPath, { recursive: true, force: true });
  });

  async function writeNote(relPath: string, body: string = '') {
    const abs = path.join(notebookPath, relPath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, body);
  }

  async function loaded(): Promise<Notebook> {
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });
    return nb;
  }

  // ──────────────────────────────────────────────────────────────
  // Bug fix: empty currentNoteFilePath must not escape to parent dir
  // ──────────────────────────────────────────────────────────────

  it('relative mode with empty currentNoteFilePath resolves to notebook root', async () => {
    await writeNote('README.md');
    const nb = await loaded();

    // Default mode is 'relative'.  With empty currentNoteFilePath the
    // old code produced '..\\README.md'; after the fix it should be
    // just 'README.md'.
    const result = nb.resolveWikilink('README.md', '');
    expect(result).toBe('README.md');
  });

  it('relative mode with a sub-dir note resolves relative to that dir', async () => {
    await writeNote('docs/guide.md');
    await writeNote('README.md');
    const nb = await loaded();

    const result = nb.resolveWikilink('README.md', 'docs/guide.md');
    // The resolved path is relative to the notebook root.
    // 'docs/guide.md' → dir is 'docs' → path.join(docs, README.md)
    // but README.md lives at root, so relative path goes up one.
    expect(result).toBe(path.join('docs', 'README.md'));
  });

  // ──────────────────────────────────────────────────────────────
  // 'shortest' mode — bare filename (backward compat)
  // ──────────────────────────────────────────────────────────────

  it('shortest mode: bare filename resolves to the unique matching note', async () => {
    await writeNote('deep/nested/report.md');
    const nb = await loaded();
    nb.config.wikiLinkResolution = 'shortest';

    const result = nb.resolveWikilink('report.md', 'other/note.md');
    expect(result).toBe(path.join('deep', 'nested', 'report.md'));
  });

  it('shortest mode: bare filename with multiple matches picks shortest path', async () => {
    await writeNote('a/report.md');
    await writeNote('a/b/c/report.md');
    const nb = await loaded();
    nb.config.wikiLinkResolution = 'shortest';

    const result = nb.resolveWikilink('report.md', 'other/note.md');
    // 'a/report.md' has fewer path segments than 'a/b/c/report.md'
    expect(result).toBe(path.join('a', 'report.md'));
  });

  it('shortest mode: bare filename with ties prefers same-dir note', async () => {
    await writeNote('x/report.md');
    await writeNote('y/report.md');
    const nb = await loaded();
    nb.config.wikiLinkResolution = 'shortest';

    // current note is inside 'x/', so 'x/report.md' should win
    const result = nb.resolveWikilink('report.md', 'x/current.md');
    expect(result).toBe(path.join('x', 'report.md'));
  });

  it('shortest mode: no match falls back to relative resolution', async () => {
    await writeNote('README.md');
    const nb = await loaded();
    nb.config.wikiLinkResolution = 'shortest';

    // 'nonexistent.md' is not in the notes index → relative fallback
    const result = nb.resolveWikilink('nonexistent.md', 'docs/note.md');
    expect(result).toBe(path.join('docs', 'nonexistent.md'));
  });

  // ──────────────────────────────────────────────────────────────
  // 'shortest' mode — suffix-matching (NEW enhancement)
  // ──────────────────────────────────────────────────────────────

  it('shortest mode: partial path [[summary/report]] matches by suffix', async () => {
    await writeNote('projectA/summary/report.md');
    await writeNote('projectB/other.md');
    const nb = await loaded();
    nb.config.wikiLinkResolution = 'shortest';

    const result = nb.resolveWikilink('summary/report.md', 'projectB/other.md');
    expect(result).toBe(path.join('projectA', 'summary', 'report.md'));
  });

  it('shortest mode: exact notebook-relative path resolves unambiguously', async () => {
    await writeNote('projectA/summary/report.md');
    await writeNote('projectB/summary/report.md');
    const nb = await loaded();
    nb.config.wikiLinkResolution = 'shortest';

    // Full path — only one match
    const resultA = nb.resolveWikilink(
      'projectA/summary/report.md',
      'other/note.md',
    );
    expect(resultA).toBe(path.join('projectA', 'summary', 'report.md'));

    const resultB = nb.resolveWikilink(
      'projectB/summary/report.md',
      'other/note.md',
    );
    expect(resultB).toBe(path.join('projectB', 'summary', 'report.md'));
  });

  it('shortest mode: ambiguous partial path picks shortest candidate', async () => {
    await writeNote('projectA/summary/report.md');
    await writeNote('projectB/summary/report.md');
    const nb = await loaded();
    nb.config.wikiLinkResolution = 'shortest';

    // Both match suffix 'summary/report.md'.  They have the same depth
    // (3 segments each), so tiebreak is lexicographic → 'projectA' wins.
    const result = nb.resolveWikilink('summary/report.md', 'other/note.md');
    expect(result).toBe(path.join('projectA', 'summary', 'report.md'));
  });

  it('shortest mode: partial path no match falls back to relative resolution', async () => {
    await writeNote('README.md');
    const nb = await loaded();
    nb.config.wikiLinkResolution = 'shortest';

    const result = nb.resolveWikilink('ghost/nonexistent.md', 'docs/note.md');
    expect(result).toBe(path.join('docs', 'ghost', 'nonexistent.md'));
  });
});
