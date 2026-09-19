import {
  WikiData,
  WikiFileMeta,
  resolveHref,
} from '../../src/server-app/lib/api';
import {
  assembleWikiDocument,
  createWikiIndex,
  readWikiThemeSelection,
  resolveWikiHref,
  wikiFileList,
  wikiKeyOf,
  writeWikiThemeSelection,
} from '../../src/server-app/lib/wiki';

function wikiFile(overrides: Partial<WikiFileMeta> = {}): WikiFileMeta {
  return {
    path: '/vault/note.md',
    root: 'vault',
    title: 'note',
    mtimeMs: 1,
    html: '<!DOCTYPE html><html><head></head><body>hi</body></html>',
    update: {
      markdown: '# note',
      html: '<h1>note</h1>',
      tocHTML: '',
      totalLineCount: 1,
      sourceUri: 'note.md',
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
    themes: {
      preview: {
        'github-light.css': '/* light */',
        'github-dark.css': '/* dark */',
      },
      codeBlock: {
        'default.css': '/* prism default */',
        'one-dark.css': '/* prism dark */',
      },
      reveal: { 'white.css': '/* reveal white */' },
      codeBlockAuto: {
        'github-light.css': 'default.css',
        'github-dark.css': 'one-dark.css',
      },
      build: {
        preview: 'github-light.css',
        codeBlock: 'default.css',
        reveal: 'white.css',
      },
    },
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

  test('theme tokens resolve to the stored selection and rewrite the config meta', () => {
    const data = wikiData({
      files: [
        wikiFile({
          html:
            '<head>' +
            '<link rel="stylesheet" href="crossnote-wiki-theme:preview">' +
            '<link rel="stylesheet" href="crossnote-wiki-theme:codeBlock">' +
            '<link rel="stylesheet" href="crossnote-wiki-theme:reveal">' +
            '<meta id="crossnote-data" data-config="{&quot;previewTheme&quot;:&quot;github-light.css&quot;,&quot;codeBlockTheme&quot;:&quot;default.css&quot;,&quot;revealjsTheme&quot;:&quot;white.css&quot;}">' +
            '</head>',
        }),
      ],
    });

    // Without a selection, the build-time themes are inlined.
    const built = assembleWikiDocument(data, data.files[0]);
    expect(built).toContain(
      '<style data-crossnote-theme="preview">/* light */</style>',
    );
    expect(built).toContain(
      '<style data-crossnote-theme="codeBlock">/* prism default */</style>',
    );

    // With a selection, its stylesheets are used, `auto.css` code blocks
    // follow the preview theme, and the config meta reflects the choice.
    const switched = assembleWikiDocument(data, data.files[0], {
      preview: 'github-dark.css',
      codeBlock: 'auto.css',
      reveal: 'white.css',
    });
    expect(switched).toContain(
      '<style data-crossnote-theme="preview">/* dark */</style>',
    );
    expect(switched).toContain(
      '<style data-crossnote-theme="codeBlock">/* prism dark */</style>',
    );
    expect(switched).toContain(
      '&quot;previewTheme&quot;:&quot;github-dark.css&quot;',
    );
    expect(switched).toContain(
      '&quot;codeBlockTheme&quot;:&quot;auto.css&quot;',
    );

    // An unknown name falls back to the build-time theme.
    const unknown = assembleWikiDocument(data, data.files[0], {
      preview: 'nope.css',
      codeBlock: 'default.css',
      reveal: 'white.css',
    });
    expect(unknown).toContain(
      '<style data-crossnote-theme="preview">/* light */</style>',
    );
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
  test('indexes notes by posix-normalized key', () => {
    const data = wikiData({
      files: [wikiFile({ path: 'sub\\a.md' })],
    });
    const index = createWikiIndex(data);
    expect(index.has('sub/a.md')).toBe(true);
    expect(index.has(wikiKeyOf('sub\\a.md'))).toBe(true);
    expect(index.has('sub\\a.md')).toBe(false);
  });

  test('lists files with root-prefixed keys, bare relative paths when multi-root', () => {
    const single = wikiData({
      files: [wikiFile({ path: 'sub/a.md' })],
    });
    expect(wikiFileList(single)[0]).toEqual({
      absolutePath: 'sub/a.md',
      relativePath: 'sub/a.md',
      mtimeMs: 1,
      rootPath: 'vault',
    });

    const multi = wikiData({
      rootDirectories: ['vault', 'other'],
      files: [
        wikiFile({ path: 'vault/sub/a.md' }),
        wikiFile({ path: 'other/b.md', root: 'other' }),
      ],
    });
    const list = wikiFileList(multi);
    // The picker re-adds the root prefix from rootPath itself.
    expect(list.map((file) => file.relativePath)).toEqual(['sub/a.md', 'b.md']);
    expect(list.map((file) => file.rootPath)).toEqual(['vault', 'other']);
    expect(list.map((file) => file.absolutePath)).toEqual([
      'vault/sub/a.md',
      'other/b.md',
    ]);
  });
});

describe('resolveWikiHref', () => {
  const data = wikiData({
    files: [
      wikiFile({ path: 'index.md' }),
      wikiFile({ path: 'notes/other.md' }),
    ],
  });

  test('anchors root-relative and note-relative hrefs', () => {
    expect(resolveWikiHref(data, 'index.md', '/notes/other.md')).toBe(
      'notes/other.md',
    );
    expect(resolveWikiHref(data, 'notes/other.md', '../index.md')).toBe(
      'index.md',
    );
    expect(resolveWikiHref(data, 'notes/other.md', 'sibling.md')).toBe(
      'notes/sibling.md',
    );
    // Fragments and queries are stripped.
    expect(resolveWikiHref(data, 'index.md', '/notes/other.md#head')).toBe(
      'notes/other.md',
    );
    expect(resolveWikiHref(data, 'index.md', '')).toBe('');
  });

  test('re-anchors multi-root keys on the source note’s root', () => {
    const multi = wikiData({
      rootDirectories: ['vault', 'other'],
      files: [
        wikiFile({ path: 'vault/index.md' }),
        wikiFile({ path: 'other/index.md', root: 'other' }),
      ],
    });
    expect(resolveWikiHref(multi, 'vault/sub/a.md', '/index.md')).toBe(
      'vault/index.md',
    );
    expect(resolveWikiHref(multi, 'other/sub/a.md', '/index.md')).toBe(
      'other/index.md',
    );
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

describe('wiki theme selection storage', () => {
  function memoryStorage(): Storage {
    const map = new Map<string, string>();
    return {
      getItem: (key) => (map.has(key) ? (map.get(key) as string) : null),
      setItem: (key, value) => {
        map.set(key, value);
      },
    } as Storage;
  }

  test('round-trips a selection and falls back on unknown names', () => {
    const storage = memoryStorage();
    const data = wikiData();
    // Nothing stored yet → no override.
    expect(readWikiThemeSelection(data, storage)).toBeNull();

    writeWikiThemeSelection(data, storage, {
      preview: 'github-dark.css',
      codeBlock: 'auto.css',
      reveal: 'white.css',
    });
    expect(readWikiThemeSelection(data, storage)).toEqual({
      preview: 'github-dark.css',
      codeBlock: 'auto.css',
      reveal: 'white.css',
    });

    // A selection that is entirely the build themes reads back as null.
    writeWikiThemeSelection(data, storage, data.themes.build);
    expect(readWikiThemeSelection(data, storage)).toBeNull();

    // Unknown names (stale or from a different wiki sharing the origin)
    // fall back to the build theme for that slot; valid ones survive.
    storage.setItem(
      'crossnote:wiki:themes:/vault',
      JSON.stringify({ preview: 'nope.css', codeBlock: 'auto.css' }),
    );
    expect(readWikiThemeSelection(data, storage)).toEqual({
      preview: 'github-light.css',
      codeBlock: 'auto.css',
      reveal: 'white.css',
    });

    // Broken JSON is ignored.
    storage.setItem('crossnote:wiki:themes:/vault', '{');
    expect(readWikiThemeSelection(data, storage)).toBeNull();
  });
});
