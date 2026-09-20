import { isPathWithinRootOn } from '../../src/serve/markdown-files';

describe('isPathWithinRoot (drive-letter case)', () => {
  // VS Code hands hosts `c:\…` while the engine normalizes to `C:\…`; a
  // case-sensitive check dropped every workspace file out of the serve URL
  // mapper, so previews rendered dead `file:///` image links.
  const backslash = String.fromCharCode(92);

  test('win32 compares case-insensitively', () => {
    const root = `c:${backslash}Users${backslash}yo`;
    expect(
      isPathWithinRootOn(
        'win32',
        root,
        `C:${backslash}Users${backslash}yo${backslash}logo.png`,
      ),
    ).toBe(true);
    expect(
      isPathWithinRootOn('win32', `C:${backslash}Users${backslash}yo`, root),
    ).toBe(true);
    // A sibling sharing a name prefix still fails.
    expect(
      isPathWithinRootOn(
        'win32',
        root,
        `C:${backslash}Users${backslash}yo-evil${backslash}x.md`,
      ),
    ).toBe(false);
  });

  test('posix stays case-sensitive', () => {
    expect(isPathWithinRootOn('linux', '/home/yo', '/home/yo/x.md')).toBe(true);
    expect(isPathWithinRootOn('linux', '/home/yo', '/home/Yo/x.md')).toBe(
      false,
    );
  });
});
