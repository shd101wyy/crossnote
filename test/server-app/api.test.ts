import {
  basename,
  dirname,
  filePathToFilesUrl,
  resolveHref,
  rootContaining,
  sameServeFile,
} from '../../src/server-app/lib/api';

describe('server-app path helpers', () => {
  describe('basename / dirname', () => {
    test('handles both separators', () => {
      expect(basename('/a/b/note.md')).toBe('note.md');
      expect(basename('C:\\a\\note.md')).toBe('note.md');
      expect(dirname('/a/b/note.md')).toBe('/a/b');
      expect(dirname('C:\\a\\note.md')).toBe('C:\\a');
    });
  });

  describe('rootContaining', () => {
    test('requires a separator boundary, on posix and windows roots', () => {
      expect(rootContaining(['/a/notes'], '/a/notes/x/y.md')).toBe(0);
      expect(rootContaining(['/a/notes'], '/a/notes')).toBe(0);
      expect(rootContaining(['/a/notes'], '/a/notes-evil/y.md')).toBe(-1);
      expect(rootContaining(['C:\\a\\notes'], 'C:/a/notes/y.md')).toBe(0);
      expect(rootContaining(['C:\\a\\notes'], 'C:\\a\\notes\\y.md')).toBe(0);
    });
  });

  describe('resolveHref', () => {
    test('anchors relative hrefs at the source directory', () => {
      expect(resolveHref(['/a/notes'], '/a/notes/x/src.md', 'other.md')).toBe(
        '/a/notes/x/other.md',
      );
      expect(
        resolveHref(['/a/notes'], '/a/notes/x/src.md', '../other.md#frag'),
      ).toBe('/a/notes/other.md');
      // `..` never climbs above the filesystem root.
      expect(
        resolveHref(['/a/notes'], '/a/notes/src.md', '../../evil.md'),
      ).toBe('/evil.md');
    });

    test('anchors absolute hrefs at the root containing the source file', () => {
      expect(
        resolveHref(['/a/notes', '/b/wiki'], '/b/wiki/src.md', '/x.md'),
      ).toBe('/b/wiki/x.md');
    });

    test('keeps windows drive-letter paths canonical (no leading /)', () => {
      expect(
        resolveHref(['C:\\a\\notes'], 'C:/a/notes/x/src.md', 'other.md'),
      ).toBe('C:/a/notes/x/other.md');
      expect(
        resolveHref(['C:\\a\\notes'], 'C:\\a\\notes\\src.md', 'sub/other.md'),
      ).toBe('C:/a/notes/sub/other.md');
      expect(
        resolveHref(['C:\\a\\notes'], 'C:/a/notes/src.md', '/other.md'),
      ).toBe('C:/a/notes/other.md');
    });
  });

  describe('filePathToFilesUrl', () => {
    test('maps into the containing root, with a hint when multi-root', () => {
      expect(filePathToFilesUrl(['/a/notes'], '/a/notes/img/logo.png')).toBe(
        '/files/img/logo.png',
      );
      expect(
        filePathToFilesUrl(['/a/notes', '/b/wiki'], '/b/wiki/img/a b.png'),
      ).toBe('/files/img/a%20b.png?root=1');
      expect(filePathToFilesUrl(['/a/notes'], '/elsewhere/x.png')).toBeNull();
      expect(
        filePathToFilesUrl(['C:\\a\\notes'], 'C:/a/notes/img/logo.png'),
      ).toBe('/files/img/logo.png');
    });
  });
});

describe('sameServeFile (path spelling tolerance)', () => {
  const bs = String.fromCharCode(92); // backslash
  test('matches native and posix spellings of a windows path', () => {
    expect(
      sameServeFile(
        'c:/Users/shd10/Workspace/Yo/docs/en-US/ASYNC_AWAIT.md',
        'c:' +
          bs +
          'Users' +
          bs +
          'shd10' +
          bs +
          'Workspace' +
          bs +
          'Yo' +
          bs +
          'docs' +
          bs +
          'en-US' +
          bs +
          'ASYNC_AWAIT.md',
      ),
    ).toBe(true);
    expect(
      sameServeFile(
        'C:' + bs + 'Users' + bs + 'yo' + bs + 'README.md',
        'c:/users/yo/README.md',
      ),
    ).toBe(true);
    expect(
      sameServeFile(
        'c:/users/yo/a.md',
        'c:' + bs + 'users' + bs + 'yo' + bs + 'b.md',
      ),
    ).toBe(false);
  });

  test('posix paths stay case-sensitive', () => {
    expect(sameServeFile('/home/yo/a.md', '/home/yo/a.md')).toBe(true);
    expect(sameServeFile('/home/yo/a.md', '/home/yo/A.md')).toBe(false);
    expect(
      sameServeFile('/home/yo/a.md', '/home' + bs + 'yo' + bs + 'a.md'),
    ).toBe(true);
  });
});
