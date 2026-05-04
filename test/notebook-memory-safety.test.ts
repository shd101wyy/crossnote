/**
 * Correctness + memory-safety tests for the notebook indexing layer.
 *
 *   - refreshNotes serialises with a Mutex so concurrent callers
 *     can't interleave the wipe-and-rebuild cycle.
 *   - maxNoteFileSize keeps unbounded checked-in files (huge log /
 *     data dumps with a `.md` extension) out of the in-memory
 *     index.
 */
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { Notebook } from '../src/notebook';

describe('Notebook concurrency', () => {
  let notebookPath: string;

  beforeEach(async () => {
    notebookPath = await fs.mkdtemp(path.join(os.tmpdir(), 'crossnote-conc-'));
  });

  afterEach(async () => {
    await fs.rm(notebookPath, { recursive: true, force: true });
  });

  it('serialises concurrent refreshNotes calls', async () => {
    // Set up a few notes with cross-references so the rebuild has
    // some real work to do.
    for (let i = 0; i < 5; i++) {
      await fs.writeFile(
        path.join(notebookPath, `note${i}.md`),
        `# Note ${i}\n\nLinks to [[note${(i + 1) % 5}]] and uses #shared\n`,
      );
    }
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });

    // Three concurrent refresh-and-rebuild calls.  Without the
    // refreshNotesMutex the second/third would wipe the indices
    // mid-rebuild of the first, leaving a corrupted state.
    await Promise.all([
      nb.refreshNotes({ dir: '.', includeSubdirectories: true }),
      nb.refreshNotes({ dir: '.', includeSubdirectories: true }),
      nb.refreshNotes({ dir: '.', includeSubdirectories: true }),
    ]);

    expect(Object.keys(nb.notes).sort()).toEqual([
      'note0.md',
      'note1.md',
      'note2.md',
      'note3.md',
      'note4.md',
    ]);
    // Every note links to the next, so each appears exactly once as a
    // referrer of the next.  Tag #shared should have all 5 referrers.
    expect(nb.tagReferenceMap.getReferrers('shared').size).toBe(5);
    // Every wikilink target is in the file referenceMap.  Each note
    // is referenced by the previous one in the ring.
    for (let i = 0; i < 5; i++) {
      const target = `note${i}.md`;
      const referrers = nb.referenceMap.map[target];
      expect(referrers).toBeDefined();
      const prev = `note${(i + 4) % 5}.md`;
      expect(Object.keys(referrers)).toContain(prev);
    }
  });
});

describe('Notebook maxNoteFileSize', () => {
  let notebookPath: string;

  beforeEach(async () => {
    notebookPath = await fs.mkdtemp(path.join(os.tmpdir(), 'crossnote-cap-'));
  });

  afterEach(async () => {
    await fs.rm(notebookPath, { recursive: true, force: true });
  });

  async function writeNote(name: string, body: string) {
    await fs.writeFile(path.join(notebookPath, name), body);
  }

  it('skips files larger than maxNoteFileSize', async () => {
    await writeNote('small.md', '# Small\n\nNormal-sized note.\n');
    // 200 KB of body — large enough to exceed our 100 KB cap below.
    await writeNote('big.md', '# Big\n' + 'x'.repeat(200 * 1024));

    const nb = await Notebook.init({
      notebookPath,
      config: {
        markdownParser: 'markdown-it',
        maxNoteFileSize: 100 * 1024,
      },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    expect(Object.keys(nb.notes)).toContain('small.md');
    expect(Object.keys(nb.notes)).not.toContain('big.md');
  });

  it('still loads files at exactly the cap', async () => {
    // Body that produces a file < 1 KB total
    await writeNote('edge.md', 'tiny');
    const stats = await fs.stat(path.join(notebookPath, 'edge.md'));

    const nb = await Notebook.init({
      notebookPath,
      config: {
        markdownParser: 'markdown-it',
        maxNoteFileSize: stats.size, // exactly equal — should pass
      },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    expect(Object.keys(nb.notes)).toContain('edge.md');
  });

  it('disables the cap when maxNoteFileSize is 0', async () => {
    await writeNote('big.md', '# Big\n' + 'y'.repeat(50 * 1024));

    const nb = await Notebook.init({
      notebookPath,
      config: {
        markdownParser: 'markdown-it',
        maxNoteFileSize: 0,
      },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    expect(Object.keys(nb.notes)).toContain('big.md');
  });

  it('uses a 5 MiB default when no cap is configured', async () => {
    await writeNote('normal.md', '# Normal note\n\nBody.\n');
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    expect(Object.keys(nb.notes)).toContain('normal.md');
  });
});

describe('Notebook lazy markdown loading', () => {
  let notebookPath: string;

  beforeEach(async () => {
    notebookPath = await fs.mkdtemp(path.join(os.tmpdir(), 'crossnote-lazy-'));
  });

  afterEach(async () => {
    await fs.rm(notebookPath, { recursive: true, force: true });
  });

  async function writeNote(name: string, body: string) {
    await fs.writeFile(path.join(notebookPath, name), body);
  }

  it('evicts note.markdown from cache after refresh', async () => {
    await writeNote('a.md', '# A\n\nLinks to [[b]] and uses #shared\n');
    await writeNote('b.md', '# B\n\nLinks back to [[a]] and uses #shared\n');

    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    // Cached struct still has metadata + reference graph.
    expect(nb.notes['a.md']).toBeDefined();
    expect(nb.notes['a.md'].title).toBe('a');
    // But the body is no longer pinned in memory.
    expect(nb.notes['a.md'].markdown).toBeUndefined();
    expect(nb.notes['b.md'].markdown).toBeUndefined();

    // Reference / tag indices were built from the (now-evicted) bodies,
    // so the side effects survived the eviction.
    expect(nb.tagReferenceMap.getReferrers('shared').size).toBe(2);
    expect(nb.referenceMap.map['a.md']).toBeDefined();
    expect(nb.referenceMap.map['b.md']).toBeDefined();
  });

  it('getNoteMarkdown lazy-reads the body from disk on demand', async () => {
    await writeNote('a.md', '# A\n\nOriginal body.\n');
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    // Cache is empty; getNoteMarkdown re-reads from disk.
    expect(nb.notes['a.md'].markdown).toBeUndefined();
    const md = await nb.getNoteMarkdown('a.md');
    expect(md).toContain('Original body.');
  });

  it('getNoteMarkdown reflects on-disk edits without a cache refresh', async () => {
    await writeNote('a.md', '# A\n\nFirst body.\n');
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    expect(await nb.getNoteMarkdown('a.md')).toContain('First body.');

    // Edit on disk after the refresh.  Because the cache no longer
    // pins the body, getNoteMarkdown picks up the new content on the
    // next call without needing refreshNotes to fire first.
    await writeNote('a.md', '# A\n\nSecond body.\n');

    const md = await nb.getNoteMarkdown('a.md');
    expect(md).toContain('Second body.');
    expect(md).not.toContain('First body.');
  });

  it('getNoteMarkdown returns the same front-matter-normalised body as getNote', async () => {
    // Front-matter normalisation is non-trivial: getNote() runs the
    // body through `matter()` and re-stringifies with note-config keys
    // (created/modified/pinned/favorited/icon/aliases) stripped out.
    // The lazy-reload path needs to apply the same transform so callers
    // see consistent content regardless of cache state.
    await writeNote(
      'fm.md',
      [
        '---',
        'title: Notebook entry',
        'created: 2024-01-15',
        'pinned: true',
        'aliases:',
        '  - Note A',
        'tags:',
        '  - personal',
        '---',
        '',
        '# Body heading',
        '',
        'Some [[link]] here.',
      ].join('\n'),
    );

    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    // First, capture the body that getNote produces — load with
    // refreshNoteRelations: true so we hit the disk-read + normalise
    // path.  The cached struct has its body stripped right after, but
    // the returned object still carries it.
    const fresh = await nb.getNote('fm.md', true);
    expect(fresh).not.toBeNull();
    const expectedBody = fresh!.markdown!;

    // Now read via the lazy loader.  Cache was evicted, so this re-reads
    // from disk and should apply the identical normalisation.
    expect(nb.notes['fm.md'].markdown).toBeUndefined();
    const lazyBody = await nb.getNoteMarkdown('fm.md');
    expect(lazyBody).toBe(expectedBody);
    // Sanity: the recognized note-config keys were stripped from
    // front-matter; non-recognised ones (`title`, `tags`) survived.
    expect(lazyBody).not.toContain('created:');
    expect(lazyBody).not.toContain('pinned:');
    expect(lazyBody).not.toContain('aliases:');
    expect(lazyBody).toContain('title:');
    expect(lazyBody).toContain('tags:');
    expect(lazyBody).toContain('# Body heading');
    expect(lazyBody).toContain('[[link]]');
    // Front-matter-derived NoteConfig still landed in the cached struct.
    expect(nb.notes['fm.md'].config.aliases).toEqual(['Note A']);
    expect(nb.notes['fm.md'].config.pinned).toBe(true);
  });

  it('refreshNotes({ refreshRelations: false }) also evicts bodies', async () => {
    await writeNote('a.md', '# A\n\nBody.\n');
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    // First, do a normal refresh to populate everything, then call
    // again with refreshRelations: false (the lightweight path that
    // skips mentions extraction).  The eviction invariant should still
    // hold afterwards.
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });
    await nb.refreshNotes({
      dir: '.',
      includeSubdirectories: true,
      refreshRelations: false,
    });
    expect(nb.notes['a.md']).toBeDefined();
    expect(nb.notes['a.md'].markdown).toBeUndefined();
  });

  it('getNoteMarkdown returns null for missing / non-markdown / oversized files', async () => {
    await writeNote('big.md', '# big\n' + 'x'.repeat(50 * 1024));
    await writeNote('image.png', 'fake png bytes');

    const nb = await Notebook.init({
      notebookPath,
      config: {
        markdownParser: 'markdown-it',
        maxNoteFileSize: 10 * 1024,
      },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    expect(await nb.getNoteMarkdown('does-not-exist.md')).toBeNull();
    expect(await nb.getNoteMarkdown('image.png')).toBeNull();
    expect(await nb.getNoteMarkdown('big.md')).toBeNull();
  });
});
