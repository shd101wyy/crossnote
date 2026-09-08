import { renderTikz } from '../src/renderers/tikz';

describe('TikZ renderer', () => {
  // node-tikzjax compiles TeX in a WASM VM; on the Node 18 CI runtime a cold
  // compile can exceed Jest's 5s default under parallel worker load.
  const TIKZ_TIMEOUT = 30_000;

  it(
    'renders basic TikZ to SVG',
    async () => {
      const code =
        '\\begin{tikzpicture}\\draw (0,0) -- (1,1);\\end{tikzpicture}';
      const result = await renderTikz(code);
      expect(typeof result).toBe('string');
      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
    },
    TIKZ_TIMEOUT,
  );

  it(
    'renders TikZ with options to SVG',
    async () => {
      const code =
        '\\begin{tikzpicture}\\draw (0,0) -- (1,1);\\end{tikzpicture}';
      const result = await renderTikz(code, {
        tikzLibraries: 'arrows.meta',
        texPackages: { pgfplots: '' },
      });
      expect(typeof result).toBe('string');
      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
    },
    TIKZ_TIMEOUT,
  );
});
