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

describe('Bitfield parser security', () => {
  it('parses bitfield with unquoted keys', async () => {
    const code = `[
      { name: "IPO", bits: 8, attr: "RO" },
      { bits: 7 }
    ]`;
    const result = await renderBitfield(code, {});
    expect(typeof result).toBe('string');
    expect(result).toContain('<svg');
  });

  it('parses bitfield with single-quoted strings', async () => {
    const code = `[
      { name: 'IPO', bits: 8, attr: 'RO' }
    ]`;
    const result = await renderBitfield(code, {});
    expect(typeof result).toBe('string');
    expect(result).toContain('<svg');
  });

  it('parses bitfield with trailing commas', async () => {
    const code = `[
      { name: "IPO", bits: 8, attr: "RO", },
      { name: "BRK", bits: 5, attr: "RW", },
      { bits: 7, },
    ]`;
    const result = await renderBitfield(code, {});
    expect(typeof result).toBe('string');
    expect(result).toContain('<svg');
  });

  it('parses bitfield with // comments', async () => {
    const code = `[
      // interrupt pending register
      { name: "IPO", bits: 8, attr: "RO" },
      { bits: 7 }
    ]`;
    const result = await renderBitfield(code, {});
    expect(typeof result).toBe('string');
    expect(result).toContain('<svg');
  });

  it('parses bitfield with hex numbers', async () => {
    const code = `[
      { name: "STATUS", bits: 8, addr: 0x0F }
    ]`;
    const result = await renderBitfield(code, {});
    expect(typeof result).toBe('string');
    expect(result).toContain('<svg');
  });

  it('blocks code execution via function call', async () => {
    const code = '(() => { throw new Error("pwned"); })()';
    const result = await renderBitfield(code, {});
    expect(result).toContain('<pre class="language-text">');
  });

  it('blocks code execution via constructor access', async () => {
    const code = 'this.constructor.constructor("return process")()';
    const result = await renderBitfield(code, {});
    expect(result).toContain('<pre class="language-text">');
  });
});
