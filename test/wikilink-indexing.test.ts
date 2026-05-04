/**
 * Tests for how processNoteMentionsAndMentionedBy populates the
 * referenceMap when a wikilink has a fragment or points at a
 * non-markdown file.
 *
 * Both bugs (graph view ghost nodes for `README.md#^abc.md` and
 * `25920.jpg.md`) came from the same place: resolveLink blindly
 * appended `.md` to anything that didn't end with `.md`, even when
 * the trailing characters were a URL fragment or a real file
 * extension.
 */
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { Notebook } from '../src/notebook';

describe('wikilink indexing', () => {
  let notebookPath: string;

  beforeEach(async () => {
    notebookPath = await fs.mkdtemp(
      path.join(os.tmpdir(), 'crossnote-wikilink-'),
    );
  });

  afterEach(async () => {
    await fs.rm(notebookPath, { recursive: true, force: true });
  });

  async function writeNote(name: string, body: string) {
    await fs.writeFile(path.join(notebookPath, name), body);
  }

  async function loaded(): Promise<Notebook> {
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it' },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });
    return nb;
  }

  it('indexes [[Note#^block]] under the bare file path, not a phantom .md', async () => {
    await writeNote('README.md', 'Body. ^abc\n');
    await writeNote('TEST.md', 'See [[README#^abc]] here.\n');
    const nb = await loaded();

    expect(nb.referenceMap.map['README.md']).toBeDefined();
    expect(nb.referenceMap.map['README.md']['TEST.md']).toHaveLength(1);

    // The phantom key the old code produced — must not exist.
    expect(nb.referenceMap.map['README.md#^abc.md']).toBeUndefined();
    expect(nb.referenceMap.map['README.md#^abc']).toBeUndefined();
  });

  it('indexes [[Note#Heading]] under the bare file path', async () => {
    await writeNote('README.md', '# Setup\n\nBody.\n');
    await writeNote('TEST.md', 'See [[README#Setup]] here.\n');
    const nb = await loaded();

    expect(nb.referenceMap.map['README.md']).toBeDefined();
    expect(nb.referenceMap.map['README.md']['TEST.md']).toHaveLength(1);
    expect(nb.referenceMap.map['README.md#Setup.md']).toBeUndefined();
    expect(nb.referenceMap.map['README.md#Setup']).toBeUndefined();
  });

  it('indexes combined [[Note#Heading^block]] under the bare file path', async () => {
    await writeNote('README.md', '# Setup\n\nBody. ^abc\n');
    await writeNote('TEST.md', 'See [[README#Setup^abc]].\n');
    const nb = await loaded();

    expect(nb.referenceMap.map['README.md']).toBeDefined();
    expect(nb.referenceMap.map['README.md']['TEST.md']).toHaveLength(1);
    // No phantom paths
    expect(
      Object.keys(nb.referenceMap.map).some(
        (k) => k.includes('#') || k.includes('^'),
      ),
    ).toBe(false);
  });

  it('does NOT index image wikilinks as note nodes', async () => {
    await writeNote('IMG.md', '![[./photo.jpg]]\n');
    const nb = await loaded();

    expect(nb.referenceMap.map['photo.jpg.md']).toBeUndefined();
    expect(nb.referenceMap.map['photo.jpg']).toBeUndefined();
    // The note itself is registered (self-reference for existence check).
    // Only the IMG.md entry should be present.
    const keys = Object.keys(nb.referenceMap.map);
    expect(keys).toContain('IMG.md');
    expect(keys.filter((k) => /\.(jpg|png|pdf)/.test(k))).toEqual([]);
  });

  it('does NOT index PDF / other attachment wikilinks', async () => {
    await writeNote('paper.md', '![[./reading-list.pdf]]\n');
    const nb = await loaded();
    const keys = Object.keys(nb.referenceMap.map);
    expect(keys).not.toContain('reading-list.pdf.md');
    expect(keys).not.toContain('reading-list.pdf');
  });

  it('still indexes plain [[Note]] (no fragment, .md auto-extended)', async () => {
    await writeNote('README.md', '# README\n');
    await writeNote('TEST.md', 'See [[README]] here.\n');
    const nb = await loaded();

    expect(nb.referenceMap.map['README.md']['TEST.md']).toHaveLength(1);
  });

  it('still indexes [[Note.md]] (extension already present)', async () => {
    await writeNote('README.md', '# README\n');
    await writeNote('TEST.md', 'See [[README.md]] here.\n');
    const nb = await loaded();

    expect(nb.referenceMap.map['README.md']['TEST.md']).toHaveLength(1);
  });

  it('records the bare file path on Reference.link', async () => {
    await writeNote('README.md', 'Body. ^abc\n');
    await writeNote('TEST.md', 'See [[README#^abc]].\n');
    const nb = await loaded();

    const refs = nb.referenceMap.getReferences('README.md', 'TEST.md');
    expect(refs).toHaveLength(1);
    expect(refs[0].link).toBe('README.md');
  });

  it('honours markdownFileExtensions: .markdown is treated as a note', async () => {
    await writeNote('README.markdown', '# README\n');
    await writeNote('TEST.markdown', 'See [[README]] here.\n');

    const nb = await Notebook.init({
      notebookPath,
      config: {
        markdownParser: 'markdown-it',
        markdownFileExtensions: ['.markdown'],
        wikiLinkTargetFileExtension: '.markdown',
      },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    expect(nb.referenceMap.map['README.markdown']).toBeDefined();
    expect(
      nb.referenceMap.map['README.markdown']['TEST.markdown'],
    ).toHaveLength(1);
    // No phantom ".md"-suffixed key
    expect(nb.referenceMap.map['README.markdown.md']).toBeUndefined();
  });

  it('handles a [[Note.markdown]] explicit extension', async () => {
    await writeNote('README.markdown', '# README\n');
    await writeNote('TEST.md', 'See [[README.markdown]] here.\n');
    const nb = await Notebook.init({
      notebookPath,
      config: {
        markdownParser: 'markdown-it',
        markdownFileExtensions: ['.md', '.markdown'],
      },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    expect(nb.referenceMap.map['README.markdown']).toBeDefined();
    expect(nb.referenceMap.map['README.markdown']['TEST.md']).toHaveLength(1);
  });
});
