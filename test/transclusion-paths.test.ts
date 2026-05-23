import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Notebook } from '../src/notebook/index';

/**
 * Cross-product test: 6 working transclusion syntaxes × 8 path/filename
 * variations × {heading, block} = 96 cases.  Each case must produce
 * content that contains the expected heading or block text and does NOT
 * contain text from outside the slice.
 */
describe('transclusion path variations', () => {
  const ORIGIN_BODY = `### Top\n\n#### Colours\n\nRoses are red.\n\nThis is the block. ^specimen\n\n### Other Section\n\nshould not appear.\n`;

  let tmp: string;
  let nb: Notebook;
  let engine: ReturnType<Notebook['getNoteMarkdownEngine']>;
  let destDir: string;

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tx-paths-'));
    // Layout:
    //   <tmp>/origin.md
    //   <tmp>/my origin.md
    //   <tmp>/sub/origin.md
    //   <tmp>/sub/my origin.md
    //   <tmp>/dest/dest.md            <- where transclusions live
    fs.mkdirSync(path.join(tmp, 'sub'));
    fs.mkdirSync(path.join(tmp, 'dest'));
    fs.writeFileSync(path.join(tmp, 'origin.md'), ORIGIN_BODY);
    fs.writeFileSync(path.join(tmp, 'my origin.md'), ORIGIN_BODY);
    fs.writeFileSync(path.join(tmp, 'sub', 'origin.md'), ORIGIN_BODY);
    fs.writeFileSync(path.join(tmp, 'sub', 'my origin.md'), ORIGIN_BODY);
    destDir = path.join(tmp, 'dest');
    fs.writeFileSync(path.join(destDir, 'dest.md'), '');
    nb = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown-it' },
    });
    engine = nb.getNoteMarkdownEngine(path.join(destDir, 'dest.md'));
  });

  // Each variation describes how to write the *file path* portion in
  // the transclusion link, relative to dest/dest.md.  Both the
  // encoded and literal forms should resolve to the same file.
  const pathVariants: Array<{ label: string; path: string }> = [
    { label: 'plain sibling', path: '../origin.md' },
    { label: 'sibling with space literal', path: '../my origin.md' },
    { label: 'sibling with space encoded', path: '../my%20origin.md' },
    { label: 'subdir plain', path: '../sub/origin.md' },
    { label: 'subdir with space literal', path: '../sub/my origin.md' },
    { label: 'subdir with space encoded', path: '../sub/my%20origin.md' },
  ];

  type SyntaxBuilder = (filePath: string, frag: string) => string;
  const syntaxes: Array<{ label: string; build: SyntaxBuilder }> = [
    {
      label: '@import',
      build: (p, f) => `<!-- @import "${p}${f}" -->`,
    },
    {
      label: 'wikilink',
      build: (p, f) => `![[${p}${f}]]`,
    },
    {
      label: 'mdlink',
      build: (p, f) => `![alt](${p}${f})`,
    },
  ];

  const fragments = [
    { label: 'heading', frag: '#colours', expect: 'Roses are red' },
    { label: 'block', frag: '#^specimen', expect: 'This is the block' },
  ];

  for (const sx of syntaxes) {
    for (const pv of pathVariants) {
      for (const fr of fragments) {
        const name = `${sx.label} | ${pv.label} | ${fr.label}`;
        it(name, async () => {
          const md = sx.build(pv.path, fr.frag);
          const { html } = await engine.parseMD(md, {
            useRelativeFilePath: false,
            isForPreview: true,
            hideFrontMatter: false,
            fileDirectoryPath: destDir,
          });
          expect(html).toContain(fr.expect);
          expect(html).not.toContain('should not appear');
          expect(html).not.toContain('not found');
        });
      }
    }
  }
});
