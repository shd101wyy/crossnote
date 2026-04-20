import { renderTikz } from '../src/renderers/tikz';

describe('TikZ renderer', () => {
  it('renders basic TikZ to SVG', async () => {
    const code = '\\begin{tikzpicture}\\draw (0,0) -- (1,1);\\end{tikzpicture}';
    const result = await renderTikz(code);
    expect(typeof result).toBe('string');
    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
  });

  it('renders TikZ with options to SVG', async () => {
    const code = '\\begin{tikzpicture}\\draw (0,0) -- (1,1);\\end{tikzpicture}';
    const result = await renderTikz(code, {
      tikzLibraries: 'arrows.meta',
      texPackages: { pgfplots: '' },
    });
    expect(typeof result).toBe('string');
    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
  });
});
