import * as fs from 'fs';
import * as path from 'path';

/**
 * The vendored reveal.js (`dependencies/reveal/`) is managed by hand
 * (dependencies/README.md, "Updating the vendored reveal.js"): dist files
 * downloaded from jsDelivr, laid out as `js/reveal.js`, `css/reveal.css`,
 * `css/theme/<name>.css` and `plugin/notes/notes.js`, plus the MPE-custom
 * `vscode.css` and `none.css` themes. Nothing imports these files, and only
 * the browser presentation suite executes the bundle, so a broken or partial
 * update would otherwise ship silently. These checks guard the invariants
 * the engine and the themes rely on, the way `test/mermaid-bundle.test.ts`
 * guards the mermaid bundle.
 */

/**
 * Chromium-116+ APIs that the oldest supported webview (VS Code 1.82 /
 * Electron 25 / Chromium 114) lacks. Reveal's bundle must not call any of
 * them (reveal.js 6.0.2 does not; a future bump that starts to will fail
 * here, like the mermaid bundle guard does).
 */
const FLOOR_APIS: Array<{ label: string; usage: RegExp }> = [
  { label: 'Promise.withResolvers', usage: /Promise\.withResolvers/ },
  { label: 'Object.groupBy', usage: /Object\.groupBy/ },
  { label: 'Map.groupBy', usage: /Map\.groupBy/ },
  { label: 'Array.fromAsync', usage: /Array\.fromAsync/ },
];

/** The themes the notebook config offers (`RevealJsTheme` in types.ts). */
function readConfiguredThemes(): string[] {
  const types = fs.readFileSync(
    path.resolve(__dirname, '../src/notebook/types.ts'),
    'utf8',
  );
  const union = types.match(/export type RevealJsTheme =([\s\S]*?);/);
  expect(union).not.toBeNull();
  return [...union![1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
}

describe('vendored reveal.js', () => {
  const revealDir = path.resolve(__dirname, '../dependencies/reveal');
  const bundle = fs.readFileSync(path.join(revealDir, 'js/reveal.js'), 'utf8');
  const css = fs.readFileSync(path.join(revealDir, 'css/reveal.css'), 'utf8');
  const notesPlugin = fs.readFileSync(
    path.join(revealDir, 'plugin/notes/notes.js'),
    'utf8',
  );

  test('the bundle is the official UMD dist build, not truncated', () => {
    // The official reveal.js 6 dist is ~119 KB (4.x was ~250 KB minified —
    // the exact number is less important than being in its ballpark).
    expect(bundle.length).toBeGreaterThan(50_000);
    expect(bundle.startsWith('/*!\n * reveal.js')).toBe(true);
    // UMD wrapper exposing the `Reveal` global, the way the preview,
    // the webview (`window.Reveal`) and the exports use it.
    expect(bundle).toMatch(/Reveal=t\(\)/);
    expect(bundle.trimEnd().endsWith('});')).toBe(true);
    // The bundle embeds its version (`…=` "x.y.z"`); it has to be the one
    // the update checklist records in dependencies/README.md.
    const version = fs
      .readFileSync(
        path.resolve(__dirname, '../dependencies/README.md'),
        'utf8',
      )
      .match(/"reveal": "([\w.-]+)"/)?.[1];
    expect(version).not.toBeUndefined();
    expect(bundle).toContain('`' + version + '`');
  });

  test('parses on the Node 18 runtime floor (no newer syntax)', () => {
    // The bundle only executes in the browser, but Node-side tooling reads,
    // embeds, and serves the file, so it must stay parseable on the Node 18
    // extension host of the oldest supported VS Code (the check is
    // strongest under the Node 18 pin of CI).
    expect(() => new Function(bundle.trimEnd())).not.toThrow();
  });

  test('calls no Chromium-116+ API the oldest supported webview lacks', () => {
    const used = FLOOR_APIS.filter((api) => api.usage.test(bundle)).map(
      (api) => api.label,
    );
    expect(used).toEqual([]);
  });

  test('reveal.css has no `font: inherit` and carries the print styles', () => {
    // `font: inherit` breaks KaTeX/MathJax rendering in slides
    // (dependencies/README.md). The print-to-PDF styles are baked into
    // reveal.css since reveal.js 4 and keyed off the `reveal-print` class
    // the bundle adds under `?print-pdf` — the engine inlines reveal.css
    // alone, so both halves have to be present.
    expect(css.length).toBeGreaterThan(10_000);
    expect(css).not.toMatch(/font:\s*inherit/);
    expect(css).toContain('reveal-print');
  });

  test('every configured theme exists in css/theme, and every vendored theme is configured', () => {
    const themeDir = path.join(revealDir, 'css/theme');
    const vendored = fs
      .readdirSync(themeDir)
      .filter((name) => name.endsWith('.css'))
      .sort();
    expect(vendored).toEqual(readConfiguredThemes());
    // Each configured theme has to resolve for the engine's offline
    // inlining (`readFile` throws on a missing file).
    for (const name of vendored) {
      expect(fs.statSync(path.join(themeDir, name)).size).toBeGreaterThan(0);
    }
  });

  test('the custom themes keep their invariants', () => {
    // `none.css` disables theming: comment-only, no rules to get in the way.
    const none = fs.readFileSync(
      path.join(revealDir, 'css/theme/none.css'),
      'utf8',
    );
    expect(none).not.toMatch(/\{[^}]*:[^}]*\}/);
    // `vscode.css` maps the deck onto VS Code CSS variables; reveal.js 6
    // paints the viewport from `--r-background` (replacing the 4.x role of
    // `--r-background-color`), so the theme has to define both.
    const vscode = fs.readFileSync(
      path.join(revealDir, 'css/theme/vscode.css'),
      'utf8',
    );
    expect(vscode).toContain('--r-background:');
    expect(vscode).toContain('--r-background-color:');
    expect(vscode).toContain('--vscode-editor-background');
  });

  test('the notes plugin is the self-contained UMD dist build', () => {
    // The engine loads it as a plain script and passes its `RevealNotes`
    // global via the `plugins` config. reveal.js 6 embeds the speaker view
    // HTML in the plugin — nothing else is needed alongside it.
    expect(notesPlugin.length).toBeGreaterThan(20_000);
    expect(notesPlugin).toMatch(/RevealNotes=t\(\)/);
    expect(notesPlugin).toMatch(/id:\s*[`"']notes[`"']/);
    expect(notesPlugin).not.toContain('notes.html');
  });

  test('the engine loads the notes plugin the way reveal.js 6 requires', () => {
    // A script tag for the plugin (offline export path shown; the online
    // one copies the same file), registered through `plugins` — without
    // registration the plugin never initializes (the reveal.js 4 `src`
    // dependency loading did not register it either).
    const engine = fs.readFileSync(
      path.resolve(__dirname, '../src/markdown-engine/index.ts'),
      'utf8',
    );
    expect(engine).toContain("'./dependencies/reveal/plugin/notes/notes.js'");
    expect(engine).toContain('window.RevealNotes');
    expect(engine).toContain('plugins: [');
    // The removed `css/print/` directory must stay unreferenced.
    expect(engine).not.toContain('reveal/css/print/');
  });

  test('CDN fallback URLs in markdown-engine match the vendored version', () => {
    // Step 2 of the update checklist (dependencies/README.md) is a manual
    // version edit of src/markdown-engine/index.ts; this keeps a reveal.js
    // bump that skips it from shipping mismatched CDN versions.
    const readme = fs.readFileSync(
      path.resolve(__dirname, '../dependencies/README.md'),
      'utf8',
    );
    const version = readme.match(/"reveal": "([\w.-]+)"/)?.[1];
    expect(version).not.toBeUndefined();

    const engine = fs.readFileSync(
      path.resolve(__dirname, '../src/markdown-engine/index.ts'),
      'utf8',
    );
    const scriptUrls = [
      ...engine.matchAll(/npm\/reveal\.js@([\w.-]+)\/dist\/reveal\.js/g),
    ];
    const themeUrls = [
      ...engine.matchAll(/npm\/reveal\.js@([\w.-]+)\/dist\/theme\//g),
    ];
    expect(scriptUrls.length).toBeGreaterThan(0);
    expect(themeUrls.length).toBeGreaterThan(0);
    for (const url of [...scriptUrls, ...themeUrls]) {
      expect(url[1]).toBe(version);
    }
  });
});
