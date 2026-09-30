import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { absoluteImportPath } from '../src/markdown-engine/transformer';
import { Notebook } from '../src/notebook/index';

describe('absoluteImportPath', () => {
  test('Windows drive and UNC paths are used as written', () => {
    for (const target of [
      'C:/folder/my-style.less',
      'C:\\folder\\my-style.less',
      '\\\\server\\share\\my-style.less',
    ]) {
      expect(absoluteImportPath(target, path.win32)).toBe(target);
    }
  });

  test('a leading slash still means the project root', () => {
    expect(absoluteImportPath('/styles/x.less', path.win32)).toBeNull();
    expect(absoluteImportPath('/styles/x.less', path.posix)).toBeNull();
  });

  test('relative targets are left to the normal resolution', () => {
    expect(absoluteImportPath('styles/x.less', path.win32)).toBeNull();
    expect(absoluteImportPath('C:/x.less', path.posix)).toBeNull();
    expect(absoluteImportPath('https://example.com/x.less')).toBeNull();
  });

  test('file URLs resolve to the file they name', () => {
    const file = path.join(os.tmpdir(), 'dir with space', 'x.less');
    expect(absoluteImportPath(pathToFileURL(file).href)).toBe(file);
  });
});

describe('importing files by absolute location (vscode-mpe#2349)', () => {
  let tmp: string;
  let notebookDir: string;
  let outside: string;
  let nb: Notebook;

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'import-absolute-'));
    notebookDir = path.join(tmp, 'notebook');
    outside = path.join(tmp, 'shared styles');
    fs.mkdirSync(path.join(notebookDir, 'styles'), { recursive: true });
    fs.mkdirSync(outside);
    fs.writeFileSync(path.join(outside, 'notes.txt'), 'shared notes text\n');
    fs.writeFileSync(path.join(outside, 'part.md'), 'Shared part body.\n');
    fs.writeFileSync(path.join(outside, 'tool.js'), 'window.importedTool = 1;');
    fs.writeFileSync(
      path.join(notebookDir, 'styles', 'local.txt'),
      'project root text\n',
    );
    nb = await Notebook.init({
      notebookPath: notebookDir,
      config: { markdownParser: 'markdown-it' },
    });
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  async function render(markdown: string) {
    fs.writeFileSync(path.join(notebookDir, 'a.md'), markdown);
    const engine = nb.getNoteMarkdownEngine(path.join(notebookDir, 'a.md'));
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
      fileDirectoryPath: notebookDir,
    });
    return html;
  }

  const fileUrl = (name: string) =>
    pathToFileURL(path.join(outside, name)).href;

  // .less imports go through the same path resolution, but `less.render` is
  // not callable under jest's module interop, so these use plain text files.
  test('a file:// import of another file type is shown as code', async () => {
    const html = await render(`@import "${fileUrl('notes.txt')}"\n`);
    expect(html).toContain('shared notes text');
    expect(html).not.toContain('ENOENT');
  });

  test('a file:// markdown import is included', async () => {
    const html = await render(`@import "${fileUrl('part.md')}"\n`);
    expect(html).toContain('Shared part body.');
  });

  test('a leading slash still imports from the project root', async () => {
    const html = await render('@import "/styles/local.txt"\n');
    expect(html).toContain('project root text');
  });

  test('a file:// .js import still emits no script', async () => {
    const html = await render(`@import "${fileUrl('tool.js')}"\n`);
    expect(html).not.toContain('<script');
    expect(html).not.toContain('importedTool');
  });
});
