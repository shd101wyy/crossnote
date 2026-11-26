import * as fs from 'fs';
import { load } from 'cheerio';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import {
  getCrossnoteBuildDirectory,
  setCrossnoteBuildDirectory,
} from '../src/utility';
import { readAgain } from './fixtures/mutating-markup';

/**
 * The presentation (reveal.js) wiring of HTML exports: the engine emits the
 * reveal.js script, the inlined `reveal.css` + theme, and — with
 * `presentation.enableSpeakerNotes` — the notes plugin the way reveal.js 6
 * requires (plugin script before initialization, registered via `plugins`),
 * and `htmlExport` copies that plugin next to the exported document as
 * `revealjs_deps/notes.js`. Like `test/html-export-offline-embed.test.ts`,
 * these run against a fake build directory so they stay hermetic.
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

describe('presentation HTML export (reveal.js)', () => {
  track();

  const originalBuildDirectory = getCrossnoteBuildDirectory();
  let tmpDir: string;
  const notesPluginContent = '/* vendored notes plugin (RevealNotes) */';

  beforeAll(() => {
    // vscode-uri (used for the notebook root) lowercases a Windows drive
    // letter; normalize the temp dir once so derived expectations agree
    // (a no-op on POSIX, where paths start with "/").
    tmpDir = mkdirSync({ prefix: 'xnote-presentation-export' }).replace(
      /^([A-Za-z]):/,
      (_, d) => d.toLowerCase() + ':',
    );
    const revealDir = path.join(tmpDir, 'dependencies', 'reveal');
    fs.mkdirSync(path.join(revealDir, 'js'), { recursive: true });
    fs.mkdirSync(path.join(revealDir, 'css', 'theme'), { recursive: true });
    fs.mkdirSync(path.join(revealDir, 'plugin', 'notes'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'styles', 'preview_theme'), {
      recursive: true,
    });
    fs.mkdirSync(path.join(tmpDir, 'styles', 'prism_theme'), {
      recursive: true,
    });
    // The theme inlining sits in the same `try` as the prism theme read,
    // so the prism theme the deck resolves to must exist for the export
    // to reach it (`white.css` → `default.css` in presentation mode).
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'prism_theme', 'default.css'),
      '/* prism:default */',
    );
    fs.writeFileSync(
      path.join(revealDir, 'js', 'reveal.js'),
      '/* reveal:js */',
    );
    fs.writeFileSync(
      path.join(revealDir, 'css', 'reveal.css'),
      '/* reveal:base */',
    );
    fs.writeFileSync(
      path.join(revealDir, 'css', 'theme', 'white.css'),
      '/* reveal:theme-white */',
    );
    fs.writeFileSync(
      path.join(revealDir, 'plugin', 'notes', 'notes.js'),
      notesPluginContent,
    );
    setCrossnoteBuildDirectory(tmpDir);
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(originalBuildDirectory);
  });

  const twoSlides = [
    '<!-- slide -->',
    '# One',
    '',
    '<!-- slide -->',
    '# Two',
    '',
  ];

  /**
   * A deck with speaker notes enabled, exported as HTML.
   */
  async function exportDeck(
    options: { offline: boolean },
    slides: string[] = twoSlides,
  ): Promise<string> {
    fs.writeFileSync(
      path.join(tmpDir, 'deck.md'),
      [
        '---',
        'presentation:',
        '  theme: white.css',
        '  enableSpeakerNotes: true',
        '---',
        '',
        ...slides,
      ].join('\n'),
    );
    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
        mathRenderingOption: 'KaTeX',
      },
    });
    const engine = new MarkdownEngine({
      notebook,
      filePath: path.join(tmpDir, 'deck.md'),
    });
    const dest = await engine.htmlExport({ offline: options.offline });
    return fs.readFileSync(dest, 'utf8');
  }

  test('speaker notes load before initialization and register via plugins (cdn)', async () => {
    const html = await exportDeck({ offline: false });

    // The reveal.js 6 dist script and the notes plugin, then the init
    // script registering the plugin global. (The exported document goes
    // through cheerio, which normalizes the attributes to double quotes.)
    expect(html).toMatch(
      /<script src="https:\/\/[^']*reveal\.js@\d[\w.-]*\/dist\/reveal\.js"><\/script>/,
    );
    const notesAt = html.indexOf('src="revealjs_deps/notes.js"');
    const initAt = html.indexOf('Reveal.initialize');
    expect(notesAt).toBeGreaterThanOrEqual(0);
    expect(initAt).toBeGreaterThan(notesAt);
    expect(html).toMatch(
      /Reveal\.initialize\(Object\.assign\(\{.*"scrollActivationWidth":null.*"enableSpeakerNotes":true.*\}, \{ plugins: \[window\.RevealNotes\] \}\)\)/s,
    );

    // The reveal.css is inlined (the reveal.js 6 print styles are baked
    // into it — there is no separate stylesheet to load); the theme stays
    // on the CDN.
    expect(html).toContain('/* reveal:base */');
    expect(html).toMatch(
      /<link rel="stylesheet" href="https:\/\/[^']*reveal\.js@\d[\w.-]*\/dist\/theme\/white\.css">/,
    );

    // `htmlExport` copies the self-contained plugin next to the document.
    const copied = fs.readFileSync(
      path.join(tmpDir, 'revealjs_deps', 'notes.js'),
      'utf8',
    );
    expect(copied).toBe(notesPluginContent);
  });

  test('reports when reveal.js has laid the pages of a PDF export out', async () => {
    const html = await exportDeck({ offline: false });

    // A PDF export through Chrome waits for it before the pages are printed.
    const reportAt = html.indexOf(
      "Reveal.addEventListener('pdf-ready', () => { window.__crossnotePrintLayoutReady = true })",
    );
    expect(reportAt).toBeGreaterThanOrEqual(0);
    expect(html.indexOf('Reveal.initialize')).toBeGreaterThan(reportAt);
    // No diagram is drawn on the page: Reveal is started where the script
    // stands, by a classic script.
    expect(html).toContain('<script>\n');
    expect(html).not.toContain('__crossnoteDiagramsDrawn');
  });

  test('with Mermaid diagrams, starts reveal.js once they are drawn in a PDF export', async () => {
    // The second slide of the deck holds a diagram.
    const html = await exportDeck(
      { offline: true },
      twoSlides
        .slice(0, 4)
        .concat(['```mermaid', 'graph TD', 'A --> B', '```', '']),
    );

    // reveal.js lays the pages of a PDF export out from the slides as it
    // finds them, and moves every slide into its page. The diagrams are
    // drawn first: the script that starts Reveal waits for the one that
    // draws them, and stands before it.
    const waitsAt = html.indexOf(
      'await new Promise(resolve => { window.__crossnoteDiagramsDrawn = resolve })',
    );
    const initializeAt = html.indexOf('Reveal.initialize');
    const drawsAt = html.indexOf('mermaid.startOnLoad = false');
    expect(waitsAt).toBeGreaterThanOrEqual(0);
    expect(initializeAt).toBeGreaterThan(waitsAt);
    expect(drawsAt).toBeGreaterThan(initializeAt);
    expect(html).toContain(
      "Reveal.addEventListener('pdf-ready', () => { window.__crossnotePrintLayoutReady = true })",
    );
  });

  test('the notes plugin is copied in full by the time the export is written', async () => {
    // The plugin is loaded, and the presentation started, as soon as the
    // exported file is opened: reveal.js 6 does not start from a truncated
    // copy. A copy left to finish on its own is not done by then; this one
    // takes many turns of its own, where the real one takes one.
    const plugin = path.join(
      tmpDir,
      'dependencies',
      'reveal',
      'plugin',
      'notes',
      'notes.js',
    );
    const copy = path.join(tmpDir, 'revealjs_deps', 'notes.js');
    const large = Buffer.concat([
      Buffer.from('/*'),
      Buffer.alloc(8 * 1024 * 1024, '/'),
      Buffer.from('*/'),
    ]);
    fs.writeFileSync(plugin, large);
    fs.rmSync(copy, { force: true });
    try {
      await exportDeck({ offline: false });
      expect(fs.readFileSync(copy).equals(large)).toBe(true);
    } finally {
      fs.writeFileSync(plugin, notesPluginContent);
    }
  });

  test('a slide has neither an event handler, nor a background iframe or speaker notes that would run script', async () => {
    // The notes are markup that a page reads differently from the sanitizer:
    // reveal.js reads them once more, into the window of its speaker view.
    const html = await exportDeck({ offline: false }, [
      `<!-- slide class="mine" onmouseover="alert(1)" data-background-iframe="javascript:alert(1)" data-notes='<form><math><mtext></form><form><mglyph><style></math><input autofocus onfocus=alert(2)><b>Speak</b>' -->`,
      '# One',
      '',
    ]);
    const attributes = load(html)('section.slide')
      .toArray()
      .flatMap((section) => Object.entries(section.attribs));
    const notes = Object.fromEntries(attributes)['data-notes'];

    // Whatever else the slide says.
    expect(attributes.filter(([name]) => /^on/i.test(name))).toEqual([]);
    expect(attributes.map(([name]) => name)).not.toContain(
      'data-background-iframe',
    );
    expect(Object.fromEntries(attributes)).toMatchObject({
      class: 'slide mine',
    });
    expect(readAgain(notes)).toEqual([]);
    expect(notes).toContain('<b>Speak</b>');
  });

  test('a fragment of a slide has no speaker notes that would run script either', async () => {
    // reveal.js writes the notes of a fragment into its speaker view too. It
    // finds a fragment by its classes — `fragment`, and `current-fragment`
    // for the one that is shown — and to a browser neither the case of a
    // class nor that of the name of the attribute is another attribute.
    const html = await exportDeck({ offline: false }, [
      '<!-- slide -->',
      '# One',
      '',
      `<p class="fragment" data-notes='<input autofocus onfocus=alert(2)><b>Speak</b>'>A point</p>`,
      `<p class="current-fragment" data-notes='<input autofocus onfocus=alert(4)>'>Shown</p>`,
      '',
      `- another <!-- .element: class="fragment" data-notes='<img src=x onerror=alert(3)>' -->`,
      `- a third <!-- .element: CLASS="fragment" data-notes='<img src=y onerror=alert(5)>' -->`,
      `- a fourth <!-- .element: class="fragment" DATA-NOTES='<img src=z onerror=alert(6)>' -->`,
      '',
    ]);
    const notes = load(html)('.slides *')
      .toArray()
      .flatMap((el) =>
        Object.entries(el.attribs).filter(
          ([name]) => name.toLowerCase() === 'data-notes',
        ),
      )
      .map(([, value]) => value);

    expect(notes).toEqual([
      '<input autofocus=""><b>Speak</b>',
      '<input autofocus="">',
      '<img src="x">',
      '<img src="y">',
      '<img src="z">',
    ]);
  });

  test('offline export inlines reveal.js and the notes plugin, self-contained', async () => {
    const html = await exportDeck({ offline: true });

    // The offline export is fully self-contained (`embedOfflineAssets`):
    // the bundle and the notes plugin are inlined, in that order, before
    // the init script registers the plugin.
    expect(html).toContain('/* reveal:js */');
    const notesAt = html.indexOf(notesPluginContent);
    const initAt = html.indexOf('Reveal.initialize');
    expect(notesAt).toBeGreaterThanOrEqual(0);
    expect(initAt).toBeGreaterThan(notesAt);
    expect(html).toMatch(
      /Reveal\.initialize\(Object\.assign\(\{.*\}, \{ plugins: \[window\.RevealNotes\] \}\)\)/s,
    );
    expect(html).not.toContain('revealjs_deps/notes.js');
    expect(html).not.toMatch(/https:\/\/[^']*reveal\.js@/);
  });
});
