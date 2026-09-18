import {
  WikiData,
  WikiFileMeta,
  resolveHref,
} from '../../src/server-app/lib/api';
import {
  assembleWikiDocument,
  createWikiIndex,
  wikiFileList,
  wikiKeyOf,
} from '../../src/server-app/lib/wiki';

function wikiFile(overrides: Partial<WikiFileMeta> = {}): WikiFileMeta {
  return {
    path: '/vault/note.md',
    root: '/vault',
    title: 'note',
    mtimeMs: 1,
    html: '<!DOCTYPE html><html><head></head><body>hi</body></html>',
    update: {
      markdown: '# note',
      html: '<h1>note</h1>',
      tocHTML: '',
      totalLineCount: 1,
      sourceUri: '/vault/note.md',
      sourceScheme: 'file',
      id: '',
      class: '',
      jsAndCssFiles: [],
    },
    ...overrides,
  };
}

function wikiData(overrides: Partial<WikiData> = {}): WikiData {
  return {
    rootDirectories: ['/vault'],
    assets: {},
    files: [wikiFile()],
    ...overrides,
  };
}

describe('assembleWikiDocument', () => {
  test('inlines script tokens, escaping </script> breakouts', () => {
    const data = wikiData({
      assets: { '0': 'var x = "</script><b>evil";' },
      files: [
        wikiFile({
          html: '<head><script type="text/javascript" src="crossnote-wiki-asset:0" charset="UTF-8"></script></head>',
        }),
      ],
    });
    const doc = assembleWikiDocument(data, data.files[0]);
    expect(doc).toContain('<script>var x = "<\\/script><b>evil";</script>');
    expect(doc).not.toContain('src="crossnote-wiki-asset:0"');
  });

  test('inlines stylesheet tokens (both quote styles), escaping </style>', () => {
    const data = wikiData({
      assets: { '1': 'a::after{content:"</style>"}' },
      files: [
        wikiFile({
          html:
            '<head>' +
            '<link rel="stylesheet" href="crossnote-wiki-asset:1">' +
            "<link rel='stylesheet' href='crossnote-wiki-asset:1'>" +
            '</head>',
        }),
      ],
    });
    const doc = assembleWikiDocument(data, data.files[0]);
    expect(
      doc.match(/<style>a::after\{content:"<\\\/style>"\}<\/style>/g),
    ).toHaveLength(2);
  });

  test('replaces remaining attribute tokens with their (data URI) asset', () => {
    const data = wikiData({
      assets: { '2': 'data:image/png;base64,AAA' },
      files: [
        wikiFile({
          html: '<body><img src="crossnote-wiki-asset:2" alt=""></body>',
        }),
      ],
    });
    const doc = assembleWikiDocument(data, data.files[0]);
    expect(doc).toContain('<img src="data:image/png;base64,AAA" alt="">');
  });

  test('leaves unknown tokens and non-token references untouched', () => {
    const html =
      '<head><script src="https://cdn.example/m.js"></script></head>' +
      '<body><img src="crossnote-wiki-asset:missing"></body>';
    const data = wikiData({ files: [wikiFile({ html })] });
    expect(assembleWikiDocument(data, data.files[0])).toBe(html);
  });
});

describe('wiki index and file list', () => {
  test('indexes notes by posix-normalized path', () => {
    const data = wikiData({
      files: [wikiFile({ path: 'C:\\vault\\sub\\a.md', root: 'C:\\vault' })],
    });
    const index = createWikiIndex(data);
    expect(index.has('C:/vault/sub/a.md')).toBe(true);
    expect(index.has(wikiKeyOf('C:\\vault\\sub\\a.md'))).toBe(true);
    expect(index.has('C:\\vault\\sub\\a.md')).toBe(false);
  });

  test('lists files relative to their root, root-prefixed when multi-root', () => {
    const single = wikiData({
      files: [wikiFile({ path: '/vault/sub/a.md' })],
    });
    expect(wikiFileList(single)[0].relativePath).toBe('sub/a.md');

    const multi = wikiData({
      rootDirectories: ['/vault', '/other'],
      files: [
        wikiFile({ path: '/vault/sub/a.md' }),
        wikiFile({ path: '/other/b.md', root: '/other' }),
      ],
    });
    const list = wikiFileList(multi);
    expect(list.map((file) => file.relativePath)).toEqual([
      'vault/sub/a.md',
      'other/b.md',
    ]);
    expect(list.map((file) => file.rootPath)).toEqual(['/vault', '/other']);
  });
});

describe('resolveHref with the serve /files/ mount', () => {
  test('undoes the mount prefix, honoring the ?root= hint', () => {
    expect(
      resolveHref(['/a/notes'], '/a/notes/x/src.md', '/files/other.md'),
    ).toBe('/a/notes/other.md');
    expect(
      resolveHref(
        ['/a/notes', '/b/wiki'],
        '/a/notes/src.md',
        '/files/pic.png?root=1',
      ),
    ).toBe('/b/wiki/pic.png');
  });

  test('anchors plain absolute hrefs at the source root as before', () => {
    expect(resolveHref(['/a/notes'], '/a/notes/src.md', '/x.md')).toBe(
      '/a/notes/x.md',
    );
    expect(resolveHref(['/a/notes'], '/a/notes/x/src.md', 'other.md')).toBe(
      '/a/notes/x/other.md',
    );
  });
});
