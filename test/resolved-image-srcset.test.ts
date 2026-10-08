import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { Notebook } from '../src/notebook/index';
import { mapSrcsetUrls } from '../src/render-enhancers/resolved-image-paths';

describe('mapSrcsetUrls', () => {
  const upper = (url: string) => url.toUpperCase();

  test('maps a single URL', () => {
    expect(mapSrcsetUrls('a.png', upper)).toBe('A.PNG');
  });

  test('keeps width and density descriptors', () => {
    expect(mapSrcsetUrls('a.png 480w, b.png 800w', upper)).toBe(
      'A.PNG 480w, B.PNG 800w',
    );
    expect(mapSrcsetUrls('  a.png 1x,\n  b.png 2x  ', upper)).toBe(
      'A.PNG 1x, B.PNG 2x',
    );
  });

  test('splits candidates without a space after the comma', () => {
    expect(mapSrcsetUrls('a.png 1x,b.png 2x', upper)).toBe(
      'A.PNG 1x, B.PNG 2x',
    );
  });

  test('a trailing comma ends a URL without a descriptor', () => {
    expect(mapSrcsetUrls('a.png, b.png 2x', upper)).toBe('A.PNG, B.PNG 2x');
  });

  test('keeps commas inside a URL', () => {
    const seen: string[] = [];
    mapSrcsetUrls('data:image/png;base64,AAAA 1x, b.png 2x', (url) => {
      seen.push(url);
      return url;
    });
    expect(seen).toEqual(['data:image/png;base64,AAAA', 'b.png']);
  });

  test('empty and separator-only values produce nothing', () => {
    expect(mapSrcsetUrls('', upper)).toBe('');
    expect(mapSrcsetUrls(' , ', upper)).toBe('');
  });
});

describe('srcset paths in rendered HTML', () => {
  let tmp: string;
  let nb: Notebook;
  let engine: ReturnType<Notebook['getNoteMarkdownEngine']>;
  const markdown = [
    '<picture>',
    '  <source media="(prefers-color-scheme: dark)" srcset="figures/plot-dark.svg">',
    '  <img alt="plot" src="figures/plot-light.svg">',
    '</picture>',
    '',
    '<img src="a.png" srcset="a.png 1x, a@2x.png 2x">',
    '',
    '<picture><source srcset="https://example.com/x.png"><img src="y.png"></picture>',
    '',
  ].join('\n');

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'srcset-'));
    fs.writeFileSync(path.join(tmp, 'README.md'), markdown);
    nb = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown-it' },
    });
    engine = nb.getNoteMarkdownEngine(path.join(tmp, 'README.md'));
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  const fileUrl = (relative: string) =>
    pathToFileURL(path.join(tmp, relative)).href;

  test('preview resolves <source> and <img> srcset like src', async () => {
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
      fileDirectoryPath: tmp,
    });
    expect(html).toContain(`srcset="${fileUrl('figures/plot-dark.svg')}"`);
    expect(html).toContain(`src="${fileUrl('figures/plot-light.svg')}"`);
    expect(html).toContain(
      `srcset="${fileUrl('a.png')} 1x, ${fileUrl('a@2x.png')} 2x"`,
    );
    expect(html).toContain('srcset="https://example.com/x.png"');
  });

  test('relative-path output keeps srcset relative', async () => {
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: true,
      isForPreview: false,
      hideFrontMatter: false,
      fileDirectoryPath: tmp,
    });
    expect(html).toContain('srcset="figures/plot-dark.svg"');
    expect(html).toContain('srcset="a.png 1x, a@2x.png 2x"');
  });
});
