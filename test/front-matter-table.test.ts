/**
 * Tests for `frontMatterRenderingOption` table layouts.
 *
 * 'vertical table' renders one key/value pair per row so the table
 * stays inside the preview pane when there are many keys or long
 * values (vscode-markdown-preview-enhanced#2371); 'table' keeps the
 * historical one-column-per-key layout.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FrontMatterRenderingOption, Notebook } from '../src/notebook/index';

describe('front matter rendering', () => {
  let tmp: string;

  const parse = async (
    option: FrontMatterRenderingOption,
    frontMatter: string,
  ) => {
    const notebook = await Notebook.init({
      notebookPath: tmp,
      config: {
        markdownParser: 'markdown-it',
        frontMatterRenderingOption: option,
      },
    });
    const filePath = path.join(tmp, 'note.md');
    fs.writeFileSync(filePath, frontMatter + '\nBody text.\n');
    const engine = notebook.getNoteMarkdownEngine(filePath);
    const { html } = await engine.parseMD(frontMatter + '\nBody text.\n', {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });
    return html;
  };

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'front-matter-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  const frontMatter = [
    '---',
    'title: Hello World',
    'num: 42',
    'tags:',
    '  - a',
    '  - b',
    'author:',
    '  name: Jaeyeong',
    '---',
    '',
  ].join('\n');

  it("'vertical table' renders one key/value pair per row", async () => {
    const html = await parse('vertical table', frontMatter);

    expect(html).toContain('<tr><th>title</th><td>Hello World</td></tr>');
    expect(html).toContain('<tr><th>num</th><td>42</td></tr>');
    // Array values stay a single row of cells.
    expect(html).toContain(
      '<tr><th>tags</th><td><table><tbody><tr><td>a</td><td>b</td></tr></tbody></table></td></tr>',
    );
    // Nested objects recurse vertically.
    expect(html).toContain(
      '<tr><th>author</th><td><table><tbody><tr><th>name</th><td>Jaeyeong</td></tr></tbody></table></td></tr>',
    );
    expect(html).not.toContain('<thead>');
    // The body is still rendered after the table.
    expect(html).toContain('Body text.');
  });

  it("'table' keeps the one-column-per-key layout", async () => {
    const html = await parse('table', frontMatter);

    expect(html).toContain(
      '<table><thead><tr><th>title</th><th>num</th><th>tags</th><th>author</th></tr></thead>',
    );
    expect(html).toContain('<td>Hello World</td>');
    // Nested objects recurse horizontally.
    expect(html).toContain(
      '<td><table><thead><tr><th>name</th></tr></thead><tbody><tr><td>Jaeyeong</td></tr></tbody></table></td>',
    );
  });

  it("'none' hides the front matter entirely", async () => {
    const html = await parse('none', frontMatter);

    expect(html).not.toContain('Hello World');
    expect(html).not.toContain('<table>');
    expect(html).toContain('Body text.');
  });

  it("'code block' renders the front matter as a yaml code block", async () => {
    const html = await parse('code block', frontMatter);

    expect(html).toContain('data-role="codeBlock" data-info="yaml"');
    expect(html).toContain('Hello World');
    expect(html).not.toContain('<table>');
  });

  it('escapes html in keys and values', async () => {
    const html = await parse('vertical table', '---\nx<script>: a<b\n---\n');

    expect(html).toContain('<tr><th>x&lt;script&gt;</th><td>a&lt;b</td></tr>');
    expect(html).not.toContain('<script>');
  });
});
