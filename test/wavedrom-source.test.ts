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

    it('returns null for a top-level array root', () => {
      expect(normalizeWavedromSource('[{ name: "clk" }]')).toBeNull();
    });

    it('returns null rather than silently corrupting non-finite numbers', () => {
      // JSON5 accepts Infinity/NaN but strict JSON cannot represent them;
      // drop the diagram instead of emitting `null` for the value.
      expect(normalizeWavedromSource('{ max: Infinity }')).toBeNull();
      expect(normalizeWavedromSource('{ min: -Infinity }')).toBeNull();
      expect(normalizeWavedromSource('{ x: NaN }')).toBeNull();
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

  describe('scrubs SVG element injection through array-valued labels (XSS bypass of the #2315 fix)', () => {
    // WaveDrom's tspan.parse() passes non-string labels through verbatim, so
    // an array like ['image', {href, onerror}] in a `name` is turned into a
    // real SVG element *by the client-side renderer*, after server-side HTML
    // sanitization has finished. The data itself must therefore be sanitized
    // before it reaches the renderer.

    it('strips event handler attributes from label element arrays', () => {
      const out = normalizeWavedromSource(
        '{signal:[{name:["image",{href:"missing.png",onerror:"alert(1)"}],wave:"01"}]}',
      );
      expect(out).not.toContain('onerror');
      expect(out).toContain('"href":"missing.png"');
    });

    it('strips event handler keys from every nested object', () => {
      const out = normalizeWavedromSource(
        '{signal:[{name:"clk",wave:"p..",node:{ONCLICK:"alert(1)"}}]}',
      );
      expect(out).not.toContain('onclick');
      expect(out).not.toContain('ONCLICK');
    });

    it('strips javascript:/vbscript:/data:text/html URLs from attribute objects', () => {
      const out = normalizeWavedromSource(
        '{signal:[{name:["a",{href:"javascript:alert(1)"},"x"],wave:"01"}]}',
      );
      expect(out).not.toContain('javascript:');
    });

    it('drops script label elements with text payloads', () => {
      const out = normalizeWavedromSource(
        '{signal:[{name:["script","window.__x=1"],wave:"01"}]}',
      );
      expect(out).not.toBeNull();
      expect(JSON.parse(out as string).signal[0].name).not.toContain('script');
    });

    it('drops script label elements with attribute payloads', () => {
      const out = normalizeWavedromSource(
        '{signal:[{name:["script",{src:"data:text/javascript,alert(1)"}],wave:"01"}]}',
      );
      expect(out).not.toContain('text/javascript');
    });

    it('drops SMIL animation elements that can retarget hrefs', () => {
      const out = normalizeWavedromSource(
        '{signal:[{name:["a",{},["animate",{attributeName:"href",to:"javascript:alert(1)"}]],wave:"01"}]}',
      );
      expect(out).not.toContain('animate');
      expect(out).not.toContain('javascript:');
    });

    it('drops foreignObject/iframe HTML-embedding elements', () => {
      const out = normalizeWavedromSource(
        '{signal:[{name:["foreignobject",{},["iframe",{srcdoc:"<b>x</b>"}]],wave:"01"}]}',
      );
      expect(out).not.toContain('foreignobject');
      expect(out).not.toContain('srcdoc');
    });

    it('preserves benign element labels such as images', () => {
      const out = normalizeWavedromSource(
        '{signal:[{name:["image",{href:"icon.png"}],wave:"01"}]}',
      );
      expect(out).toBe(
        '{"signal":[{"name":["image",{"href":"icon.png"}],"wave":"01"}]}',
      );
    });

    it('does not mistake plain data arrays for element injection', () => {
      // `data: ["set", "reset"]` are two data labels, not a <set> element:
      // only the [tag, {attrs}] shape (or script/handler with text) is
      // dropped.
      const out = normalizeWavedromSource(
        '{signal:[{name:"ctrl",wave:"01",data:["set","reset"]}]}',
      );
      expect(out).toBe(
        '{"signal":[{"name":"ctrl","wave":"01","data":["set","reset"]}]}',
      );
    });

    it('preserves multi-line string labels', () => {
      const out = normalizeWavedromSource(
        '{signal:[{name:["line one","line two"],wave:"01"}]}',
      );
      expect(out).toBe(
        '{"signal":[{"name":["line one","line two"],"wave":"01"}]}',
      );
    });
  });
});
