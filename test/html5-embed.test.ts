import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Notebook } from '../src/notebook/index';

/**
 * `enableHTML5Embed` loads `markdown-it-html5-embed`, a plugin of 2018 that
 * is not published for markdown-it 15 and reads one helper 15 removed. It has
 * to load all the same, and leave an image and a link as they are.
 */
describe('HTML5 embed', () => {
  let tmp: string;
  let notebook: Notebook;

  const render = (markdown: string): string =>
    notebook.md.render(markdown).trim();

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'html5-embed-'));
    notebook = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown-it', enableHTML5Embed: true },
    });
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('the option loads, and leaves an image and a link as they are', () => {
    expect(render('![alt](a.png)')).toBe(
      '<p data-source-line="1"><img src="a.png" alt="alt"></p>',
    );
    expect(render('[title](a.mp3)')).toBe(
      '<p data-source-line="1"><a href="a.mp3">title</a></p>',
    );
  });
});
