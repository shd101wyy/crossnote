import * as fs from 'fs';
import * as path from 'path';
import { load } from 'cheerio';
import { jsonForScript } from '../src/lib/json-for-script';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import { WebviewConfig } from '../src/notebook/types';
import {
  getCrossnoteBuildDirectory,
  setCrossnoteBuildDirectory,
} from '../src/utility';

/**
 * The front matter of a note reaches the page outside the markdown body: its
 * `title`, `id` and `class` are written into the HTML export, and its
 * `presentation` into the script that starts reveal.js — in the preview and
 * in the export. Written as they are, a value could end the element or the
 * script it was written into. The export is run against a fake build
 * directory, like `test/presentation-export.test.ts`.
 */

jest.mock('less', () => ({
  render: (
    _input: string,
    _options: unknown,
    callback: (error: unknown, output: { css: string } | undefined) => void,
  ) => {
    callback(null, { css: '' });
  },
}));

/** Ends a script element wherever it is written, quoted or not. */
const SCRIPT_END = '</script><script>window.__pwn = 1</script>';
/** What counts: how many script elements a page has. */
const countScripts = (html: string) => html.match(/<script\b/g)?.length ?? 0;

describe('front matter written into a page', () => {
  track();

  const originalBuildDirectory = getCrossnoteBuildDirectory();
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdirSync({ prefix: 'xnote-front-matter-' });
    const revealDir = path.join(tmpDir, 'dependencies', 'reveal');
    for (const dir of [
      path.join(revealDir, 'js'),
      path.join(revealDir, 'css', 'theme'),
      path.join(revealDir, 'plugin', 'notes'),
      path.join(tmpDir, 'styles', 'preview_theme'),
      path.join(tmpDir, 'styles', 'prism_theme'),
    ]) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'prism_theme', 'default.css'),
      '/* prism:default */',
    );
    fs.writeFileSync(path.join(revealDir, 'js', 'reveal.js'), '/* reveal */');
    fs.writeFileSync(path.join(revealDir, 'css', 'reveal.css'), '/* css */');
    fs.writeFileSync(
      path.join(revealDir, 'css', 'theme', 'white.css'),
      '/* theme */',
    );
    setCrossnoteBuildDirectory(tmpDir);
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(originalBuildDirectory);
  });

  async function createEngine(
    markdown: string,
    config: Record<string, unknown> = {},
  ) {
    fs.writeFileSync(path.join(tmpDir, 'note.md'), markdown);
    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
        mathRenderingOption: 'None',
        ...config,
      },
    });
    const engine = new MarkdownEngine({
      notebook,
      filePath: path.join(tmpDir, 'note.md'),
    });
    return { engine, notebook };
  }

  test('the title of the front matter stays in the title element', async () => {
    const title = `</title><script>window.__pwn = 1</script><title x="`;
    const { engine } = await createEngine(
      `---\ntitle: ${JSON.stringify(title)}\n---\n\n# One\n`,
    );
    const html = await engine.htmlExportDocument();

    expect(load(html)('title').text()).toBe(title);
    expect(html).not.toMatch(/<script>\s*window\.__pwn/);
  });

  test('the title of an eBook stays in the title element', async () => {
    const title = `</title><script>window.__pwn = 1</script><title x="`;
    const { engine } = await createEngine(
      `---\nebook:\n  title: ${JSON.stringify(title)}\n---\n\n# One\n`,
    );
    // An eBook written as HTML is the work of the engine alone: the other
    // formats are made from it by calibre.
    const dest = await engine.eBookExport({ fileType: 'html' });
    const html = fs.readFileSync(dest, 'utf8');

    expect(load(html)('title').text()).toBe(title);
    expect(html).not.toMatch(/<script>\s*window\.__pwn/);
  });

  test('the id and the class of the front matter are the id and the class of the page', async () => {
    const { engine } = await createEngine(
      [
        '---',
        'id: \'x" onmouseover="alert(1)\'',
        'class: \'a" onclick="alert(2)\'',
        '---',
        '',
        '# One',
        '',
      ].join('\n'),
    );
    const html = await engine.htmlExportDocument();
    const page = load(html)('div.crossnote');

    expect(page).toHaveLength(1);
    expect(page.attr('id')).toBe('x" onmouseover="alert(1)');
    expect(page.attr('class')).toBe(
      'crossnote markdown-preview  a" onclick="alert(2)',
    );
    expect(
      Object.keys(page.attr() ?? {}).filter((name) => /^on/i.test(name)),
    ).toEqual([]);
  });

  describe('the presentation of the front matter', () => {
    const deck = (presentation: string) =>
      [
        '---',
        'presentation:',
        presentation,
        '---',
        '',
        '<!-- slide -->',
        '# One',
        '',
        '<!-- slide -->',
        '',
        '```mermaid',
        'graph TD',
        'A --> B',
        '```',
        '',
      ].join('\n');
    const harmless = '  theme: white.css';
    const endingScript = [
      '  theme: white.css',
      `  x: ${JSON.stringify(SCRIPT_END)}`,
      `  width: ${JSON.stringify('960' + SCRIPT_END)}`,
      `  view: ${JSON.stringify('print' + SCRIPT_END)}`,
    ].join('\n');

    test('cannot end the script that starts the presentation of an export', async () => {
      const plain = await createEngine(deck(harmless));
      const plainScripts = countScripts(
        await plain.engine.htmlExportDocument(),
      );
      const { engine } = await createEngine(deck(endingScript));
      const html = await engine.htmlExportDocument();

      // No script more than the page has without the value.
      expect(countScripts(html)).toBe(plainScripts);
      expect(html).not.toContain(SCRIPT_END);
      // The value is where reveal.js reads it, as it was written.
      expect(html).toContain('\\u003c/script>');
    });

    test('cannot end the script that starts the presentation of a preview', async () => {
      const plain = await createEngine(deck(harmless));
      const plainHtml = await plain.engine.generateHTMLTemplateForPreview({
        inputString: deck(harmless),
        config: plain.notebook.config as WebviewConfig,
        vscodePreviewPanel: null,
      });
      const { engine, notebook } = await createEngine(deck(endingScript));
      const html = await engine.generateHTMLTemplateForPreview({
        inputString: deck(endingScript),
        config: notebook.config as WebviewConfig,
        vscodePreviewPanel: null,
      });

      expect(countScripts(html)).toBe(countScripts(plainHtml));
      expect(html).not.toContain(SCRIPT_END);
      // What reveal.js is given holds the value, as it was written.
      const config = html.match(/Reveal\.initialize\((\{[^\n]*\})\)/)![1];
      expect(JSON.parse(config)).toMatchObject({ x: SCRIPT_END });
    });
  });
});

describe('the keys of a presentation that make reveal.js load a script', () => {
  track();

  const originalBuildDirectory = getCrossnoteBuildDirectory();
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdirSync({ prefix: 'xnote-presentation-keys-' });
    const revealDir = path.join(tmpDir, 'dependencies', 'reveal');
    for (const dir of [
      path.join(revealDir, 'js'),
      path.join(revealDir, 'css', 'theme'),
      path.join(tmpDir, 'styles', 'preview_theme'),
      path.join(tmpDir, 'styles', 'prism_theme'),
    ]) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'prism_theme', 'default.css'),
      '/* prism:default */',
    );
    fs.writeFileSync(path.join(revealDir, 'js', 'reveal.js'), '/* reveal */');
    fs.writeFileSync(path.join(revealDir, 'css', 'reveal.css'), '/* css */');
    fs.writeFileSync(
      path.join(revealDir, 'css', 'theme', 'white.css'),
      '/* theme */',
    );
    setCrossnoteBuildDirectory(tmpDir);
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(originalBuildDirectory);
  });

  async function createEngine(
    markdown: string,
    enableScriptExecution: boolean,
  ) {
    fs.writeFileSync(path.join(tmpDir, 'note.md'), markdown);
    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
        mathRenderingOption: 'None',
        enableScriptExecution,
      },
    });
    const engine = new MarkdownEngine({
      notebook,
      filePath: path.join(tmpDir, 'note.md'),
    });
    return { engine, notebook };
  }

  /** A note that names a script for reveal.js to load, and a `url` that runs script where the speaker view loads its frames. */
  const note = [
    '---',
    'presentation:',
    '  dependencies:',
    '    - src: https://example.com/payload.js',
    '  url: "javascript:alert(1)//"',
    '  transition: fade',
    '---',
    '',
    '<!-- slide -->',
    '# One',
    '',
  ].join('\n');
  // reveal.js 6 loads the entries that have a `src`, and nothing else.
  const payload = [{ src: 'https://example.com/payload.js' }];
  const url = 'javascript:alert(1)//';

  /** What reveal.js is given by an export. */
  const givenByExport = (html: string): Record<string, unknown> =>
    JSON.parse(
      html.match(/Reveal\.initialize\(Object\.assign\((\{.*\}), \{/)![1],
    );
  /** What reveal.js is given by a preview. */
  const givenByPreview = (html: string): Record<string, unknown> =>
    JSON.parse(html.match(/await Reveal\.initialize\((.*)\)/)![1]);

  test('an export does not give them unless enableScriptExecution is on', async () => {
    // reveal.js loads every `dependencies` entry into the page as a script,
    // and its notes plugin builds the frames of the speaker view from `url`
    // (#602).
    const { engine } = await createEngine(note, false);
    const given = givenByExport(await engine.htmlExportDocument());

    expect(given).not.toHaveProperty('url');
    expect(given['dependencies']).toEqual([]);
    // The rest of the configuration is given.
    expect(given['transition']).toBe('fade');
  });

  test('a preview does not give them unless enableScriptExecution is on', async () => {
    const { engine, notebook } = await createEngine(note, false);
    const html = await engine.generateHTMLTemplateForPreview({
      inputString: note,
      config: notebook.config as WebviewConfig,
      vscodePreviewPanel: null,
    });
    const given = givenByPreview(html);

    expect(given).not.toHaveProperty('url');
    expect(given['dependencies']).toEqual([]);
    expect(given['transition']).toBe('fade');
  });

  test('with enableScriptExecution on, an export gives them as they are written', async () => {
    const { engine } = await createEngine(note, true);
    const given = givenByExport(await engine.htmlExportDocument());

    expect(given['dependencies']).toEqual(payload);
    expect(given['url']).toBe(url);
  });

  test('with enableScriptExecution on, a preview gives them as they are written', async () => {
    const { engine, notebook } = await createEngine(note, true);
    const html = await engine.generateHTMLTemplateForPreview({
      inputString: note,
      config: notebook.config as WebviewConfig,
      vscodePreviewPanel: null,
    });
    const given = givenByPreview(html);

    expect(given['dependencies']).toEqual(payload);
    expect(given['url']).toBe(url);
  });

  test('what is not a presentation is no configuration', async () => {
    const { engine } = await createEngine(
      '---\npresentation: nope\n---\n\n<!-- slide -->\n# One\n',
      true,
    );
    const given = givenByExport(await engine.htmlExportDocument());

    expect(given['margin']).toBe(0.1);
    expect(given['dependencies']).toEqual([]);
  });
});

describe('jsonForScript', () => {
  test.each([
    ['a string with an element in it', { a: '</script><script>x</script>' }],
    ['quotes, a backslash and a newline', { a: '"\\\n' }],
    ['characters that are not ASCII', { a: 'ünïcodé 😀' }],
    ['nothing', {}],
  ])('round-trips %s', (_, value) => {
    expect(JSON.parse(jsonForScript(value))).toEqual(value);
  });

  test('writes no `<`, so that nothing in the value can end the script', () => {
    expect(jsonForScript({ a: '<!-- </script' })).not.toContain('<');
  });

  test('writes what is not JSON as JSON.stringify writes it', () => {
    expect(jsonForScript(undefined)).toBe('undefined');
    expect(jsonForScript(960)).toBe('960');
  });
});
