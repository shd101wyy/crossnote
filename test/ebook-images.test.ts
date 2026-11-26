import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import * as cheerio from 'cheerio';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';

/**
 * An EPUB and a MOBI hold the images of the note: those that are on the web
 * are downloaded into the folder of the note first, and the note points at
 * them.
 */

describe('the remote images of an eBook', () => {
  track();

  let tmpDir: string;
  let engine: MarkdownEngine;
  const fetch_ = globalThis.fetch;

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
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      body: Readable.toWeb(Readable.from([Buffer.from('the image')])),
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = fetch_;
  });

  const download = (dest: string) =>
    (
      engine as unknown as {
        eBookDownloadImages(
          $: cheerio.CheerioAPI,
          dest: string,
        ): Promise<string[]>;
      }
    ).eBookDownloadImages(
      cheerio.load(
        '<p><img src="https://example.com/a.png"><img src="local.png"></p>',
      ),
      path.join(tmpDir, dest),
    );

  test.each(['note.epub', 'note.mobi'])(
    'are brought into the folder of the note for %s',
    async (dest) => {
      const saved = await download(dest);

      expect(saved).toHaveLength(1);
      expect(fs.readFileSync(saved[0], 'utf8')).toBe('the image');
      // What was asked of the web.
      expect((globalThis.fetch as jest.Mock).mock.calls).toEqual([
        ['https://example.com/a.png'],
      ]);
    },
  );

  test('are left where they are for any other format', async () => {
    expect(await download('note.html')).toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
