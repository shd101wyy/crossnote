import * as path from 'path';
import * as cheerio from 'cheerio';
import { renderCsv } from '../src/renderers/csv';
import { Notebook } from '../src/notebook/index';

const parseOpts = {
  useRelativeFilePath: false,
  isForPreview: true,
  hideFrontMatter: false,
};

describe('renderCsv', () => {
  test('uses the first row as the header', () => {
    const $ = cheerio.load(renderCsv('name,age\nAli,30\nSara,25'));
    expect(
      $('thead th')
        .map((_, el) => $(el).text())
        .get(),
    ).toEqual(['name', 'age']);
    expect($('tbody tr').length).toBe(2);
    expect($('tbody tr').first().find('td').last().text()).toBe('30');
  });

  test('keeps commas inside quoted cells', () => {
    const $ = cheerio.load(renderCsv('city,note\nLahore,"big, busy"'));
    expect($('tbody td').last().text()).toBe('big, busy');
  });

  test('renders a single-column csv', () => {
    const $ = cheerio.load(renderCsv('name\nAli\nSara'));
    expect($('th').text()).toBe('name');
    expect($('tbody td').length).toBe(2);
  });

  test('escapes html in cells', () => {
    const $ = cheerio.load(renderCsv('a\n<img src=x onerror=alert(1)>'));
    expect($('img').length).toBe(0);
    expect($('td').text()).toBe('<img src=x onerror=alert(1)>');
  });

  test('throws on malformed csv', () => {
    expect(() => renderCsv('a,b\n1,"unterminated')).toThrow(/CSV parse error/);
  });
});

describe('```csv fenced block', () => {
  let notebook: Notebook;
  const render = async (markdown: string) => {
    const engine = notebook.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-csv.md'),
    );
    const { html } = await engine.parseMD(markdown, parseOpts);
    return cheerio.load(html);
  };

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: { markdownParser: 'markdown-it' },
    });
  });

  test('renders as a table and hides the source', async () => {
    const $ = await render(['```csv', 'name,age', 'Ali,30', '```'].join('\n'));
    expect($('table th').first().text()).toBe('name');
    expect($('table td').first().text()).toBe('Ali');
    expect($('pre').length).toBe(0);
  });

  test('code_block=true keeps the source instead', async () => {
    const $ = await render(
      ['```csv {code_block=true}', 'name,age', 'Ali,30', '```'].join('\n'),
    );
    expect($('table').length).toBe(0);
    expect($('pre').text()).toContain('name,age');
  });

  test('shows the parse error for malformed csv', async () => {
    const $ = await render(['```csv', 'a,b', '1,"oops', '```'].join('\n'));
    expect($('table').length).toBe(0);
    expect($('pre').text()).toContain('CSV parse error');
  });
});
