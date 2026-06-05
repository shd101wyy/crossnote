import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Notebook } from '../src/notebook/index';

describe('@import when directory path contains #', () => {
  let tmp: string;
  let nb: Notebook;
  let engine: ReturnType<Notebook['getNoteMarkdownEngine']>;

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hash-in-path-'));
    const dirWithHash = path.join(tmp, '[#11111111]');
    fs.mkdirSync(dirWithHash);
    fs.writeFileSync(
      path.join(dirWithHash, '1.md'),
      '@import "test.csv"\n',
    );
    fs.writeFileSync(
      path.join(dirWithHash, 'test.csv'),
      'Name,Year,House\nAlice,2020,Red\nBob,2021,Blue\n',
    );
    nb = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown-it' },
    });
    engine = nb.getNoteMarkdownEngine(path.join(dirWithHash, '1.md'));
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('@import resolves file when directory contains #', async () => {
    const { html } = await engine.parseMD(
      fs.readFileSync(path.join(tmp, '[#11111111]', '1.md'), 'utf-8'),
      {
        useRelativeFilePath: false,
        isForPreview: true,
        hideFrontMatter: false,
        fileDirectoryPath: path.join(tmp, '[#11111111]'),
      },
    );
    expect(html).toContain('Alice');
    expect(html).toContain('Bob');
    expect(html).toContain('Blue');
  });

  test('@import resolves file with #fragment when directory contains #', async () => {
    const mdContent =
      '@import "test.md#section"\n';
    fs.writeFileSync(
      path.join(tmp, '[#11111111]', '2.md'),
      mdContent,
    );
    fs.writeFileSync(
      path.join(tmp, '[#11111111]', 'test.md'),
      '## Section\n\ntest content.\n\n## Other\n\nshould not appear.\n',
    );
    const engine2 = nb.getNoteMarkdownEngine(
      path.join(tmp, '[#11111111]', '2.md'),
    );
    const { html } = await engine2.parseMD(mdContent, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
      fileDirectoryPath: path.join(tmp, '[#11111111]'),
    });
    expect(html).toContain('test content');
    expect(html).not.toContain('should not appear');
  });

  test('![[wikilink]] resolves file when directory contains #', async () => {
    const mdContent = '![[test.md]]\n';
    fs.writeFileSync(
      path.join(tmp, '[#11111111]', '3.md'),
      mdContent,
    );
    const engine3 = nb.getNoteMarkdownEngine(
      path.join(tmp, '[#11111111]', '3.md'),
    );
    const { html } = await engine3.parseMD(mdContent, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
      fileDirectoryPath: path.join(tmp, '[#11111111]'),
    });
    expect(html).toContain('test content');
  });
});
