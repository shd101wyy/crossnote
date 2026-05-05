/**
 * Tests for the global #tag reference index.
 *
 * Before this index existed, tag mentions were routed through
 * processWikilink → resolveLink which appended `.md` and resolved the
 * result against the *referrer's* directory.  That meant
 * `notes/foo.md` and `docs/bar.md` both writing `#mytag` indexed under
 * different phantom paths (`notes/mytag.md` vs `docs/mytag.md`) and
 * never unified.  These tests verify that `#tag` is now treated as
 * notebook-global metadata.
 */
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { Notebook } from '../src/notebook';

describe('global #tag reference index', () => {
  let notebookPath: string;

  beforeEach(async () => {
    notebookPath = await fs.mkdtemp(path.join(os.tmpdir(), 'crossnote-tags-'));
  });

  afterEach(async () => {
    await fs.rm(notebookPath, { recursive: true, force: true });
  });

  async function writeNote(relPath: string, content: string) {
    const full = path.join(notebookPath, relPath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content);
  }

  async function makeNotebook(): Promise<Notebook> {
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });
    return nb;
  }

  it('unifies tag mentions across subdirectories under one global key', async () => {
    await writeNote('notes/foo.md', 'Hello #shared\n');
    await writeNote('docs/bar.md', 'World #shared\n');
    const nb = await makeNotebook();

    const tags = nb.getAllTags();
    expect(tags).toContain('shared');
    expect(tags).toHaveLength(1);

    const referrers = nb.tagReferenceMap.getReferrers('shared');
    expect([...referrers.keys()].sort()).toEqual([
      'docs/bar.md',
      'notes/foo.md',
    ]);
  });

  it('case-folds tags so #MyTag and #mytag share an entry', async () => {
    await writeNote('a.md', 'top #MyTag\n');
    await writeNote('b.md', 'bottom #mytag\n');
    const nb = await makeNotebook();

    expect(nb.getAllTags()).toEqual(['mytag']);
    const referrers = nb.tagReferenceMap.getReferrers('myTAG');
    expect(referrers.size).toBe(2);
  });

  it('preserves the original tag content on the Reference token (for display)', async () => {
    await writeNote('a.md', 'hi #MyTag rest\n');
    const nb = await makeNotebook();

    const refs = nb.tagReferenceMap.getReferrers('mytag').get('a.md');
    expect(refs).toBeDefined();
    expect(refs!.length).toBe(1);
    expect(refs![0].kind).toBe('tag');
    expect(refs![0].text).toBe('MyTag');
    expect(refs![0].link).toBe('');
  });

  it('handles nested tags as a single global key (no phantom path)', async () => {
    await writeNote('a.md', 'inbox #parent/child\n');
    const nb = await makeNotebook();

    expect(nb.getAllTags()).toEqual(['parent/child']);
    // Critically: this is NOT in referenceMap as a fake `parent/child.md`.
    expect(nb.referenceMap.map['parent/child.md']).toBeUndefined();
  });

  it('does NOT pollute the file referenceMap with phantom .md paths', async () => {
    await writeNote('a.md', '#alpha #beta\n');
    const nb = await makeNotebook();

    expect(nb.referenceMap.map['alpha.md']).toBeUndefined();
    expect(nb.referenceMap.map['beta.md']).toBeUndefined();
    // The file itself is registered (self-reference for existence check).
    expect(nb.referenceMap.map['a.md']).toBeDefined();
  });

  it("removes a note's tag mentions when its reference info is reset", async () => {
    await writeNote('a.md', '#shared\n');
    await writeNote('b.md', '#shared\n');
    const nb = await makeNotebook();

    expect(nb.tagReferenceMap.getReferrers('shared').size).toBe(2);

    // Simulate `a.md` being edited so it no longer mentions #shared.
    await fs.writeFile(path.join(notebookPath, 'a.md'), 'no tag here');
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });
    expect(nb.tagReferenceMap.getReferrers('shared').size).toBe(1);
    expect([...nb.tagReferenceMap.getReferrers('shared').keys()]).toEqual([
      'b.md',
    ]);
  });

  it('getNotesReferringToTag returns Notes for every referrer', async () => {
    await writeNote('a.md', '# A\n#shared\n');
    await writeNote('b.md', '# B\n#shared\n');
    await writeNote('c.md', '# C\nno tag\n');
    const nb = await makeNotebook();

    const notes = await nb.getNotesReferringToTag('shared');
    expect(Object.keys(notes).sort()).toEqual(['a.md', 'b.md']);
    // Note titles are derived from the basename (lower-cased on disk
    // here), not the heading content — that's the existing crossnote
    // behaviour we just want to confirm doesn't break.
    expect(notes['a.md'].title).toBe('a');
    expect(notes['b.md'].title).toBe('b');
  });

  it('getTagBacklinks shape mirrors getNoteBacklinks', async () => {
    await writeNote('a.md', '# A\nFoo #api here.\n');
    const nb = await makeNotebook();

    const backlinks = await nb.getTagBacklinks('api');
    expect(backlinks).toHaveLength(1);
    expect(backlinks[0].note.filePath).toBe('a.md');
    expect(backlinks[0].references).toHaveLength(1);
    expect(backlinks[0].references[0].kind).toBe('tag');
    expect(backlinks[0].referenceHtmls.length).toBe(1);
  });
});
