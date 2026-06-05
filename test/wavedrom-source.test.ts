import { normalizeWavedromSource } from '../src/renderers/wavedrom-source';

describe('normalizeWavedromSource (shd101wyy/vscode-markdown-preview-enhanced#2315)', () => {
  describe('accepts and normalizes valid WaveDrom data', () => {
    it('passes through strict JSON unchanged in meaning', () => {
      expect(normalizeWavedromSource('{"signal":[]}')).toBe('{"signal":[]}');
    });

    it('normalizes unquoted keys to strict JSON', () => {
      expect(normalizeWavedromSource('{ signal: [] }')).toBe('{"signal":[]}');
    });

    it('normalizes single-quoted strings, trailing commas, and comments', () => {
      const out = normalizeWavedromSource(`{
        // clock
        signal: [
          { name: 'clk', wave: 'p..', },
        ],
      }`);
      expect(out).toBe('{"signal":[{"name":"clk","wave":"p.."}]}');
    });

    it('accepts the reg root used by bitfield-style diagrams', () => {
      expect(normalizeWavedromSource('{ reg: [ { bits: 8 } ] }')).toBe(
        '{"reg":[{"bits":8}]}',
      );
    });

    it('preserves hex numbers as their decimal value', () => {
      expect(normalizeWavedromSource('{ addr: 0xFF }')).toBe('{"addr":255}');
    });
  });

  describe('rejects non-data / executable input', () => {
    it('returns null for a function-call payload', () => {
      expect(normalizeWavedromSource('alert(1)')).toBeNull();
    });

    it('returns null for an IIFE', () => {
      expect(
        normalizeWavedromSource('(()=>{return globalThis.process})()'),
      ).toBeNull();
    });

    it('returns null for constructor-escape payloads', () => {
      expect(
        normalizeWavedromSource('this.constructor.constructor("return 1")()'),
      ).toBeNull();
    });

    it('returns null for bare scalars (not a diagram object)', () => {
      expect(normalizeWavedromSource('42')).toBeNull();
      expect(normalizeWavedromSource('"clk"')).toBeNull();
      expect(normalizeWavedromSource('null')).toBeNull();
    });

    it('returns null for empty / whitespace input', () => {
      expect(normalizeWavedromSource('')).toBeNull();
      expect(normalizeWavedromSource('   ')).toBeNull();
    });
  });

  describe('neutralizes </script> breakout', () => {
    it('escapes < so a </script> string value cannot close the container', () => {
      const out = normalizeWavedromSource(
        '{ "name": "</script><img src=x onerror=alert(1)>" }',
      );
      expect(out).not.toBeNull();
      expect(out).not.toContain('</script>');
      expect(out).toContain('\\u003c/script>');
    });

    it('produces output that is still valid JSON round-tripping the data', () => {
      const out = normalizeWavedromSource('{ "n": "a<b" }');
      expect(out).toBe('{"n":"a\\u003cb"}');
      expect(JSON.parse(out as string)).toEqual({ n: 'a<b' });
    });
  });
});
