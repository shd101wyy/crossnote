import { renderBitfield } from '../src/renderers/bitfield';

describe('Bitfield renderer', () => {
  it('renders a basic bit-field definition to HTML', async () => {
    const code = `[
      { "name": "IPO",   "bits": 8, "attr": "RO" },
      { "bits": 7 },
      { "name": "BRK",   "bits": 5, "attr": "RW", "type": 4 },
      { "name": "CPK",   "bits": 1 },
      { "name": "Clear", "bits": 3 },
      { "bits": 8 }
    ]`;
    const result = await renderBitfield(code, {});
    expect(typeof result).toBe('string');
    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
  });

  it('returns escaped error markup on invalid input', async () => {
    const result = await renderBitfield('not-valid-json[', {});
    expect(typeof result).toBe('string');
    expect(result).toContain('<pre class="language-text">');
  });
});
