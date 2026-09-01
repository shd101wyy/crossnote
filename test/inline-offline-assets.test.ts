import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import {
  readOfflineCss,
  readOfflineJs,
} from '../src/markdown-engine/inline-offline-assets';

describe('inline-offline-assets', () => {
  track();

  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdirSync({ prefix: 'xnote-inline-assets' });
  });

  describe('readOfflineJs', () => {
    test('wraps the file contents in an inline script tag', async () => {
      const jsPath = path.join(tmpDir, 'lib.js');
      fs.writeFileSync(jsPath, 'window.MERMAID_MARKER = true;');

      const html = await readOfflineJs(jsPath);

      expect(html).toContain('<script type="text/javascript">');
      expect(html).toContain('window.MERMAID_MARKER = true;');
      expect(html).toContain('</script>');
      expect(html).not.toContain('src=');
    });

    test('escapes a closing script tag inside the source', async () => {
      const jsPath = path.join(tmpDir, 'evil.js');
      fs.writeFileSync(jsPath, 'var s = "</script><p>xss</p>";');

      const html = await readOfflineJs(jsPath);

      expect(html).toContain('<\\/script');
      expect(html).not.toMatch(/<\/script><p>xss<\/p>/);
    });
  });

  describe('readOfflineCss', () => {
    test('wraps the file contents in an inline style tag', async () => {
      const cssPath = path.join(tmpDir, 'plain.css');
      fs.writeFileSync(cssPath, '.katex { font-size: 1.21em; }');

      const html = await readOfflineCss(cssPath);

      expect(html).toContain('<style>');
      expect(html).toContain('.katex { font-size: 1.21em; }');
      expect(html).toContain('</style>');
      expect(html).not.toContain('<link');
    });

    test('rewrites a relative font url to a data URI', async () => {
      const fontsDir = path.join(tmpDir, 'fonts');
      fs.mkdirSync(fontsDir);
      const fontPath = path.join(fontsDir, 'KaTeX_Main-Regular.woff2');
      fs.writeFileSync(fontPath, Buffer.from('WOFF2FONT'));
      const cssPath = path.join(tmpDir, 'katex.css');
      fs.writeFileSync(
        cssPath,
        '@font-face{src:url(fonts/KaTeX_Main-Regular.woff2) format("woff2")}',
      );

      const html = await readOfflineCss(cssPath);

      const expected =
        'data:font/woff2;base64,' + Buffer.from('WOFF2FONT').toString('base64');
      expect(html).toContain(`url("${expected}")`);
      expect(html).toContain('format("woff2")');
      expect(html).not.toContain('fonts/KaTeX_Main-Regular.woff2');
    });

    test('keeps only woff2 when woff and ttf siblings exist', async () => {
      const fontsDir = path.join(tmpDir, 'fonts');
      fs.mkdirSync(fontsDir);
      fs.writeFileSync(
        path.join(fontsDir, 'KaTeX_AMS-Regular.woff2'),
        Buffer.from('W2'),
      );
      fs.writeFileSync(
        path.join(fontsDir, 'KaTeX_AMS-Regular.woff'),
        Buffer.from('W1'),
      );
      fs.writeFileSync(
        path.join(fontsDir, 'KaTeX_AMS-Regular.ttf'),
        Buffer.from('TT'),
      );
      const cssPath = path.join(tmpDir, 'katex.css');
      fs.writeFileSync(
        cssPath,
        '@font-face{src:url(fonts/KaTeX_AMS-Regular.woff2) format("woff2"),url(fonts/KaTeX_AMS-Regular.woff) format("woff"),url(fonts/KaTeX_AMS-Regular.ttf) format("truetype")}',
      );

      const html = await readOfflineCss(cssPath);

      expect(html).toContain(
        'data:font/woff2;base64,' + Buffer.from('W2').toString('base64'),
      );
      expect(html).not.toContain(Buffer.from('W1').toString('base64'));
      expect(html).not.toContain(Buffer.from('TT').toString('base64'));
      expect(html).not.toContain('format("woff")');
      expect(html).not.toContain('format("truetype")');
    });

    test('leaves data, http, https and file urls untouched', async () => {
      const cssPath = path.join(tmpDir, 'external.css');
      fs.writeFileSync(
        cssPath,
        [
          'a{background:url(data:image/gif;base64,AAAA)}',
          'b{background:url(https://cdn.example/x.png)}',
          'c{background:url(http://cdn.example/y.png)}',
          'd{background:url(file:///tmp/z.png)}',
        ].join(''),
      );

      const html = await readOfflineCss(cssPath);

      expect(html).toContain('url(data:image/gif;base64,AAAA)');
      expect(html).toContain('url(https://cdn.example/x.png)');
      expect(html).toContain('url(http://cdn.example/y.png)');
      expect(html).toContain('url(file:///tmp/z.png)');
    });

    test('drops a relative url whose file is missing', async () => {
      const cssPath = path.join(tmpDir, 'missing.css');
      fs.writeFileSync(
        cssPath,
        '.x{background:url(fonts/does-not-exist.woff2) format("woff2")}',
      );

      const html = await readOfflineCss(cssPath);

      expect(html).not.toContain('does-not-exist');
      expect(html).toContain('.x{background:');
    });

    test('escapes a closing style tag inside the source', async () => {
      const cssPath = path.join(tmpDir, 'evil.css');
      fs.writeFileSync(
        cssPath,
        '.x{content:"</style><script>alert(1)</script>"}',
      );

      const html = await readOfflineCss(cssPath);

      expect(html).toContain('<\\/style');
      expect(html).not.toMatch(/<\/style><script>/);
    });

    test('drops urls that escape the css file own directory', async () => {
      const secretPath = path.join(tmpDir, 'secret.woff2');
      fs.writeFileSync(secretPath, Buffer.from('SECRET'));
      const fontsDir = path.join(tmpDir, 'fonts');
      fs.mkdirSync(fontsDir);
      const cssPath = path.join(fontsDir, 'katex.css');
      fs.writeFileSync(
        cssPath,
        '.x{background:url(../secret.woff2)} .y{background:url(./ok.png)}',
      );

      const html = await readOfflineCss(cssPath);

      expect(html).not.toContain(Buffer.from('SECRET').toString('base64'));
    });

    test('resolves urls with a query or fragment suffix', async () => {
      const fontsDir = path.join(tmpDir, 'fonts');
      fs.mkdirSync(fontsDir);
      fs.writeFileSync(
        path.join(fontsDir, 'KaTeX_Main-Regular.woff2'),
        Buffer.from('WQ'),
      );
      const cssPath = path.join(tmpDir, 'katex.css');
      fs.writeFileSync(
        cssPath,
        '@font-face{src:url(fonts/KaTeX_Main-Regular.woff2?v=1#x) format("woff2")}',
      );

      const html = await readOfflineCss(cssPath);

      expect(html).toContain(
        'data:font/woff2;base64,' + Buffer.from('WQ').toString('base64'),
      );
    });
  });
});
