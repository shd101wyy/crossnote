/**
 * `.crossnote/style.less` is compiled and inlined into a `<style>` tag, so its
 * relative `url(...)` references would be resolved against the *preview
 * document* rather than against the stylesheet — inside a VS Code webview that
 * is `vscode-webview://<uuid>/`, where nothing exists. Local `@font-face`
 * fonts therefore fell back silently while remote ones kept working
 * (vscode-mpe#2424).
 *
 * Relative references are resolved to absolute paths when style.less is
 * loaded (the last point at which its directory is known — a host may
 * concatenate the global and workspace stylesheets afterwards) and turned into
 * loadable URLs at render time.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  mapAbsoluteCssUrls,
  resolveRelativeCssUrls,
} from '../src/lib/css-urls';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import { WebviewConfig } from '../src/notebook/types';
import { useExternalAddFileProtocolFunction } from '../src/utility';

/**
 * less does not run under jest (see head-html-sanitize.test.ts); the compiled
 * CSS is fed in directly, which is what the url rewriting operates on anyway.
 */
let mockLessOutput = '';
jest.mock('less', () => ({
  render: (
    _input: string,
    _options: unknown,
    callback: (error: unknown, output: { css: string } | undefined) => void,
  ) => {
    callback(null, { css: mockLessOutput });
  },
}));

const exists = (filePath: string) => Promise.resolve(fs.existsSync(filePath));

/**
 * Mirror of the producer's CSS string escaping, for building expectations:
 * on Windows every `\` in a path is emitted doubled inside `url("…")`.
 */
const cssEscaped = (p: string) => p.replace(/(["\\])/g, '\\$1');

describe('resolveRelativeCssUrls', () => {
  track();

  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdirSync({ prefix: 'xnote-css' });
    fs.mkdirSync(path.join(baseDir, 'fonts'), { recursive: true });
    fs.writeFileSync(path.join(baseDir, 'fonts', 'MyFont.woff2'), 'x');
  });

  it('resolves a relative @font-face src to an absolute path', async () => {
    const out = await resolveRelativeCssUrls(
      `@font-face { font-family: 'X'; src: url('fonts/MyFont.woff2') format('woff2'); }`,
      baseDir,
      exists,
    );
    expect(out).toContain(
      `url("${cssEscaped(path.join(baseDir, 'fonts', 'MyFont.woff2'))}") format('woff2')`,
    );
  });

  it('resolves ./-prefixed and unquoted forms alike', async () => {
    const abs = path.join(baseDir, 'fonts', 'MyFont.woff2');
    for (const raw of [
      `url(./fonts/MyFont.woff2)`,
      `url("./fonts/MyFont.woff2")`,
      `url( 'fonts/MyFont.woff2' )`,
    ]) {
      expect(
        await resolveRelativeCssUrls(`a { src: ${raw}; }`, baseDir, exists),
      ).toContain(`url("${cssEscaped(abs)}")`);
    }
  });

  it('leaves absolute, protocol-relative and data URLs alone', async () => {
    const css = `a {
      a: url('https://fonts.gstatic.com/s/x.woff2');
      b: url("//cdn.example.com/x.woff2");
      c: url(data:font/woff2;base64,AAAA);
      d: url(file:///already/absolute.woff2);
    }`;
    expect(await resolveRelativeCssUrls(css, baseDir, exists)).toBe(css);
  });

  it('leaves fragment-only references alone (SVG paint servers)', async () => {
    const css = `a { fill: url(#gradient); }`;
    expect(await resolveRelativeCssUrls(css, baseDir, exists)).toBe(css);
  });

  it('leaves root-relative references alone', async () => {
    const css = `a { src: url(/fonts/MyFont.woff2); }`;
    expect(await resolveRelativeCssUrls(css, baseDir, exists)).toBe(css);
  });

  it('leaves references to files that do not exist alone', async () => {
    const css = `a { background-image: url("./fonts/missing.png"); }`;
    expect(await resolveRelativeCssUrls(css, baseDir, exists)).toBe(css);
  });

  it('refuses to escape the stylesheet directory', async () => {
    const outside = path.join(path.dirname(baseDir), 'outside.woff2');
    fs.writeFileSync(outside, 'x');
    const css = `a { src: url("../outside.woff2"); }`;
    expect(await resolveRelativeCssUrls(css, baseDir, exists)).toBe(css);
  });

  it('carries a ?query or #fragment suffix across the rewrite', async () => {
    const abs = path.join(baseDir, 'fonts', 'MyFont.woff2');
    const out = await resolveRelativeCssUrls(
      `a { src: url('fonts/MyFont.woff2?v=2'); }`,
      baseDir,
      exists,
    );
    expect(out).toContain(`url("${cssEscaped(abs)}?v=2")`);
  });

  it('normalizes a drive-relative or mixed-separator baseDir (Windows hosts)', async () => {
    // `crossnote serve`/`build-wiki` round-trip plain `C:\…` paths through
    // `URI.parse`, which drops the drive letter; forward slashes appear when
    // a host hands over URL-style paths. `path.resolve(baseDir, …)` re-adds
    // the drive / flips the separators, so the boundary must be normalized
    // the same way or every resolution silently fails the containment check.
    const mixed = baseDir.split(path.sep).join('/');
    const fontPath = path.join(baseDir, 'fonts', 'MyFont.woff2');
    const out = await resolveRelativeCssUrls(
      `a { src: url('fonts/MyFont.woff2'); }`,
      mixed,
      exists,
    );
    expect(out).toContain(`url("${cssEscaped(fontPath)}")`);
  });

  it('rewrites each reference against its own directory, before any merge', async () => {
    // What the VS Code extension does: global + workspace style.less are
    // concatenated into one globalCss, so each half must already be resolved.
    const other = mkdirSync({ prefix: 'xnote-css-global' });
    fs.writeFileSync(path.join(other, 'MyFont.woff2'), 'x');

    const merged =
      (await resolveRelativeCssUrls(
        `a { src: url(MyFont.woff2); }`,
        other,
        exists,
      )) +
      (await resolveRelativeCssUrls(
        `b { src: url(fonts/MyFont.woff2); }`,
        baseDir,
        exists,
      ));

    expect(merged).toContain(
      `url("${cssEscaped(path.join(other, 'MyFont.woff2'))}")`,
    );
    expect(merged).toContain(
      `url("${cssEscaped(path.join(baseDir, 'fonts', 'MyFont.woff2'))}")`,
    );
  });
});

describe('mapAbsoluteCssUrls', () => {
  it('maps absolute filesystem paths and nothing else', () => {
    const css = `a {
      a: url("/abs/MyFont.woff2");
      b: url('https://example.com/x.woff2');
      c: url(#gradient);
      d: url(relative/x.woff2);
    }`;
    const out = mapAbsoluteCssUrls(css, (p) => `webview://${p}`);
    expect(out).toContain('url("webview:///abs/MyFont.woff2")');
    expect(out).toContain(`url('https://example.com/x.woff2')`);
    expect(out).toContain('url(#gradient)');
    expect(out).toContain('url(relative/x.woff2)');
  });

  it('maps Windows-style absolute paths', () => {
    const out = mapAbsoluteCssUrls(
      `a { src: url("C:\\\\f\\\\x.woff2"); }`,
      () => 'mapped',
    );
    expect(out).toContain('url("mapped")');
  });

  it('keeps a ?query out of the mapped path', () => {
    const seen: string[] = [];
    const out = mapAbsoluteCssUrls(
      `a { src: url("/abs/x.woff2?v=2"); }`,
      (p) => {
        seen.push(p);
        return `webview://${p}`;
      },
    );
    expect(seen).toEqual(['/abs/x.woff2']);
    expect(out).toContain('url("webview:///abs/x.woff2?v=2")');
  });

  it('undoes the CSS string escapes before mapping, so hosts get real paths', () => {
    // The stored value went through `escapeCssUrl`: every Windows backslash
    // is doubled. `Uri.file`/`pathToFileURL` would keep the doubled
    // separators, so the escapes must be folded back before `toUrl` runs —
    // while single backslashes a user wrote themselves stay untouched.
    const realPath = 'C:\\f\\My Font.woff2'; // C:\f\My Font.woff2
    const seen: string[] = [];
    const out = mapAbsoluteCssUrls(
      `a { src: url("${cssEscaped(realPath)}"); }`,
      (p) => {
        seen.push(p);
        return `webview://${p}`;
      },
    );
    expect(seen).toEqual([realPath]);
    expect(out).toContain(`url("${cssEscaped(`webview://${realPath}`)}")`);
  });

  it('does not mangle single backslashes it did not escape itself', () => {
    const seen: string[] = [];
    mapAbsoluteCssUrls(`a { src: url("C:\\f\\x.woff2"); }`, (p) => {
      seen.push(p);
      return 'mapped';
    });
    // `C:\f\x.woff2` with single backslashes passes through unchanged.
    expect(seen).toEqual(['C:\\f\\x.woff2']);
  });
});

describe('style.less url() resolution, end to end (vscode-mpe#2424)', () => {
  track();

  async function buildNotebook() {
    const tmpDir = mkdirSync({ prefix: 'xnote-2424' });
    const configDir = path.join(tmpDir, '.crossnote');
    fs.mkdirSync(path.join(configDir, 'fonts'), { recursive: true });
    fs.writeFileSync(path.join(configDir, 'fonts', 'MyFont.woff2'), 'x');
    fs.writeFileSync(
      path.join(configDir, 'style.less'),
      '/* compiled by mock */',
    );

    mockLessOutput = `@font-face {
  font-family: 'MyFont';
  src: url('fonts/MyFont.woff2') format('woff2');
}
@font-face {
  font-family: 'Remote';
  src: url('https://fonts.gstatic.com/s/x.woff2') format('woff2');
}`;

    const testMdPath = path.join(tmpDir, 'test.md');
    fs.writeFileSync(testMdPath, '# Test');

    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: { markdownParser: 'markdown-it', markdownYoBinaryPath: '' },
    });
    const engine = new MarkdownEngine({ notebook, filePath: testMdPath });
    const fontPath = path.join(configDir, 'fonts', 'MyFont.woff2');
    return { notebook, engine, fontPath };
  }

  it('stores the font as an absolute path in globalCss', async () => {
    const { notebook, fontPath } = await buildNotebook();
    expect(notebook.config.globalCss).toContain(
      `url("${cssEscaped(fontPath)}")`,
    );
    // The remote font is untouched — it already worked, and still does.
    expect(notebook.config.globalCss).toContain(
      `url('https://fonts.gstatic.com/s/x.woff2')`,
    );
  });

  it('renders the font as a webview URI in the preview', async () => {
    const { notebook, engine, fontPath } = await buildNotebook();
    const restore = useExternalAddFileProtocolFunction(
      (filePath) => `https://file%2B.vscode-resource.vscode-cdn.net${filePath}`,
    );
    try {
      const html = await engine.generateHTMLTemplateForPreview({
        inputString: '# Test',
        config: notebook.config as WebviewConfig,
        // The hook only fires when a panel is present, as in the extension.
        vscodePreviewPanel: {} as never,
      });
      // The mapper receives the real (unescaped) path; the emitted CSS
      // re-escapes it for the quoted url() string, hence cssEscaped here.
      expect(html).toContain(
        `https://file%2B.vscode-resource.vscode-cdn.net${cssEscaped(fontPath)}`,
      );
      expect(html).not.toContain(`url('fonts/MyFont.woff2')`);
    } finally {
      restore();
    }
  });

  it('renders the font as a file:// URL when exporting HTML', async () => {
    const { engine } = await buildNotebook();
    const html = await engine.generateHTMLTemplateForExport(
      '<h1>Test</h1>',
      {},
      {
        isForPrint: false,
        isForPrince: false,
        offline: false,
        embedLocalImages: false,
        embedSVG: true,
      },
    );
    expect(html).toMatch(/url\("file:\/\/.*MyFont\.woff2"\)/);
  });
});
