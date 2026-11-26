import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import * as cheerio from 'cheerio';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import * as utility from '../src/utility';

/**
 * An EPUB and a MOBI bring the images of the note: those that are on the web
 * are downloaded into the folder of the note first, and the note points at
 * them.
 */

describe('the remote images of an eBook', () => {
  track();

  let tmpDir: string;
  let engine: MarkdownEngine;
  const fetch_ = globalThis.fetch;

  const image = () => ({
    ok: true,
    body: Readable.toWeb(Readable.from([Buffer.from('the image')])),
  });

  /** An image whose connection is lost while it is being written. */
  const brokenImage = () => {
    const stream = new Readable({ read() {} });
    process.nextTick(() =>
      stream.destroy(new Error('the connection was lost')),
    );
    return { ok: true, body: Readable.toWeb(stream) };
  };

  beforeAll(async () => {
    tmpDir = mkdirSync({ prefix: 'xnote-ebook-images-' });
    const filePath = path.join(tmpDir, 'note.md');
    fs.writeFileSync(filePath, '![on the web](https://example.com/a.png)\n');
    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
      },
    });
    engine = new MarkdownEngine({ notebook, filePath });
  });

  beforeEach(() => {
    // What an earlier test brought next to the note: a download that
    // succeeds leaves its file there for the conversion to find.
    for (const name of fs.readdirSync(tmpDir)) {
      if (name !== 'note.md') {
        fs.rmSync(path.join(tmpDir, name), { force: true });
      }
    }
    globalThis.fetch = jest.fn(async () => image()) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = fetch_;
  });

  /** Bring the images of `html` next to the note for `dest`. */
  const download = (html: string, dest: string) =>
    (
      engine as unknown as {
        eBookDownloadImages(
          $: cheerio.CheerioAPI,
          dest: string,
        ): Promise<string[]>;
      }
    ).eBookDownloadImages(cheerio.load(html), path.join(tmpDir, dest));

  const WEB_PAGE =
    '<p><img src="https://example.com/a.png"><img src="local.png"></p>';

  test.each(['note.epub', 'note.mobi'])(
    'are brought into the folder of the note for %s',
    async (dest) => {
      const saved = await download(WEB_PAGE, dest);

      expect(saved).toHaveLength(1);
      const [imagePath] = saved;
      // Next to the note, with what was asked of the web.
      expect(path.dirname(imagePath)).toBe(tmpDir);
      expect(fs.readFileSync(imagePath, 'utf8')).toBe('the image');
      expect((globalThis.fetch as jest.Mock).mock.calls).toEqual([
        ['https://example.com/a.png'],
      ]);
    },
  );

  test('the page points at what was brought, and a local image is left where it is', async () => {
    const $ = cheerio.load(WEB_PAGE);
    const saved = await (
      engine as unknown as {
        eBookDownloadImages(
          $: cheerio.CheerioAPI,
          dest: string,
        ): Promise<string[]>;
      }
    ).eBookDownloadImages($, path.join(tmpDir, 'note.mobi'));

    expect($('img').eq(0).attr('src')).toBe(utility.toFileURL(saved[0]));
    expect($('img').eq(1).attr('src')).toBe('local.png');
  });

  test('are left where they are for any other format', async () => {
    expect(await download(WEB_PAGE, 'note.html')).toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test.each(['note.epub', 'note.mobi'])(
    'are removed again when one of them cannot be fetched, for %s',
    async (dest) => {
      globalThis.fetch = jest.fn(async (url: string) =>
        url.endsWith('b.png')
          ? { ok: false }
          : url.endsWith('c.png')
            ? brokenImage()
            : image(),
      ) as unknown as typeof fetch;

      await expect(
        download(
          '<p><img src="https://example.com/a.png"><img src="https://example.com/b.png"><img src="https://example.com/c.png"></p>',
          dest,
        ),
      ).rejects.toThrow(
        'Failed to download image from https://example.com/b.png',
      );
      // Nothing of them stays next to the note.
      expect(
        fs.readdirSync(tmpDir).filter((name) => name !== 'note.md'),
      ).toEqual([]);
    },
  );
});
