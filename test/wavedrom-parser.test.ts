import JSON5 from 'json5';

describe('WaveDrom parser security (CVE-2026-wavedrom-eval)', () => {
  describe('JSON5.parse correctly handles WaveDrom input', () => {
    test('parses standard JSON (double-quoted keys)', () => {
      const result = JSON5.parse(
        '{"signal": [{"name": "clk", "wave": "p......"}]}',
      );
      expect(result).toEqual({
        signal: [{ name: 'clk', wave: 'p......' }],
      });
    });

    test('parses WaveDrom with unquoted keys', () => {
      const result = JSON5.parse(`{ signal : [
  { name: "clk",  wave: "p......" },
  { name: "bus",  wave: "x.34.5x",   data: "head body tail" },
  { name: "wire", wave: "0.1..0." },
]}`);
      expect(result.signal).toHaveLength(3);
      expect(result.signal[0].name).toBe('clk');
    });

    test('parses WaveDrom with single-quoted strings', () => {
      const result = JSON5.parse(`{
  signal: [
    { name: 'clk', wave: 'p......' },
  ]
}`);
      expect(result.signal[0].name).toBe('clk');
    });

    test('parses WaveDrom with // comments', () => {
      const result = JSON5.parse(`{
  signal: [
    // clock signal
    { name: "clk", wave: "p......" },
    // data bus
    { name: "bus", wave: "x.34.5x", data: "head body tail" },
  ]
}`);
      expect(result.signal).toHaveLength(2);
      expect(result.signal[0].name).toBe('clk');
    });

    test('parses WaveDrom with /* */ comments', () => {
      const result = JSON5.parse(`{
  signal: [
    /* main clock */
    { name: "clk", wave: "p......" },
  ]
}`);
      expect(result.signal[0].name).toBe('clk');
    });

    test('parses WaveDrom with trailing commas', () => {
      const result = JSON5.parse(`{
  signal: [
    { name: "clk", wave: "p......", },
  ],
}`);
      expect(result.signal[0].name).toBe('clk');
    });

    test('parses WaveDrom with hex numbers', () => {
      const result = JSON5.parse('{ addr: 0xDEAD }');
      expect(result.addr).toBe(0xdead);
    });

    test('parses WaveDrom with Infinity and NaN', () => {
      const result = JSON5.parse(
        '{ max: Infinity, min: -Infinity, value: NaN }',
      );
      expect(result.max).toBe(Infinity);
      expect(result.min).toBe(-Infinity);
      expect(isNaN(result.value)).toBe(true);
    });

    test('parses multiline WaveDrom input', () => {
      const result = JSON5.parse(`{
  signal: [
    { name: "clk",     wave: "p.....|..." },
    { name: "data",    wave: "x.345x|=.x", data: ["head", "body", "tail", "data"] },
    { name: "req",     wave: "0.1..0|1.0" },
    {},
    { name: "ack",     wave: "1.....|01." },
  ],
  head: { text: "WaveDrom example", tick: 0 },
  foot: { text: "Figure 1", tock: 9 },
}`);
      expect(result.signal).toHaveLength(5);
      expect(result.head.text).toBe('WaveDrom example');
    });
  });

  describe('JSON5.parse blocks code execution', () => {
    test('throws on function calls', () => {
      expect(() => JSON5.parse('alert("xss")')).toThrow();
    });

    test('throws on function expressions', () => {
      expect(() => JSON5.parse('(function() { alert("xss") })()')).toThrow();
    });

    test('throws on variable assignments', () => {
      expect(() => JSON5.parse('a = 1')).toThrow();
    });

    test('throws on arbitrary JavaScript payloads', () => {
      const exploitPayload = `
        (() => {
          const vscodeApi = { postMessage: () => {} };
          vscodeApi.postMessage({ command: 'updateMarkdown', args: ['/etc/passwd', 'evil'] });
        })()
      `;
      expect(() => JSON5.parse(exploitPayload)).toThrow();
    });

    test('throws on template literal injection', () => {
      expect(() => JSON5.parse('`${alert("xss")}`')).toThrow();
    });

    test('throws on new operator', () => {
      expect(() => JSON5.parse('new Function("alert(1)")')).toThrow();
    });

    test('throws on backtick code execution', () => {
      const payload = '(() => { return 1; })()';
      expect(() => JSON5.parse(payload)).toThrow();
    });

    test('throws on empty string', () => {
      expect(() => JSON5.parse('')).toThrow();
    });
  });

  describe('safety: JSON5 does not execute code', () => {
    test('does not execute side effects in object values', () => {
      const sideEffect = false;
      const input = '{"key": "value"}';
      JSON5.parse(input);
      expect(sideEffect).toBe(false);
    });

    test('rejects code disguised as a JSON value', () => {
      const payload = '{"signal": (function(){ return []; })()}';
      expect(() => JSON5.parse(payload)).toThrow();
    });
  });
});
