import { closeSync, existsSync, readFileSync, rmSync, writeSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import * as temp from '../../src/lib/temp';

// Paths created by each test, removed in afterEach so we don't leak
// artifacts into the system temp directory across CI runs.
const created: string[] = [];

afterEach(() => {
  while (created.length) {
    const p = created.pop();
    if (p) {
      rmSync(p, { recursive: true, force: true });
    }
  }
});

describe('lib/temp', () => {
  describe('mkdirSync', () => {
    it('creates a temp directory under os.tmpdir() with the given prefix', () => {
      const dirPath = temp.mkdirSync('crossnote-test');
      created.push(dirPath);
      expect(existsSync(dirPath)).toBe(true);
      expect(dirPath.startsWith(tmpdir())).toBe(true);
      expect(path.basename(dirPath)).toMatch(/^crossnote-test-d-/);
    });

    it('produces a unique path on each call', () => {
      const a = temp.mkdirSync('crossnote-uniq');
      const b = temp.mkdirSync('crossnote-uniq');
      created.push(a, b);
      expect(a).not.toBe(b);
    });

    it('honours a custom dir option', () => {
      const parent = temp.mkdirSync('crossnote-parent');
      created.push(parent);
      const child = temp.mkdirSync({ prefix: 'crossnote-child', dir: parent });
      expect(child.startsWith(parent + path.sep)).toBe(true);
    });
  });

  describe('open', () => {
    it('creates a writable temp file with prefix + suffix in the path', async () => {
      const info = await temp.open({
        prefix: 'crossnote-test',
        suffix: '.svg',
      });
      created.push(info.path);
      try {
        expect(existsSync(info.path)).toBe(true);
        expect(info.path.endsWith('.svg')).toBe(true);
        expect(path.basename(info.path)).toMatch(/^crossnote-test-f-/);

        const payload = Buffer.from('<svg></svg>');
        writeSync(info.fd, payload, 0, payload.length, 0);
      } finally {
        closeSync(info.fd);
      }

      expect(readFileSync(info.path, 'utf8')).toBe('<svg></svg>');
    });

    it('returns distinct paths for repeated calls', async () => {
      const [a, b] = await Promise.all([
        temp.open({ prefix: 'crossnote' }),
        temp.open({ prefix: 'crossnote' }),
      ]);
      created.push(a.path, b.path);
      try {
        expect(a.path).not.toBe(b.path);
      } finally {
        closeSync(a.fd);
        closeSync(b.fd);
      }
    });
  });

  describe('track', () => {
    it('toggles internal tracking state idempotently', () => {
      expect(temp.track(true)).toBe(true);
      expect(temp.track(false)).toBe(false);
      expect(temp.track()).toBe(true);
    });
  });
});
