import { spawnSync } from 'child_process';
import * as fs from 'fs';
import { createRequire } from 'module';
import * as os from 'os';
import * as path from 'path';
import { build, type BuildOptions, type OutputFile } from 'esbuild';
import { Notebook } from '../src/notebook/index';

/**
 * Node 18.15–18.19 parse JSON import attributes written with `assert`,
 * and reject the `with` keyword (`SyntaxError: Unexpected token 'with'`).
 * esbuild keeps whichever form the source used in the ESM output unless
 * the JSON file is inlined. Matches the attribute on a `.json` import,
 * not a mention in a comment.
 */
const JSON_IMPORT_ATTRIBUTE =
  /\.json['"]\s*(?:with|assert)\s*\{\s*type\s*:\s*['"]json['"]\s*\}/;

const EMOJI_JSON_REQUIRE =
  /require\(["']markdown-it-emoji\/lib\/data\/full\.json["']\)/;

// The library esbuild configs live in build.js so this assertion tracks
// the same options CI would miss if it only transformed emoji.ts.
const requireBuild = createRequire(__filename);
const { cjsConfig, esmConfig } = requireBuild('../build.js') as {
  cjsConfig: BuildOptions;
  esmConfig: BuildOptions;
};

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

  test('library build inlines emoji JSON without import attributes Node 18.15–18.19 reject', async () => {
    const repoRoot = path.join(__dirname, '..');

    const esmResult = await build({
      ...esmConfig,
      absWorkingDir: repoRoot,
      write: false,
    });
    const esmText = esmResult.outputFiles
      .map((file: OutputFile) => file.text)
      .join('\n');
    expect(esmText).not.toMatch(JSON_IMPORT_ATTRIBUTE);

    const cjsResult = await build({
      ...cjsConfig,
      absWorkingDir: repoRoot,
      write: false,
    });
    const cjsText = cjsResult.outputFiles
      .map((file: OutputFile) => file.text)
      .join('\n');
    expect(cjsText).not.toMatch(EMOJI_JSON_REQUIRE);
  }, 30000);

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
