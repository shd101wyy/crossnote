import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import enhance from '../src/render-enhancers/extended-table-syntax';

jest.mock('less', () => ({
  render: (
    _input: string,
    _options: unknown,
    callback: (error: unknown, output: { css: string } | undefined) => void,
  ) => {
    callback(null, { css: '' });
  },
}));

async function enhanceRows(secondRow: string[]) {
  const cells = (tag: string, row: string[]) =>
    row.map((cell) => `<${tag}>${cell}</${tag}>`).join('');
  const $ = cheerio.load(
    `<table><tbody><tr>${cells('td', ['a', 'b'])}</tr><tr>${cells(
      'td',
      secondRow,
    )}</tr></tbody></table>`,
    null,
    false,
  );
  await enhance($);
  return $;
}

describe('extended table syntax merge markers', () => {
  test('plain ^ merges up', async () => {
    const $ = await enhanceRows(['^', 'x']);
    expect($('tr').eq(0).children().eq(0).attr('rowspan')).toBe('2');
    expect($('tr').eq(1).children()).toHaveLength(1);
  });

  test('padded ^ merges up', async () => {
    const $ = await enhanceRows([' ^ ', 'x']);
    expect($('tr').eq(0).children().eq(0).attr('rowspan')).toBe('2');
    expect($('tr').eq(1).children()).toHaveLength(1);
  });

  test('plain > merges right', async () => {
    const $ = await enhanceRows(['>', 'x']);
    expect($('tr').eq(1).children()).toHaveLength(1);
    expect($('tr').eq(1).children().eq(0).attr('colspan')).toBe('2');
  });

  test('empty cell merges left', async () => {
    const $ = await enhanceRows(['x', '']);
    expect($('tr').eq(1).children()).toHaveLength(1);
    expect($('tr').eq(1).children().eq(0).attr('colspan')).toBe('2');
  });

  test('inline code ^ is an ordinary cell', async () => {
    const $ = await enhanceRows(['<code>^</code>', 'x']);
    expect($('[rowspan]')).toHaveLength(0);
    expect($('tr').eq(1).children()).toHaveLength(2);
    expect($('tr').eq(1).find('code').text()).toBe('^');
  });

  test('inline code > is an ordinary cell', async () => {
    const $ = await enhanceRows(['<code>&gt;</code>', 'x']);
    expect($('[colspan]')).toHaveLength(0);
    expect($('tr').eq(1).children()).toHaveLength(2);
    expect($('tr').eq(1).find('code').text()).toBe('>');
  });

  test('strong ^ is an ordinary cell', async () => {
    const $ = await enhanceRows(['<strong>^</strong>', 'x']);
    expect($('[rowspan]')).toHaveLength(0);
    expect($('tr').eq(1).children()).toHaveLength(2);
  });

  test('paragraph wrapped ^ merges up', async () => {
    const $ = await enhanceRows(['<p>^</p>', 'x']);
    expect($('tr').eq(0).children().eq(0).attr('rowspan')).toBe('2');
    expect($('tr').eq(1).children()).toHaveLength(1);
  });

  test('paragraph wrapped inline code ^ is an ordinary cell', async () => {
    const $ = await enhanceRows(['<p><code>^</code></p>', 'x']);
    expect($('[rowspan]')).toHaveLength(0);
    expect($('tr').eq(1).children()).toHaveLength(2);
  });
});

describe('extended table syntax end to end', () => {
  track();

  test('markdown inline code markers keep their cells', async () => {
    const tmpDir = mkdirSync({ prefix: 'xnote-table-merge' });
    fs.writeFileSync(path.join(tmpDir, 'test.md'), '# Test');
    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
        enableExtendedTableSyntax: true,
      },
    });
    const engine = new MarkdownEngine({
      notebook,
      filePath: path.join(tmpDir, 'test.md'),
    });
    const out = await engine.parseMD(
      '| op | desc |\n| --- | --- |\n| a | x |\n| `^` | xor |\n| `>` | gt |\n',
      {
        isForPreview: true,
        useRelativeFilePath: false,
        hideFrontMatter: false,
        vscodePreviewPanel: null,
      },
    );
    expect(out.html).toContain('<code>^</code>');
    expect(out.html).toContain('<code>&gt;</code>');
    expect(out.html).not.toMatch(/rowspan|colspan/);

    const merged = await engine.parseMD(
      '| op | desc |\n| --- | --- |\n| a | x |\n| ^ | xor |\n',
      {
        isForPreview: true,
        useRelativeFilePath: false,
        hideFrontMatter: false,
        vscodePreviewPanel: null,
      },
    );
    expect(merged.html).toMatch(/<td[^>]*rowspan="2"[^>]*>a<\/td>/);
  });
});
