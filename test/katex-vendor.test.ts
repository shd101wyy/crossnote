import katex from 'katex';
import 'katex/contrib/mhchem';
import * as fs from 'fs';
import * as path from 'path';

/**
 * The vendored KaTeX assets (dependencies/katex/katex.min.css + fonts) and
 * the npm dependency must move together: KaTeX 0.18 prefixed its internal
 * structural classes (.base -> .katex-base, .strut -> .katex-strut, ...), so
 * a JS bump without the matching CSS (or vice versa) silently breaks layout,
 * and a CDN fallback left on the old version does the same for online
 * exports. These checks keep a KaTeX bump that skips part of the checklist
 * (dependencies/README.md) from shipping.
 */
describe('vendored katex assets', () => {
  const cssPath = path.resolve(
    __dirname,
    '../dependencies/katex/katex.min.css',
  );
  const css = fs.readFileSync(cssPath, 'utf8');

  const installed = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../node_modules/katex/package.json'),
      'utf8',
    ),
  ) as { version: string };

  test('vendored css matches the installed katex version', () => {
    // katex.min.css embeds its version as the .katex-version marker content.
    const marker = css.match(/\.katex-version:after\{content:"([\d.]+)"/);
    expect(marker).not.toBeNull();
    expect(marker?.[1]).toBe(installed.version);
  });

  test('CDN fallback URL in markdown-engine matches the installed katex', () => {
    const engine = fs.readFileSync(
      path.resolve(__dirname, '../src/markdown-engine/index.ts'),
      'utf8',
    );
    const fallbacks = [
      ...engine.matchAll(/npm\/katex@([\w.-]+)\/dist\/katex\.min\.css/g),
    ];
    expect(fallbacks.length).toBeGreaterThan(0);
    for (const fallback of fallbacks) {
      expect(fallback[1]).toBe(installed.version);
    }
  });

  test('structural classes emitted by the installed katex exist in the vendored css', () => {
    // The classes KaTeX emits on the HTML side must be styled by the
    // vendored CSS. This is the guard for the 0.18 internal-class
    // prefixing: mismatched JS/CSS versions drop layout rules entirely.
    const html = katex.renderToString('x + \\frac{1}{2}', {
      displayMode: true,
    });
    const classes = new Set<string>();
    for (const match of html.matchAll(/class="([^"]+)"/g)) {
      match[1].split(' ').forEach((className) => classes.add(className));
    }
    expect(classes.has('katex')).toBe(true);
    expect(classes.has('katex-base')).toBe(true);
    expect(classes.has('katex-strut')).toBe(true);
    for (const className of classes) {
      // mord/mspace/mbin/... are semantic classes styled via compound
      // selectors; the structural katex-* ones must appear verbatim.
      if (className.startsWith('katex-')) {
        expect(css).toContain(`.${className}`);
      }
    }
  });

  test('mhchem extension still loads and renders', () => {
    // katex/contrib/mhchem is loaded for \ce{} support; make sure the
    // side-effect import still registers the function after a bump.
    const html = katex.renderToString('\\ce{H2O}', { throwOnError: true });
    expect(html).toContain('class="katex"');
  });
});
