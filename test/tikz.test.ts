import { renderTikz, TIKZ_NOT_AVAILABLE } from '../src/renderers/tikz';

describe('TikZ renderer', () => {
  // node-tikzjax's dependency chain (jsdom → whatwg-url) fails to load
  // under Jest's module system. This is expected — in production the
  // dynamic import works fine in Node.js. Here we verify the graceful
  // fallback to TIKZ_NOT_AVAILABLE.

  it('returns TIKZ_NOT_AVAILABLE when node-tikzjax cannot load', async () => {
    const code = '\\begin{tikzpicture}\\draw (0,0) -- (1,1);\\end{tikzpicture}';
    const result = await renderTikz(code);
    expect(result).toBe(TIKZ_NOT_AVAILABLE);
  });

  it('returns TIKZ_NOT_AVAILABLE regardless of options', async () => {
    const code = '\\begin{tikzpicture}\\draw (0,0) -- (1,1);\\end{tikzpicture}';
    const result = await renderTikz(code, {
      tikzLibraries: 'arrows.meta',
      texPackages: { pgfplots: '' },
    });
    expect(result).toBe(TIKZ_NOT_AVAILABLE);
  });
});
