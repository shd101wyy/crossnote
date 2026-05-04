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
