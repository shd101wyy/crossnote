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

  it('strips the configured extension when deriving the note title', async () => {
    // Pre-fix, `title: path.basename(absFilePath).replace(/\.md$/, '')`
    // only removed literal `.md`, so a `.markdown` / `.mdx` / `.qmd`
    // notebook ended up with titles like `readme.markdown`.  That
    // title flows into search and the Backlinks panel label.
    await writeNote('README.markdown', '# README\n');
    await writeNote('notes.mdx', '# Notes\n');
    await writeNote('plain.md', '# Plain\n');

    const nb = await Notebook.init({
      notebookPath,
      config: {
        markdownParser: 'markdown-it',
        markdownFileExtensions: ['.md', '.markdown', '.mdx'],
      },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });

    expect(nb.notes['README.markdown'].title).toBe('README');
    expect(nb.notes['notes.mdx'].title).toBe('notes');
    expect(nb.notes['plain.md'].title).toBe('plain');
  });
});

describe('wikilink resolution modes', () => {
  let notebookPath: string;

  beforeEach(async () => {
    notebookPath = await fs.mkdtemp(
      path.join(os.tmpdir(), 'crossnote-wikilink-resolution-'),
    );
  });

  afterEach(async () => {
    await fs.rm(notebookPath, { recursive: true, force: true });
  });

  async function writeNote(name: string, body: string) {
    const fullPath = path.join(notebookPath, name);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, body);
  }

  async function loaded(
    config: Record<string, unknown> = {},
  ): Promise<Notebook> {
    const nb = await Notebook.init({
      notebookPath,
      config: { markdownParser: 'markdown-it', ...config },
    });
    await nb.refreshNotes({ dir: '.', includeSubdirectories: true });
    return nb;
  }

  describe('resolveWikilink', () => {
    it('resolves a unique bare filename in shortest mode', async () => {
      await writeNote('concepts/SCADA.md', '# SCADA');
      await writeNote('summaries/project.md', '# Project');
      await writeNote('notes/root.md', '[[SCADA]]');

      const nb = await loaded({ wikiLinkResolution: 'shortest' });

      expect(nb.resolveWikilink('SCADA', 'notes/root.md')).toBe(
        'concepts/SCADA.md',
      );
    });

    it('prefers shortest path when duplicate filenames exist', async () => {
      await writeNote('SCADA.md', '# Top-level');
      await writeNote('concepts/SCADA.md', '# Nested');
      await writeNote('notes/root.md', '[[SCADA]]');

      const nb = await loaded({ wikiLinkResolution: 'shortest' });

      // Root-level SCADA.md (depth 1) is shorter than
      // concepts/SCADA.md (depth 2).
      expect(nb.resolveWikilink('SCADA', 'notes/root.md')).toBe('SCADA.md');
    });

    it('prefers note in same directory when shortest paths are tied', async () => {
      await writeNote('a/Note.md', '# A');
      await writeNote('b/Note.md', '# B');
      await writeNote('a/current.md', '[[Note]]');

      const nb = await loaded({ wikiLinkResolution: 'shortest' });

      // Both are depth 2.  current.md is in a/, so a/Note.md wins.
      expect(nb.resolveWikilink('Note', 'a/current.md')).toBe('a/Note.md');
    });

    it('falls back to alphabetical when tied and neither is in same dir', async () => {
      await writeNote('a/Note.md', '# A');
      await writeNote('b/Note.md', '# B');
      await writeNote('c/root.md', '[[Note]]');

      const nb = await loaded({ wikiLinkResolution: 'shortest' });

      // Both depth 2, neither in c/.  a/ sorts before b/.
      expect(nb.resolveWikilink('Note', 'c/root.md')).toBe('a/Note.md');
    });

    it('falls back to relative when no match found in shortest mode', async () => {
      await writeNote('concepts/SCADA.md', '# SCADA');
      await writeNote('notes/root.md', '[[Nonexistent]]');

      const nb = await loaded({ wikiLinkResolution: 'shortest' });

      // No note named 'Nonexistent.md' — fall back to relative.
      expect(nb.resolveWikilink('Nonexistent', 'notes/root.md')).toBe(
        'notes/Nonexistent.md',
      );
    });

    it('resolves from notebook root in absolute mode', async () => {
      await writeNote('sub/Note.md', '# Note');
      await writeNote('sub/deep/root.md', '[[Note]]');

      const nb = await loaded({ wikiLinkResolution: 'absolute' });

      // Absolute mode resolves from the notebook root.  Bare
      // `Note` → `Note.md`, not `sub/deep/Note.md` and not
      // `sub/Note.md` (which would require a directory prefix).
      expect(nb.resolveWikilink('Note', 'sub/deep/root.md')).toBe('Note.md');
    });

    it('resolves relative to current dir in relative mode', async () => {
      await writeNote('sub/Note.md', '# Note');
      await writeNote('sub/deep/root.md', '[[Note]]');

      const nb = await loaded({ wikiLinkResolution: 'relative' });

      // Relative from sub/deep/ → Note.md doesn't exist there.
      expect(nb.resolveWikilink('Note', 'sub/deep/root.md')).toBe(
        'sub/deep/Note.md',
      );
    });

    it('resolves /-prefixed links from root regardless of mode', async () => {
      await writeNote('concepts/SCADA.md', '# SCADA');
      await writeNote('notes/root.md', '[[/concepts/SCADA]]');

      for (const mode of ['shortest', 'relative', 'absolute'] as const) {
        const nb = await loaded({ wikiLinkResolution: mode });
        expect(nb.resolveWikilink('/concepts/SCADA', 'notes/root.md')).toBe(
          'concepts/SCADA.md',
        );
      }
    });

    it('appends the configured file extension when missing', async () => {
      await writeNote('concepts/SCADA.md', '# SCADA');
      await writeNote('notes/root.md', '[[SCADA]]');

      const nb = await loaded({
        wikiLinkResolution: 'shortest',
        wikiLinkTargetFileExtension: '.md',
      });

      expect(nb.resolveWikilink('SCADA', 'notes/root.md')).toBe(
        'concepts/SCADA.md',
      );
    });
  });

  describe('referenceMap with shortest mode', () => {
    it('indexes [[filename]] pointing to a note in another directory', async () => {
      await writeNote('concepts/SCADA.md', '# SCADA');
      await writeNote('summaries/project.md', 'See [[SCADA]].');

      const nb = await loaded({ wikiLinkResolution: 'shortest' });

      // The referenceMap key should be the resolved path, not a
      // phantom relative path from the referrer's directory.
      expect(nb.referenceMap.map['concepts/SCADA.md']).toBeDefined();
      expect(
        nb.referenceMap.map['concepts/SCADA.md']['summaries/project.md'],
      ).toHaveLength(1);
      expect(nb.referenceMap.map['summaries/SCADA.md']).toBeUndefined();
    });
  });
});
