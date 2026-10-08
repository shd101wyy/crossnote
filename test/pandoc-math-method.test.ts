import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pandocVersionSupportsMathMethod } from '../src/markdown-engine';
import { Notebook } from '../src/notebook/index';

describe('pandocVersionSupportsMathMethod (#529)', () => {
  test.each([
    ['pandoc 3.12.1\nFeatures: +server +lua', true],
    ['pandoc 3.11\nFeatures: +server +lua', true],
    ['pandoc.exe 3.11.0.1', true],
    ['pandoc 4.0', true],
    ['pandoc 3.10.1', false],
    ['pandoc 3.1.12.1', false],
    ['pandoc 2.19.2', false],
    ['pandoc 3.6.0.1', false],
  ])('%s → %s', (output, expected) => {
    expect(pandocVersionSupportsMathMethod(output)).toBe(expected);
  });

  test('garbage output means unsupported (fall back to legacy flags)', () => {
    expect(pandocVersionSupportsMathMethod('')).toBe(false);
    expect(pandocVersionSupportsMathMethod('some other tool 9.9')).toBe(false);
  });
});

/**
 * Integration: pandoc ≥ 3.11 warns on stderr for the deprecated math flags,
 * and pandocRender turns any stderr into a visible error block — so a
 * MathJax render must produce neither. Runs the real pandoc when it is
 * installed (CI installs it); skips otherwise, mirroring the
 * wikilink-embed/colon-fence pandoc suites.
 */
describe('pandocRender math flags (#529)', () => {
  const hasPandoc = (() => {
    try {
      execFileSync('pandoc', ['--version'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();

  let tmp: string;
  let notebook: Notebook;

  beforeAll(async () => {
    if (!hasPandoc) {
      return;
    }
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pandoc-math-method-'));
    fs.writeFileSync(path.join(tmp, 'a.md'), '$E = mc^2$\n');
    notebook = await Notebook.init({
      notebookPath: tmp,
      config: {
        markdownParser: 'pandoc',
        markdownYoBinaryPath: '',
        mathRenderingOption: 'MathJax',
      },
    });
  });

  afterAll(() => {
    if (tmp) {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  (hasPandoc ? test : test.skip)(
    'math renders without a deprecation error block',
    async () => {
      const engine = notebook.getNoteMarkdownEngine(path.join(tmp, 'a.md'));
      const { html } = await engine.parseMD('$E = mc^2$\n', {
        useRelativeFilePath: false,
        isForPreview: true,
        hideFrontMatter: false,
      });

      expect(html).not.toMatch(/Deprecated/i);
      expect(html).not.toMatch(/--math-method/i);
      expect(html).toContain('math inline');
    },
  );
});
