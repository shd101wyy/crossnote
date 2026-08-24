import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { D2_NOT_FOUND, D2RenderOptions, renderD2 } from '../src/renderers/d2';

const opts: D2RenderOptions = {
  d2Path: 'd2',
  d2Layout: 'dagre',
  d2Theme: 0,
  d2Sketch: false,
};

const ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">' +
  '<rect width="10" height="10" fill="red"/></svg>';

describe('D2 renderer', () => {
  // d2 is an external CLI that may be absent (e.g. in CI); the render-dependent
  // cases skip themselves when it is not installed.
  let d2Available = false;

  beforeAll(async () => {
    const probe = await renderD2('x: hello', opts);
    d2Available = probe !== D2_NOT_FOUND;
  }, 30000);

  it('returns D2_NOT_FOUND when the d2 binary is missing', async () => {
    const result = await renderD2('x: hello', {
      ...opts,
      d2Path: 'crossnote-nonexistent-d2-binary',
    });
    expect(result).toBe(D2_NOT_FOUND);
  });

  it('resolves a relative image path against the provided fileDirectoryPath', async () => {
    if (!d2Available) {
      console.warn('skipping: d2 binary not installed');
      return;
    }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crossnote-d2-test-'));
    try {
      fs.mkdirSync(path.join(dir, 'icons'));
      fs.writeFileSync(path.join(dir, 'icons', 'x.svg'), ICON_SVG);
      const result = await renderD2('x: hi { icon: ./icons/x.svg }', opts, dir);
      expect(typeof result).toBe('string');
      expect(result as string).toContain('<svg');
      // The icon was found beside the input file and inlined as a data URI.
      expect(result as string).toContain('data:image/svg');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 30000);

  it('does not inline a relative image when fileDirectoryPath is omitted', async () => {
    if (!d2Available) {
      console.warn('skipping: d2 binary not installed');
      return;
    }
    // Without a document directory the temp input lands in os.tmpdir(), where
    // ./icons/x.svg does not exist, so d2 cannot bundle it. Depending on the
    // error text this surfaces as either D2_NOT_FOUND or an error string, but
    // the icon must never be inlined.
    const result = await renderD2('x: hi { icon: ./icons/x.svg }', opts);
    if (result === D2_NOT_FOUND) {
      expect(result).toBe(D2_NOT_FOUND);
    } else {
      expect(result).not.toContain('data:image/svg');
    }
  }, 30000);
});
