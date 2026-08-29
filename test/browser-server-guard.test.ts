import * as path from 'path';
import { isPathWithinRoot } from './browser/server';

describe('isPathWithinRoot (test server traversal guard)', () => {
  const root = path.resolve('/srv/static/mathjax');

  it('accepts the root itself and files inside it', () => {
    expect(isPathWithinRoot(root, root)).toBe(true);
    expect(isPathWithinRoot(root, path.join(root, 'tex-svg.js'))).toBe(true);
    expect(isPathWithinRoot(root, path.join(root, 'a', 'b', 'c.js'))).toBe(
      true,
    );
  });

  it('rejects parent traversal outside the root', () => {
    expect(isPathWithinRoot(root, path.resolve(root, '../secret.txt'))).toBe(
      false,
    );
    expect(
      isPathWithinRoot(root, path.resolve(root, '../../../etc/passwd')),
    ).toBe(false);
  });

  it("rejects sibling directories sharing the root's name prefix", () => {
    // `resolve(root, '../mathjax-evil/x')` lands in a sibling directory whose
    // path still starts with the root string — the old `startsWith(root)`
    // check let it through.
    expect(
      isPathWithinRoot(root, path.resolve(root, '../mathjax-evil/x')),
    ).toBe(false);
  });
});
