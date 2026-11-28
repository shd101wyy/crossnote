import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { load } from 'cheerio';
import { ebookConvert } from '../src/converters/ebook-convert';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import {
  getCrossnoteBuildDirectory,
  setCrossnoteBuildDirectory,
  toFileURL,
} from '../src/utility';

/**
 * The eBook export builds a page of its own: the last list of the note is
 * its table of contents, the file of every theme it names is read into the
 * page, and the front matter gives the page its `id` and `class`. Each of
 * those is the note's, and is written after the page was sanitized.
 */

jest.mock('../src/converters/ebook-convert', () => ({
  ebookConvert: jest.fn(),
}));

jest.mock('less', () => ({
  render: (
    _input: string,
    _options: unknown,
    callback: (error: unknown, output: { css: string } | undefined) => void,
  ) => {
    callback(null, { css: '' });
  },
}));

const MARKUP_IN_A_LINK =
  '- [<span title=" onmouseover=window.__pwn_heading=1 x="">H</span>](other.md)\n';

/** Wait until `condition` holds, letting what runs on its own get on. */
async function waitFor(condition: () => boolean) {
  const deadline = Date.now() + 5_000;
  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error('It did not get there in time');
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

describe('the eBook export', () => {
  track();

  const originalBuildDirectory = getCrossnoteBuildDirectory();
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdirSync({ prefix: 'xnote-ebook-' });
    for (const dir of [
      'styles/prism_theme',
      'styles/preview_theme/elsewhere',
      'dependencies/reveal/js',
      'dependencies/reveal/css/theme',
    ]) {
      fs.mkdirSync(path.join(tmpDir, dir), { recursive: true });
    }
    // The styles of an eBook are all read together: each is here.
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'style-template.css'),
      '/* template */',
    );
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'twemoji.css'),
      '/* twemoji */',
    );
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'prism_theme', 'default.css'),
      '/* prism */',
    );
    // the prism theme of the light theme
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'prism_theme', 'github.css'),
      '/* prism of the light theme */',
    );
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'preview_theme', 'github-light.css'),
      '/* light */',
    );
    fs.writeFileSync(
      path.join(
        tmpDir,
        'styles',
        'preview_theme',
        'elsewhere',
        'not-a-theme.css',
      ),
      '/* not a theme */ </style><img src=x onerror="window.__pwn_theme=1">',
    );
    fs.writeFileSync(path.join(tmpDir, 'other.md'), '# Other\n');
    setCrossnoteBuildDirectory(tmpDir);
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(originalBuildDirectory);
  });

  /** Render `markdown` and export it as an eBook written as HTML. */
  async function exportHTML(markdown: string): Promise<string> {
    const filePath = path.join(tmpDir, 'note.md');
    fs.writeFileSync(filePath, markdown);
    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
        previewTheme: 'github-light.css',
      },
    });
    const engine = new MarkdownEngine({ notebook, filePath });
    return fs.readFileSync(
      await engine.eBookExport({ fileType: 'html' }),
      'utf8',
    );
  }

  const ebookOf = (frontMatter: string) =>
    `---\nebook:\n  title: T\n${frontMatter}---\n\n${MARKUP_IN_A_LINK}`;

  test('carries the text of a link of the table of contents in its heading, not its markup', async () => {
    const $ = load(await exportHTML(ebookOf('')));
    const entry = $('[ebook-toc-level-1]');

    expect(Object.keys(entry.attr() ?? {}).sort()).toEqual([
      'ebook-toc-level-1',
      'heading',
      'id',
    ]);
    // The quotes of the text do not end the attribute: nothing of it became
    // an attribute of the entry.
    expect(entry.attr('heading')).toContain('onmouseover=window.__pwn_heading');
    expect($('[onmouseover]')).toHaveLength(0);
  });

  test.each([
    ['a name with an ampersand', '[Q&A](other.md)', 'Q&A'],
    ['a name with emphasis', '[**Bold** chapter](other.md)', 'Bold chapter'],
    ['a name with a quote in it', '[Say "hi"](other.md)', 'Say "hi"'],
    ['an image alone', '[![alt text](a.png)](other.md)', 'alt text'],
  ])(
    'gives an entry for its title the text of its link, with %s',
    async (_, link, title) => {
      // calibre reads the title of an entry back from this attribute.
      const html = await exportHTML(
        `---\nebook:\n  title: T\n---\n\n- ${link}\n`,
      );

      expect(load(html)('[ebook-toc-level-1]').attr('heading')).toBe(title);
    },
  );

  test('takes a theme that is not a name for the theme of the notebook', async () => {
    // A list is not a name, even where it holds one.
    const html = await exportHTML(
      `---\nebook:\n  title: T\n  theme:\n    - one-light.css\n---\n\n${MARKUP_IN_A_LINK}`,
    );

    expect(html).toContain('/* light */');
  });

  test('writes the cover into its image as an address, and nothing else', async () => {
    const cover = 'data:image/png;base64,x" onerror="window.__pwn_cover=1';
    const html = await exportHTML(
      ebookOf(`  cover: ${JSON.stringify(cover)}\n`),
    );
    const image = load(html)('img').first();

    expect(Object.keys(image.attr() ?? {}).sort()).toEqual(['src', 'style']);
    expect(image.attr('src')).toBe(cover);
  });

  test('reads the file of a theme, and no other file', async () => {
    // A theme is a bare name in the folder of the themes. Anything else is
    // the theme of the notebook.
    for (const theme of [
      'elsewhere/not-a-theme.css',
      '../prism_theme/../../note.md',
    ]) {
      const html = await exportHTML(ebookOf(`  theme: ${theme}\n`));

      expect(html).not.toContain('__pwn_theme');
      expect(html).not.toContain('not a theme');
      expect(html).toContain('/* light */');
    }

    const html = await exportHTML(ebookOf('  theme: github-light.css\n'));
    expect(html).toContain('/* light */');
    expect(html).toContain('/* prism of the light theme */');

    // `vscode.css` is the theme of the preview: an eBook takes the light
    // theme for it, and keeps the code blocks of the default theme.
    const ofVscode = await exportHTML(ebookOf('  theme: vscode.css\n'));
    expect(ofVscode).toContain('/* light */');
    expect(ofVscode).toContain('/* prism */');
    expect(ofVscode).not.toContain('/* prism of the light theme */');
  });

  describe('handed to ebook-convert', () => {
    const convert = ebookConvert as jest.MockedFunction<typeof ebookConvert>;

    afterEach(() => {
      convert.mockReset();
    });

    /** Begin to export the note of `folder` (of the notebook) as an EPUB. */
    async function exportEPUB(folder: string = tmpDir) {
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'other.md'), '# Other\n');
      const filePath = path.join(folder, 'note.md');
      fs.writeFileSync(filePath, ebookOf(''));
      const notebook = await Notebook.init({
        notebookPath: tmpDir,
        config: {
          markdownParser: 'markdown-it',
          markdownYoBinaryPath: '',
          previewTheme: 'github-light.css',
        },
      });
      const engine = new MarkdownEngine({ notebook, filePath });
      return { exported: engine.eBookExport({ fileType: 'epub' }) };
    }

    const pagesLeft = (folder = tmpDir) =>
      fs.readdirSync(folder).filter((f) => f.endsWith('.crossnote-ebook.html'));

    test('is a page at the root of the notebook, removed after the conversion', async () => {
      // calibre 6.19+ adds no local file outside the folder of the page.
      let src = '';
      let existed = false;
      convert.mockImplementation(async (page) => {
        src = page;
        existed = fs.existsSync(page);
      });
      const { exported } = await exportEPUB();

      expect(await exported).toBe(path.join(tmpDir, 'note.epub'));
      expect(path.dirname(src)).toBe(tmpDir);
      expect(path.basename(src)).toMatch(/^note\..+\.crossnote-ebook\.html$/);
      expect(existed).toBe(true);
      expect(fs.existsSync(src)).toBe(false);
      expect(pagesLeft()).toEqual([]);
    });

    test('is a page at the root of the notebook for a note in a sub-folder', async () => {
      const sub = path.join(tmpDir, 'sub');
      let src = '';
      let existed = false;
      convert.mockImplementation(async (page) => {
        src = page;
        existed = fs.existsSync(page);
      });
      const { exported } = await exportEPUB(sub);

      expect(await exported).toBe(path.join(sub, 'note.epub'));
      expect(path.dirname(src)).toBe(tmpDir);
      expect(path.basename(src)).toMatch(/^note\..+\.crossnote-ebook\.html$/);
      expect(existed).toBe(true);
      expect(fs.existsSync(src)).toBe(false);
      expect(pagesLeft()).toEqual([]);
      expect(pagesLeft(sub)).toEqual([]);
    });

    test('is removed when the conversion fails', async () => {
      convert.mockImplementation(async () => {
        throw new Error('ebook-convert failed');
      });
      const { exported } = await exportEPUB();

      await expect(exported).rejects.toThrow('ebook-convert failed');
      expect(pagesLeft()).toEqual([]);
    });

    describe('with the images of the web', () => {
      const fetch_ = globalThis.fetch;

      afterEach(() => {
        globalThis.fetch = fetch_;
      });

      /** Make `fetch` answer the engine as `respond` does. */
      const answerFetch = (respond: (url: string) => unknown) => {
        globalThis.fetch = jest.fn(respond) as unknown as typeof fetch;
      };

      /** An image on the web, whose body tells of the address it was asked by. */
      const imageAt = (url: string) => ({
        ok: true,
        body: Readable.toWeb(
          Readable.from([Buffer.from(`the image asked of ${url}`)]),
        ),
      });

      /** What the page says of an image of the web, and what lies where it points. */
      interface Image {
        /** The `src` of the image in the page. */
        src: string;
        /** The name of the file next to the note that it was saved as. */
        file: string;
        /** What that file held while `ebook-convert` had the page. */
        content: string;
      }

      /** A line of the note with the image of `src` in it, as markdown. */
      const imageLine = (offset: number, src: string) =>
        `Image ${offset + 1}: ![image ${offset}](<${src}>)`;

      /**
       * Export a note of the lines of `images` as an EPUB.
       * `imagesOfThePage()` tells of each image of the page, in order, as
       * `ebook-convert` had it: the files the images were saved as are
       * removed after the conversion.
       */
      async function exportEPUB(images: string[]) {
        const filePath = path.join(tmpDir, 'note.md');
        // An image alone on its line is a file to import, which the
        // transformer reads itself; in a sentence it is an image.
        fs.writeFileSync(
          filePath,
          `---\nebook:\n  title: T\n---\n\n${images.join('  \n')}\n`,
        );
        const notebook = await Notebook.init({
          notebookPath: tmpDir,
          config: {
            markdownParser: 'markdown-it',
            markdownYoBinaryPath: '',
            previewTheme: 'github-light.css',
          },
        });
        const engine = new MarkdownEngine({ notebook, filePath });

        let imagesOfPage: Image[] = [];
        convert.mockImplementation(async (page) => {
          const $ = load(fs.readFileSync(page, 'utf8'));
          imagesOfPage = $('img')
            .map((offset, img) => {
              const src = $(img).attr('src') ?? '';
              const file = path.basename(fileURLToPath(src));
              return {
                src,
                file,
                content: fs.readFileSync(path.join(tmpDir, file), 'utf8'),
              };
            })
            .get();
        });
        return {
          exported: engine.eBookExport({ fileType: 'epub' }),
          imagesOfThePage: () => imagesOfPage,
        };
      }

      /**
       * The name a download was saved under, without the prefix that keeps
       * it from the file of another download and from a file of the user's
       * next to the note.
       */
      const nameOf = (file: string) => {
        expect(file).toMatch(/^[0-9a-z]{1,9}_/);
        return file.replace(/^[0-9a-z]{1,9}_/, '');
      };

      /** The files that downloads left next to the note. */
      const downloadsLeft = () =>
        fs.readdirSync(tmpDir).filter((name) => /^[0-9a-z]{1,9}_/.test(name));

      test.each([
        [
          'an address with a query and a fragment',
          'https://example.com/a.png?v=1&size=2#the-image',
          'a.png',
        ],
        [
          'a percent-encoded path',
          'https://example.com/my%20image%20%E5%9B%BE%201.png',
          'myimage1.png',
        ],
        ['an escaped %', 'https://example.com/50%25off.png', '50off.png'],
        ['a path that ends in a slash', 'https://example.com/', 'image'],
        [
          'a path of which nothing stays but the extension',
          'https://example.com/%E5%9B%BE.png',
          'image.png',
        ],
        [
          'a last segment of characters no file name takes',
          'https://example.com/my image: 1 (final) & v2.png',
          'myimage1finalv2.png',
        ],
        ['a stem of dots only', 'https://example.com/..png', 'image.png'],
        ['a dot in front of the stem', 'https://example.com/.a.png', 'a.png'],
        ['a dot after the extension', 'https://example.com/a.png.', 'a.png'],
        [
          'a long stem cut where a dot is',
          `https://example.com/${'a.'.repeat(101)}`,
          `${'a.'.repeat(99)}a`,
        ],
      ])(
        'saves the image of %s under a name every system takes',
        async (_, src, name) => {
          answerFetch(imageAt);
          const { exported, imagesOfThePage } = await exportEPUB([
            imageLine(0, src),
          ]);

          await expect(exported).resolves.toBe(path.join(tmpDir, 'note.epub'));
          const [image] = imagesOfThePage();
          expect(nameOf(image.file)).toBe(name);
          // The page points at that file, and it is gone after the conversion.
          expect(image.src).toBe(toFileURL(path.join(tmpDir, image.file)));
          expect(downloadsLeft()).toEqual([]);
        },
      );

      test('takes the name of an image written as HTML from the path as it is written, where a % escapes nothing', async () => {
        // As HTML the address comes to the engine as it is written; as
        // markdown it would have had the % as `%25` first.
        answerFetch(imageAt);
        const { exported, imagesOfThePage } = await exportEPUB([
          'Image 1: <img src="https://example.com/50%off.png" alt="image 0">',
        ]);

        await expect(exported).resolves.toBe(path.join(tmpDir, 'note.epub'));
        const [image] = imagesOfThePage();
        expect(nameOf(image.file)).toBe('50off.png');
        expect(image.src).toBe(toFileURL(path.join(tmpDir, image.file)));
        expect(downloadsLeft()).toEqual([]);
      });

      test('cuts a last segment too long for a file name, keeping its extension', async () => {
        answerFetch(imageAt);
        const { exported, imagesOfThePage } = await exportEPUB([
          imageLine(0, `https://example.com/${'a'.repeat(296)}.png`),
        ]);

        await expect(exported).resolves.toBe(path.join(tmpDir, 'note.epub'));
        const [image] = imagesOfThePage();
        expect(nameOf(image.file)).toBe(`${'a'.repeat(196)}.png`);
        // The whole name, the prefix in front included, in bytes.
        expect(Buffer.byteLength(image.file)).toBeLessThanOrEqual(255);
        expect(image.src).toBe(toFileURL(path.join(tmpDir, image.file)));
        expect(downloadsLeft()).toEqual([]);
      });

      test('saves two addresses with the same last segment as two files, each pointed at by its own image', async () => {
        answerFetch(imageAt);
        const one = 'https://example.com/one/a.png';
        const two = 'https://example.com/two/a.png';
        const { exported, imagesOfThePage } = await exportEPUB([
          imageLine(0, one),
          imageLine(1, two),
        ]);

        await expect(exported).resolves.toBe(path.join(tmpDir, 'note.epub'));
        const images = imagesOfThePage();
        expect(images.map((image) => nameOf(image.file))).toEqual([
          'a.png',
          'a.png',
        ]);
        // Two files: one was not written over the other.
        expect(new Set(images.map((image) => image.file)).size).toBe(2);
        for (const [offset, src] of [one, two].entries()) {
          const image = images[offset];
          // Each image of the page points at the file of its own address.
          expect(image.src).toBe(toFileURL(path.join(tmpDir, image.file)));
          expect(image.content).toBe(`the image asked of ${src}`);
        }
        expect(downloadsLeft()).toEqual([]);
      });

      test('says which image it could not fetch when the network fails', async () => {
        // What fetch rejects with when the network fails: no address in it.
        const failure = new TypeError('fetch failed', {
          cause: new Error('getaddrinfo ENOTFOUND example.com'),
        });
        answerFetch((url: string) => {
          if (url.endsWith('a.png')) {
            throw failure;
          }
          return imageAt(url);
        });
        const { exported } = await exportEPUB([
          imageLine(0, 'https://example.com/a.png'),
          imageLine(1, 'https://example.com/b.png'),
        ]);

        const error: unknown = await exported.then(
          () => undefined,
          (reason: unknown) => reason,
        );
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          'Failed to download image from https://example.com/a.png',
        );
        expect((error as Error).cause).toBe(failure);
        // The export stopped there: the image that was fetched is removed
        // again, and ebook-convert was not given the page.
        expect(downloadsLeft()).toEqual([]);
        expect(convert).not.toHaveBeenCalled();
      });

      test('says which image it could not read when the body breaks while it is read', async () => {
        // The first chunk comes, then the connection is gone: the pipeline
        // rejects with what the stream errors with, which names no image.
        const body = new ReadableStream<Uint8Array>({
          start(controller: ReadableStreamDefaultController<Uint8Array>) {
            controller.enqueue(Buffer.from('the first chunk'));
            controller.error(new Error('socket hang up'));
          },
        });
        answerFetch((url: string) =>
          url.endsWith('a.png') ? { ok: true, body } : imageAt(url),
        );
        const { exported } = await exportEPUB([
          imageLine(0, 'https://example.com/a.png'),
          imageLine(1, 'https://example.com/b.png'),
        ]);

        const error: unknown = await exported.then(
          () => undefined,
          (reason: unknown) => reason,
        );
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          'Failed to download image from https://example.com/a.png',
        );
        expect(String((error as { cause?: unknown }).cause)).toContain(
          'socket hang up',
        );
        // The export stopped there: the files are removed again, and
        // ebook-convert was not given the page.
        expect(downloadsLeft()).toEqual([]);
        expect(convert).not.toHaveBeenCalled();
      });
    });
  });

  describe('begun by a save', () => {
    const fetch_ = globalThis.fetch;
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
      // A failed export is reported on the console.
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleError.mockRestore();
      globalThis.fetch = fetch_;
    });

    /**
     * A note that exports on save what `exportOnSave` (the front matter of
     * `export_on_save`) says, with an image on the web that `fetch` answers
     * as `respond` does. `parse()` is what a host does when the note is
     * saved.
     */
    async function savedNote(
      exportOnSave: string,
      respond: (url: string) => unknown,
    ) {
      globalThis.fetch = jest.fn(respond) as unknown as typeof fetch;
      const filePath = path.join(tmpDir, 'note.md');
      fs.writeFileSync(
        filePath,
        `---\nebook:\n  title: T\nexport_on_save:\n${exportOnSave}---\n\nImage: ![on the web](https://example.com/a.png)\n`,
      );
      const notebook = await Notebook.init({
        notebookPath: tmpDir,
        config: {
          markdownParser: 'markdown-it',
          markdownYoBinaryPath: '',
          previewTheme: 'github-light.css',
        },
      });
      const engine = new MarkdownEngine({ notebook, filePath });
      return {
        engine,
        filePath,
        parse: () =>
          engine.parseMD(fs.readFileSync(filePath, 'utf8'), {
            isForPreview: true,
            useRelativeFilePath: false,
            hideFrontMatter: false,
            triggeredBySave: true,
          }),
      };
    }

    test.each([
      ['a file type', '  ebook: epub\n', ['epub']],
      ['true', '  ebook: true\n', ['epub']],
      ['a list of file types', '  ebook: [epub, mobi]\n', ['epub', 'mobi']],
    ])(
      'reports an export that fails, instead of leaving its failure unhandled, with %s',
      async (_, exportOnSave, fileTypes) => {
        // The image cannot be fetched, which stops the export.
        const { filePath, parse } = await savedNote(exportOnSave, () => ({
          ok: false,
        }));

        await parse();
        // The export runs on its own, awaited nowhere: it has reported
        // before this goes on. That nothing of it is left unhandled is what
        // jest itself sees to — a rejection that no one handles fails the
        // test it happens in.
        await waitFor(() => consoleError.mock.calls.length >= fileTypes.length);

        // The exports run side by side: which of them reports first is not
        // fixed, so the reports are read as a set.
        expect(consoleError).toHaveBeenCalledTimes(fileTypes.length);
        expect(
          consoleError.mock.calls.map(([message]) => message).sort(),
        ).toEqual(
          fileTypes
            .map(
              (fileType) =>
                `[crossnote] the eBook as ${fileType} export of ${filePath} on save failed.`,
            )
            .sort(),
        );
        for (const [, error] of consoleError.mock.calls) {
          expect(error).toEqual(
            expect.objectContaining({
              message:
                'Failed to download image from https://example.com/a.png',
            }),
          );
        }
      },
      // The test may outlast its wait: when no report comes, the wait says
      // so itself, before the timeout of the test does.
      10_000,
    );

    test('the other exporters of a save report a failure the same way', async () => {
      const { engine, filePath, parse } = await savedNote(
        '  html: true\n  ebook: epub\n',
        () => ({ ok: false }),
      );
      jest
        .spyOn(engine, 'htmlExport')
        .mockRejectedValue(new Error('no HTML today'));

      await parse();
      await waitFor(() => consoleError.mock.calls.length >= 2);

      expect(
        consoleError.mock.calls.map(([message]) => message).sort(),
      ).toEqual(
        [
          `[crossnote] the eBook as epub export of ${filePath} on save failed.`,
          `[crossnote] the HTML export of ${filePath} on save failed.`,
        ].sort(),
      );
      expect(consoleError.mock.calls.map(([, error]) => error)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: 'no HTML today' }),
          expect.objectContaining({
            message: 'Failed to download image from https://example.com/a.png',
          }),
        ]),
      );
    });

    test('does not hold back the exporters that come after it', async () => {
      // The image answers when it is released.
      let release: () => void = () => {};
      const released = new Promise<void>((resolve) => {
        release = resolve;
      });
      const { engine, parse } = await savedNote(
        '  ebook: epub\n  html: true\n',
        () => released.then(() => ({ ok: false })),
      );
      const eBook = jest.spyOn(engine, 'eBookExport');
      const html = jest.spyOn(engine, 'htmlExport').mockResolvedValue('');

      await parse();
      // The eBook export has asked for its image and waits for it still,
      // and `parseMD` has returned: the exporter after it has begun.
      try {
        await waitFor(
          () => (globalThis.fetch as jest.Mock).mock.calls.length > 0,
        );
        expect(html).toHaveBeenCalledTimes(1);
        expect(eBook.mock.invocationCallOrder[0]).toBeLessThan(
          html.mock.invocationCallOrder[0],
        );
      } finally {
        release();
      }
      // The export ends before the test does.
      await waitFor(() => consoleError.mock.calls.length > 0);
    });
  });
});

describe('the class of the page in an export', () => {
  track();

  const originalBuildDirectory = getCrossnoteBuildDirectory();
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdirSync({ prefix: 'xnote-page-class-' });
    for (const dir of [
      path.join(tmpDir, 'styles', 'prism_theme'),
      path.join(tmpDir, 'dependencies', 'reveal', 'js'),
      path.join(tmpDir, 'dependencies', 'reveal', 'css', 'theme'),
    ]) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'prism_theme', 'default.css'),
      '/* prism */',
    );
    setCrossnoteBuildDirectory(tmpDir);
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(originalBuildDirectory);
  });

  test.each([
    ['a name', 'class: x', 'x'],
    ['a list of names', 'class: [a, 1]', 'a 1'],
    ['a boolean', 'class: true', 'true'],
    ['a number', 'class: 123', '123'],
    ['false', 'class: false', ''],
    ['zero', 'class: 0', ''],
  ])('is written as it is, with %s', async (_, frontMatter, expected) => {
    const filePath = path.join(tmpDir, 'note.md');
    fs.writeFileSync(filePath, `---\n${frontMatter}\n---\n\n# One\n`);
    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
      },
    });
    const engine = new MarkdownEngine({ notebook, filePath });
    const html = await engine.htmlExportDocument();
    const page = load(html)('div.crossnote');

    expect(page.attr('class')).toBe(`crossnote markdown-preview  ${expected}`);
  });

  test.each([
    ['a number', 'id: 0', undefined],
    ['a boolean', 'id: false', undefined],
    ['a list', 'id: [a, b]', 'a,b'],
  ])(
    'has an id written as it is, with %s',
    async (_, frontMatter, expected) => {
      const filePath = path.join(tmpDir, 'note.md');
      fs.writeFileSync(filePath, `---\n${frontMatter}\n---\n\n# One\n`);
      const notebook = await Notebook.init({
        notebookPath: tmpDir,
        config: {
          markdownParser: 'markdown-it',
          markdownYoBinaryPath: '',
        },
      });
      const engine = new MarkdownEngine({ notebook, filePath });
      const html = await engine.htmlExportDocument();

      expect(load(html)('div.crossnote').attr('id')).toBe(expected);
    },
  );
});
