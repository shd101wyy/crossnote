import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import {
  getCrossnoteBuildDirectory,
  setCrossnoteBuildDirectory,
} from '../src/utility';

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

  /**
   * A two-slide deck with speaker notes enabled, exported as HTML.
   */
  async function exportDeck(options: { offline: boolean }): Promise<string> {
    fs.writeFileSync(
      path.join(tmpDir, 'deck.md'),
      [
        '---',
        'presentation:',
        '  theme: white.css',
        '  enableSpeakerNotes: true',
        '---',
        '',
        '<!-- slide -->',
        '# One',
        '',
        '<!-- slide -->',
        '# Two',
        '',
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
