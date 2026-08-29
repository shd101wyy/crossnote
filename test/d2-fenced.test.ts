import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { D2_NOT_FOUND, renderD2 } from '../src/renderers/d2';
import { Notebook } from '../src/notebook/index';

const ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">' +
  '<rect width="10" height="10" fill="red"/></svg>';

const parseOpts = {
  useRelativeFilePath: false,
  isForPreview: true,
  hideFrontMatter: false,
};

describe('D2 fenced diagram integration', () => {
  describe('when the d2 binary is missing', () => {
    let notebook: Notebook;

    beforeAll(async () => {
      notebook = await Notebook.init({
        notebookPath: path.resolve(__dirname, './markdown/test-files'),
        config: {
          markdownParser: 'markdown-it',
          d2Path: 'crossnote-nonexistent-d2-binary',
        },
      });
    });

    it('renders the d2 code fence as plain text (not blank)', async () => {
      const markdown = ['```d2', 'x -> y', '```'].join('\n');
      const engine = notebook.getNoteMarkdownEngine(
        path.resolve(__dirname, './markdown/test-files/test-d2.md'),
      );
      const { html } = await engine.parseMD(markdown, parseOpts);

      const $ = cheerio.load(html);
      // The original d2 source must still be visible as a code block.
      expect($.text()).toContain('x -> y');
    });
  });

  describe('when the d2 binary is installed', () => {
    let notebook: Notebook;
    let dir: string;
    let d2Available = false;

    beforeAll(async () => {
      d2Available =
        (await renderD2('x: hello', {
          d2Path: 'd2',
          d2Layout: 'dagre',
          d2Theme: 0,
          d2Sketch: false,
        })) !== D2_NOT_FOUND;

      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crossnote-d2-int-'));
      fs.mkdirSync(path.join(dir, 'media'));
      fs.writeFileSync(path.join(dir, 'media', 'check.svg'), ICON_SVG);

      notebook = await Notebook.init({
        notebookPath: dir,
        config: { markdownParser: 'markdown-it', d2Path: 'd2' },
      });
    }, 30000);

    afterAll(() => {
      if (dir) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('inlines a present relative icon', async () => {
      if (!d2Available) {
        console.warn('skipping: d2 binary not installed');
        return;
      }
      const markdown = [
        '```d2',
        'svc: Service {',
        '  icon: ./media/check.svg',
        '}',
        '```',
      ].join('\n');
      const engine = notebook.getNoteMarkdownEngine(
        path.join(dir, 'present.md'),
      );
      const { html } = await engine.parseMD(markdown, parseOpts);
      expect(html).toContain('<svg');
      expect(html).toContain('data:image/svg');
    }, 30000);

    it('shows a visible D2 error (not blank) when a referenced icon is missing', async () => {
      if (!d2Available) {
        console.warn('skipping: d2 binary not installed');
        return;
      }
      const markdown = [
        '```d2',
        'svc: Service {',
        '  icon: ./media/does-not-exist.svg',
        '}',
        '```',
      ].join('\n');
      const engine = notebook.getNoteMarkdownEngine(
        path.join(dir, 'missing.md'),
      );
      const { html } = await engine.parseMD(markdown, parseOpts);

      const $ = cheerio.load(html);
      // Must not be blank: an error block is shown instead of the diagram.
      expect($.text()).toContain('D2 error');
      expect($.text()).toContain('failed to bundle');
    }, 30000);
  });
});
