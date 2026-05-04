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

  it('Note struct holds metadata and reference graph, not body', async () => {
    await writeNote('a.md', '# A\n\nLinks to [[b]] and uses #shared\n');
    await writeNote('b.md', '# B\n\nLinks back to [[a]] and uses #shared\n');

    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    // Cached struct has metadata + reference graph.
    expect(nb.notes['a.md']).toBeDefined();
    expect(nb.notes['a.md'].title).toBe('a');
    // The body is not on the Note (compile-time enforced — `Note`
    // has no `markdown` field).  Runtime sanity: confirm no rogue
    // property leaked through.
    expect(
      (nb.notes['a.md'] as unknown as Record<string, unknown>).markdown,
    ).toBeUndefined();
    expect(
      (nb.notes['b.md'] as unknown as Record<string, unknown>).markdown,
    ).toBeUndefined();

    // Reference / tag indices were built from the bodies during the
    // single-pass walk; the side effects survived the body falling
    // out of scope.
    expect(nb.tagReferenceMap.getReferrers('shared').size).toBe(2);
    expect(nb.referenceMap.map['a.md']).toBeDefined();
    expect(nb.referenceMap.map['b.md']).toBeDefined();
  });

  it('getNoteMarkdown reads the body from disk on demand', async () => {
    await writeNote('a.md', '# A\n\nOriginal body.\n');
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    // Body is never cached on the Note struct; getNoteMarkdown is
    // the canonical fetch path.
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
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    // The lazy loader applies front-matter normalisation: strips the
    // recognized note-config keys but leaves arbitrary user keys
    // (like `title` / `tags`) in place.
    const lazyBody = await nb.getNoteMarkdown('fm.md');
    expect(lazyBody).not.toBeNull();
    expect(lazyBody).not.toContain('created:');
    expect(lazyBody).not.toContain('pinned:');
    expect(lazyBody).not.toContain('aliases:');
    expect(lazyBody).toContain('title:');
    expect(lazyBody).toContain('tags:');
    expect(lazyBody).toContain('# Body heading');
    expect(lazyBody).toContain('[[link]]');

    // Two consecutive lazy reads return identical content (idempotent).
    const lazyBodyAgain = await nb.getNoteMarkdown('fm.md');
    expect(lazyBodyAgain).toBe(lazyBody);

    // Front-matter-derived NoteConfig landed in the cached struct.
    expect(nb.notes['fm.md'].config.aliases).toEqual(['Note A']);
    expect(nb.notes['fm.md'].config.pinned).toBe(true);
  });

  it('refreshNotes({ refreshRelations: false }) also keeps cache lean', async () => {
    await writeNote('a.md', '# A\n\nBody.\n');
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });
    await nb.refreshNotes({
      dir: '.',
      includeSubdirectories: true,
      refreshRelations: false,
    });
    expect(nb.notes['a.md']).toBeDefined();
    // Body is fundamentally not on the Note — type-checked.
    expect(
      (nb.notes['a.md'] as unknown as Record<string, unknown>).markdown,
    ).toBeUndefined();
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

describe('Reference html pre-rendering', () => {
  let notebookPath: string;

  beforeEach(async () => {
    notebookPath = await fs.mkdtemp(path.join(os.tmpdir(), 'crossnote-href-'));
  });

  afterEach(async () => {
    await fs.rm(notebookPath, { recursive: true, force: true });
  });

  async function writeNote(name: string, body: string) {
    await fs.writeFile(path.join(notebookPath, name), body);
  }

  it('References carry pre-rendered html instead of markdown-it Tokens', async () => {
    await writeNote('a.md', '# A\n\nSee [[b]] and #shared here.\n');
    await writeNote('b.md', '# B\n\n');

    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    // File-link reference (a.md -> b.md).
    const refs = await nb.getReferences('b.md', 'a.md');
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(typeof ref.html).toBe('string');
      expect(ref.html.length).toBeGreaterThan(0);
      // Token fields are gone — explicit check so future regressions
      // (e.g. someone re-adding parentToken for a "convenience" reason)
      // get caught.
      expect(
        (ref as unknown as Record<string, unknown>).parentToken,
      ).toBeUndefined();
      expect((ref as unknown as Record<string, unknown>).token).toBeUndefined();
    }

    // Tag reference: the `#shared` mention in a.md.
    const tagRefs = nb.tagReferenceMap.getReferrers('shared').get('a.md');
    expect(tagRefs).toBeDefined();
    expect(tagRefs!.length).toBe(1);
    expect(tagRefs![0].html).toContain('class="tag"');
    expect(tagRefs![0].html).toContain('shared');
  });

  it('getNoteBacklinks returns the pre-rendered html unchanged', async () => {
    await writeNote('a.md', '# A\n\nLinking to [[b]] for context.\n');
    await writeNote('b.md', '# B\n\n');

    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    const backlinks = await nb.getNoteBacklinks('b.md');
    expect(backlinks.length).toBe(1);
    expect(backlinks[0].referenceHtmls.length).toBeGreaterThan(0);
    // The pre-rendered html should match what's stored on the
    // reference itself — no second render pass at panel time.
    expect(backlinks[0].referenceHtmls[0]).toBe(
      backlinks[0].references[0].html,
    );
    expect(backlinks[0].referenceHtmls[0]).toContain('Linking to');
  });

  it('Reference.sourceLine carries the parent paragraph line for click-through', async () => {
    // Three lines of body before the wikilink so we can pin down the
    // line number — markdown-it counts source lines from 0, with the
    // frontmatter-stripped content going through the source-map plugin.
    await writeNote(
      'a.md',
      '# A\n\nLine one.\n\nLine two.\n\nSee [[b]] on line six.\n',
    );
    await writeNote('b.md', '# B\n\n');

    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    const refs = await nb.getReferences('b.md', 'a.md');
    expect(refs.length).toBe(1);
    // Line is zero-based; we just assert it's a number and not 0
    // (the wikilink isn't on the first line).
    expect(typeof refs[0].sourceLine).toBe('number');
    expect(refs[0].sourceLine).toBeGreaterThan(0);
  });
});

describe('refreshNotesIncremental', () => {
  let notebookPath: string;

  beforeEach(async () => {
    notebookPath = await fs.mkdtemp(path.join(os.tmpdir(), 'crossnote-inc-'));
  });

  afterEach(async () => {
    await fs.rm(notebookPath, { recursive: true, force: true });
  });

  async function writeNote(name: string, body: string) {
    await fs.writeFile(path.join(notebookPath, name), body);
  }

  async function bumpMtime(name: string, futureMs: number) {
    // Force the mtime forward so the incremental walk sees a strictly
    // newer value than the last recorded `processedMtimes` entry —
    // matches what happens after a real edit + save on most file
    // systems, just deterministic and instant.
    const target = new Date(Date.now() + futureMs);
    await fs.utimes(path.join(notebookPath, name), target, target);
  }

  it('detects newly added files', async () => {
    await writeNote('a.md', '# A\n\n');
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });
    expect(Object.keys(nb.notes)).toEqual(['a.md']);

    // Add a new file post-refresh.
    await writeNote('b.md', '# B\n\nLinks to [[a]]\n');
    await nb.refreshNotesIncremental({
      dir: '.',
      includeSubdirectories: true,
    });
    expect(Object.keys(nb.notes).sort()).toEqual(['a.md', 'b.md']);
    // The new file's wikilink to `a` is reflected in the reference graph.
    expect(nb.referenceMap.map['a.md']?.['b.md']).toBeDefined();
  });

  it('re-processes a file whose content (and mtime) changed', async () => {
    await writeNote('a.md', '# A\n\nLinks to [[b]]\n');
    await writeNote('b.md', '# B\n\n');
    await writeNote('c.md', '# C\n\n');

    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });
    expect(nb.referenceMap.map['b.md']?.['a.md']).toBeDefined();
    expect(nb.referenceMap.map['c.md']?.['a.md']).toBeUndefined();

    // Rewrite a.md to point at c.md instead of b.md, then bump mtime.
    await writeNote('a.md', '# A\n\nLinks to [[c]] now\n');
    await bumpMtime('a.md', 60_000);

    await nb.refreshNotesIncremental({
      dir: '.',
      includeSubdirectories: true,
    });

    // The old wikilink target is gone, the new one is in.
    expect(nb.referenceMap.map['b.md']?.['a.md']).toBeUndefined();
    expect(nb.referenceMap.map['c.md']?.['a.md']).toBeDefined();
  });

  it('removes a deleted file from the cache and reference graph', async () => {
    await writeNote('a.md', '# A\n\nLinks to [[b]] and uses #shared\n');
    await writeNote('b.md', '# B\n\n');
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });
    expect(nb.tagReferenceMap.getReferrers('shared').size).toBe(1);

    await fs.unlink(path.join(notebookPath, 'a.md'));
    await nb.refreshNotesIncremental({
      dir: '.',
      includeSubdirectories: true,
    });

    expect(nb.notes['a.md']).toBeUndefined();
    // Tag references contributed by the deleted file are gone.
    expect(nb.tagReferenceMap.getReferrers('shared').size).toBe(0);
    // File references too (a.md -> b.md should be gone).
    expect(nb.referenceMap.map['b.md']?.['a.md']).toBeUndefined();
  });

  it('skips re-processing files whose mtime is unchanged', async () => {
    await writeNote('a.md', '# A\n\nUses #shared\n');
    await writeNote('b.md', '# B\n\nUses #shared too\n');

    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    // Snapshot the references-by-identity for both notes.  If we
    // re-process either, its `Reference[]` array is freshly allocated
    // and the identity check fails.
    const aRefsBefore = nb.tagReferenceMap.getReferrers('shared').get('a.md');
    const bRefsBefore = nb.tagReferenceMap.getReferrers('shared').get('b.md');
    expect(aRefsBefore).toBeDefined();
    expect(bRefsBefore).toBeDefined();

    // No file edits.  Incremental refresh should skip both.
    await nb.refreshNotesIncremental({
      dir: '.',
      includeSubdirectories: true,
    });

    const aRefsAfter = nb.tagReferenceMap.getReferrers('shared').get('a.md');
    const bRefsAfter = nb.tagReferenceMap.getReferrers('shared').get('b.md');
    // Same array reference == we didn't re-process and rebuild.
    expect(aRefsAfter).toBe(aRefsBefore);
    expect(bRefsAfter).toBe(bRefsBefore);
  });

  it('only re-processes the file whose mtime advanced', async () => {
    await writeNote('a.md', '# A\n\nUses #shared\n');
    await writeNote('b.md', '# B\n\nUses #shared too\n');
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    const aRefsBefore = nb.tagReferenceMap.getReferrers('shared').get('a.md');
    const bRefsBefore = nb.tagReferenceMap.getReferrers('shared').get('b.md');

    // Edit only a.md.
    await writeNote('a.md', '# A\n\nNow uses #shared and #other\n');
    await bumpMtime('a.md', 60_000);

    await nb.refreshNotesIncremental({
      dir: '.',
      includeSubdirectories: true,
    });

    const aRefsAfter = nb.tagReferenceMap.getReferrers('shared').get('a.md');
    const bRefsAfter = nb.tagReferenceMap.getReferrers('shared').get('b.md');
    // a.md was re-processed (fresh array), b.md was not (same reference).
    expect(aRefsAfter).not.toBe(aRefsBefore);
    expect(bRefsAfter).toBe(bRefsBefore);
    // The new tag from the edited file showed up.
    expect(nb.tagReferenceMap.getReferrers('other').has('a.md')).toBe(true);
  });
});
