import { spawnSync } from 'child_process';
import * as path from 'path';

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

    expect({ status: result.status, stderr: result.stderr }).toEqual({
      status: 0,
      stderr: '',
    });
  });
});
