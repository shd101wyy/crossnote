import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { Notebook } from '../src/notebook/index';
import {
  appendUrlSuffix,
  escapeUrlPath,
  splitUrlReference,
  useExternalAddFileProtocolFunction,
} from '../src/utility';

describe('URL reference helpers', () => {
  test('splitUrlReference decodes the path and keeps the suffix raw', () => {
    expect(splitUrlReference('%E5%9B%BE.png')).toEqual({
      path: '图.png',
      suffix: '',
    });
    expect(splitUrlReference('/a%20b.png?0.5#x%20y')).toEqual({
      path: '/a b.png',
      suffix: '?0.5#x%20y',
    });
    expect(splitUrlReference('100%.png')).toEqual({
      path: '100%.png',
      suffix: '',
    });
  });

  test('appendUrlSuffix', () => {
    expect(appendUrlSuffix('file:///a.png', '?0.5')).toBe('file:///a.png?0.5');
    expect(appendUrlSuffix('/files/a.png?root=1', '?0.5#x')).toBe(
      '/files/a.png?root=1&0.5#x',
    );
    expect(appendUrlSuffix('data:image/png;base64,AAAA', '?0.5')).toBe(
      'data:image/png;base64,AAAA',
    );
    expect(appendUrlSuffix('file:///a.png', '')).toBe('file:///a.png');
  });

  test('escapeUrlPath escapes only what breaks a URL', () => {
    expect(escapeUrlPath('ws#1\\a b (2)?%.png')).toBe(
      'ws%231/a%20b%20%282%29%3F%25.png',
    );
    expect(escapeUrlPath('中文/图.png')).toBe('中文/图.png');
  });
});

describe('local links with encoded paths, queries and fragments', () => {
  let tmp: string;
  let dir: string;
  let nb: Notebook;
  const png = Buffer.from('89504e470d0a1a0a', 'hex');

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'file-url-suffix-'));
    dir = path.join(tmp, 'ws#1 中文');
    fs.mkdirSync(dir);
    for (const name of ['图.png', 'image.png', 'a b.png', 'dark.png']) {
      fs.writeFileSync(path.join(dir, name), png);
    }
    fs.writeFileSync(path.join(dir, 'other.md'), '# Sec\n');
    nb = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown-it' },
    });
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  async function render(
    markdown: string,
    options: { useRelativeFilePath?: boolean; isForPreview?: boolean } = {},
  ) {
    fs.writeFileSync(path.join(dir, 'a.md'), markdown);
    const engine = nb.getNoteMarkdownEngine(path.join(dir, 'a.md'));
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
      fileDirectoryPath: dir,
      ...options,
    });
    return html;
  }

  const srcOf = (html: string) =>
    (html.match(/<img[^>]*\ssrc="([^"]*)"/) ?? [])[1];
  const fileUrl = (name: string) => pathToFileURL(path.join(dir, name)).href;

  test('non-ASCII relative images are encoded once (vscode-mpe#2441)', async () => {
    expect(srcOf(await render('![t](./图.png)\n'))).toBe(fileUrl('图.png'));
    expect(
      srcOf(await render('![t](./图.png)\n', { isForPreview: false })),
    ).toBe(fileUrl('图.png'));
  });

  test('@import images keep the cache buster as a query (vscode-mpe#2328)', async () => {
    const src = srcOf(await render('@import "image.png"\n'));
    expect(src).toMatch(/\?[\d.]+$/);
    expect(src.replace(/\?[\d.]+$/, '')).toBe(fileUrl('image.png'));
  });

  test('percent-encoded spaces resolve to the real file', async () => {
    expect(srcOf(await render('![x](a%20b.png)\n'))).toBe(fileUrl('a b.png'));
    const imported = srcOf(await render('@import "a b.png"\n'));
    expect(imported.replace(/\?[\d.]+$/, '')).toBe(fileUrl('a b.png'));
  });

  test('fragments stay fragments', async () => {
    expect(srcOf(await render('![d](dark.png#gh-dark-mode-only)\n'))).toBe(
      fileUrl('dark.png') + '#gh-dark-mode-only',
    );
    expect(await render('[s](other.md#sec)\n')).toContain(
      `href="${fileUrl('other.md')}#sec"`,
    );
  });

  test('relative output escapes root-relative links', async () => {
    // A `#` in a link starts a fragment, so the folder name is written escaped.
    const rootRelative =
      '/' + path.basename(dir).replace('#', '%23') + '/a b.png';
    // Text before the image keeps it inline; a lone image line is an import.
    const html = await render(`see ![x](<${rootRelative}>)\n`, {
      useRelativeFilePath: true,
      isForPreview: false,
    });
    expect(srcOf(html)).toBe('a%20b.png');
  });

  test('host mappers get a clean path; the query is appended after', async () => {
    const seen: string[] = [];
    const restore = useExternalAddFileProtocolFunction((filePath) => {
      seen.push(filePath);
      return '/files/mapped.png?root=1';
    });
    try {
      fs.writeFileSync(path.join(dir, 'a.md'), '@import "image.png"\n');
      const engine = nb.getNoteMarkdownEngine(path.join(dir, 'a.md'));
      const { html } = await engine.parseMD('@import "image.png"\n', {
        useRelativeFilePath: false,
        isForPreview: true,
        hideFrontMatter: false,
        fileDirectoryPath: dir,
        vscodePreviewPanel: {} as never,
      });
      expect(seen).toContain(path.join(dir, 'image.png'));
      expect(srcOf(html)).toMatch(
        /^\/files\/mapped\.png\?root=1&(amp;)?[\d.]+$/,
      );
    } finally {
      restore();
    }
  });
});
