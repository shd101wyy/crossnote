import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { build } from 'esbuild';
import { Notebook } from '../src/notebook/index';

/**
 * Node 18.15–18.19 parse JSON import attributes written with `assert`,
 * and reject the `with` keyword (`SyntaxError: Unexpected token 'with'`).
 * esbuild keeps whichever form the source used in the ESM output.
 * Matches the attribute on a `.json` import, not a mention in a comment.
 */
const JSON_IMPORT_ATTRIBUTE =
  /\.json['"]\s*(?:with|assert)\s*\{\s*type\s*:\s*['"]json['"]\s*\}/;

describe('runtime compatibility', () => {
  test('parses HTML with Cheerio without a global File constructor', () => {
    const script = `
      const assert = require('assert');
      assert.strictEqual(Reflect.deleteProperty(globalThis, 'File'), true);
      assert.strictEqual(typeof globalThis.File, 'undefined');
      const cheerio = require('cheerio');
      const $ = cheerio.load('<main><h1>Preview</h1></main>');
      assert.strictEqual($('h1').text(), 'Preview');
    `;
    const result = spawnSync(process.execPath, ['-e', script], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });

    expect(result.error).toBeUndefined();
    expect(result.signal).toBeNull();
    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain('File is not defined');
  });

  test('emoji JSON is loaded without import attributes Node 18.15–18.19 reject', async () => {
    const repoRoot = path.join(__dirname, '..');
    const emojiSource = fs.readFileSync(
      path.join(repoRoot, 'src/custom-markdown-it-features/emoji.ts'),
      'utf8',
    );
    expect(emojiSource).not.toMatch(JSON_IMPORT_ATTRIBUTE);

    const transformed = await build({
      absWorkingDir: repoRoot,
      entryPoints: ['src/custom-markdown-it-features/emoji.ts'],
      bundle: false,
      write: false,
      format: 'esm',
      platform: 'neutral',
    });
    const esmText = transformed.outputFiles.map((file) => file.text).join('\n');
    expect(esmText).not.toMatch(JSON_IMPORT_ATTRIBUTE);

    const bundledEsmPath = path.join(repoRoot, 'out/esm/index.mjs');
    if (fs.existsSync(bundledEsmPath)) {
      expect(fs.readFileSync(bundledEsmPath, 'utf8')).not.toMatch(
        JSON_IMPORT_ATTRIBUTE,
      );

      // The issue's repro: `node -e "import('crossnote')"` on Node 18.15–18.19.
      const esmLoad = spawnSync(
        process.execPath,
        [
          '-e',
          "import('./out/esm/index.mjs').then(() => {}, (e) => { console.error(e); process.exit(1); })",
        ],
        { cwd: repoRoot, encoding: 'utf8' },
      );
      expect(esmLoad.error).toBeUndefined();
      expect(esmLoad.status).toBe(0);
      expect(esmLoad.stderr).not.toContain("Unexpected token 'with'");
    }

    const bundledCjsPath = path.join(repoRoot, 'out/cjs/index.cjs');
    if (fs.existsSync(bundledCjsPath)) {
      const cjsLoad = spawnSync(
        process.execPath,
        ['-e', "require('./out/cjs/index.cjs')"],
        { cwd: repoRoot, encoding: 'utf8' },
      );
      expect(cjsLoad.error).toBeUndefined();
      expect(cjsLoad.status).toBe(0);
    }
  });

  test('emoji shortcodes still render', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'emoji-compat-'));
    try {
      const notebook = await Notebook.init({
        notebookPath: tmp,
        config: { markdownParser: 'markdown-it' },
      });
      expect(notebook.md.render(':smile:')).toContain('😄');
      expect(notebook.md.render(':heart:')).toContain('❤');
      expect(notebook.md.render(':fa-github:')).toContain('fa-github');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
