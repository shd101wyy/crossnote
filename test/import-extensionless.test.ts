import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Notebook } from '../src/notebook/index';

describe('imports without an extension and data URI images', () => {
  let tmp: string;
  let nb: Notebook;
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>',
  ).toString('base64');

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'import-extensionless-'));
    fs.writeFileSync(
      path.join(tmp, 'Caddyfile'),
      'example.com {\n  respond "hi"\n}\n',
    );
    fs.writeFileSync(path.join(tmp, 'note.md'), 'Imported note body.\n');
    fs.writeFileSync(path.join(tmp, 'both'), 'plain file body\n');
    fs.writeFileSync(path.join(tmp, 'both.md'), 'markdown file body\n');
    fs.writeFileSync(
      path.join(tmp, 'screenshot'),
      Buffer.from('89504e470d0a1a0a', 'hex'),
    );
    nb = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown-it' },
    });
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  async function render(markdown: string) {
    fs.writeFileSync(path.join(tmp, 'a.md'), markdown);
    const engine = nb.getNoteMarkdownEngine(path.join(tmp, 'a.md'));
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
      fileDirectoryPath: tmp,
    });
    return html;
  }

  test('@import of a file without an extension shows it as code (vscode-mpe#2236)', async () => {
    const html = await render('@import "Caddyfile"\n');
    expect(html).toContain('respond');
    expect(html).not.toContain('ENOENT');
    expect(html).not.toContain('<img');
  });

  test('@import without an extension still finds a note by name', async () => {
    const html = await render('@import "note"\n');
    expect(html).toContain('Imported note body.');
  });

  test('a file named exactly as written wins over name.md', async () => {
    const html = await render('@import "both"\n');
    expect(html).toContain('plain file body');
    expect(html).not.toContain('markdown file body');
  });

  test.each([
    ['png', 'data:image/png;base64,iVBORw0KGgo='],
    ['svg base64', `data:image/svg+xml;base64,${svg}`],
    ['svg url-encoded', 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E'],
  ])(
    'a lone ![](data:...) %s image renders (vscode-mpe#2241)',
    async (_, uri) => {
      const html = await render(`![x](${uri})\n`);
      expect(html).toContain(`src="${uri}"`);
      expect(html).not.toContain('ENOENT');
    },
  );

  test('an inline SVG data URI image renders', async () => {
    const uri = `data:image/svg+xml;base64,${svg}`;
    expect(await render(`see ![x](${uri}) here\n`)).toContain(`src="${uri}"`);
  });

  test('![]() of a local image without an extension stays an image', async () => {
    const html = await render('![shot](screenshot)\n');
    expect(html).toMatch(/<img[^>]*src="file:[^"]*\/screenshot"/);
    expect(html).not.toContain('<code');
  });

  test('remote images without an extension still render as images', async () => {
    const url = 'https://example.com/assets/1908863/ede91390';
    expect(await render(`![shot](${url})\n`)).toContain(`src="${url}"`);
  });

  test('links that can run script are still rejected', async () => {
    const html = await render(
      '[a](javascript:alert(1)) [b](data:text/html,x)\n',
    );
    expect(html).not.toMatch(/href="(javascript|data:text)/);
  });
});
