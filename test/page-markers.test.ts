import * as fs from 'fs';
import * as path from 'path';
import { load } from 'cheerio';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import {
  newSlideMarkerToken,
  slideMarker,
  slideMarkerRegExp,
  tocMarkerRegExp,
} from '../src/markdown-engine/page-markers';
import { Notebook } from '../src/notebook';

jest.mock('less', () => ({
  render: (
    _input: string,
    _options: unknown,
    callback: (error: unknown, output: { css: string } | undefined) => void,
  ) => {
    callback(null, { css: '' });
  },
}));

/** The token of the rendering whose markers are looked for. */
const TOKEN = '0123456789abcdef0123456789abcdef';

/** The token of another rendering. */
const OTHER_TOKEN = 'fedcba9876543210fedcba9876543210';

/** The slide markers of the rendering, as `parseSlides` looks for them. */
const slideMarkers = () => slideMarkerRegExp(TOKEN);

/**
 * A page of many `<p` with no `>`: at every such `<p` the old `<p[^>]*>`
 * alternative scanned on to the next `>` (here, the `>` of the marker's
 * `<span>`), which is quadratic (crossnote#588).
 */
const OPEN_P_COUNT = 40_000;
const SCAN_BOUND_MS = 250;

function pageOfOpenPThen(suffix: string): string {
  return '<p '.repeat(OPEN_P_COUNT) + suffix;
}

function scan(
  html: string,
  regexp: () => RegExp,
): { ms: number; matches: RegExpMatchArray[] } {
  const marker = regexp();
  const started = process.hrtime.bigint();
  const matches = [...html.matchAll(marker)];
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  return { ms, matches };
}

function captures(html: string, regexp: () => RegExp): (string | undefined)[] {
  return [...html.matchAll(regexp())].map((match) => match[1]);
}

async function renderPreview(markdown: string): Promise<{
  html: string;
  isPresentation: boolean;
}> {
  const tmpDir = mkdirSync({ prefix: 'xnote-markers-' });
  const filePath = path.join(tmpDir, 'note.md');
  fs.writeFileSync(filePath, markdown);
  const notebook = await Notebook.init({
    notebookPath: tmpDir,
    config: {
      markdownParser: 'markdown-it',
      markdownYoBinaryPath: '',
    },
  });
  const engine = new MarkdownEngine({ notebook, filePath });
  const { html } = await engine.parseMD(markdown, {
    isForPreview: true,
    useRelativeFilePath: false,
    hideFrontMatter: false,
  });
  return { html, isPresentation: engine.isPreviewInPresentationMode };
}

describe('slide and [toc] markers in rendered HTML', () => {
  track();

  test('a token is 32 hex characters, and new for every rendering', () => {
    const first = newSlideMarkerToken();
    const second = newSlideMarkerToken();
    expect(first).toMatch(/^[0-9a-f]{32}$/);
    expect(second).toMatch(/^[0-9a-f]{32}$/);
    expect(second).not.toBe(first);
  });

  // The token comes first: no colon follows the number, where `:100:` and
  // `:1234:` would be shortcodes to the emoji plugin.
  test('a marker is the span, the token, then the number', () => {
    expect(slideMarker(3, TOKEN)).toBe(
      `<span>[CROSSNOTESLIDE:${TOKEN}:3]</span>`,
    );
  });

  // The number does not come first, before a colon: `:100:` and `:1234:` are
  // shortcodes to the emoji plugin, which puts an emoji in the place of the
  // number, and the 101st and the 1235th slide were not cut.
  test.each([100, 1234])(
    'slide %i is cut, although its number between colons is an emoji',
    async (number) => {
      const count = number + 1;
      const { html, isPresentation } = await renderPreview(
        Array.from(
          { length: count },
          (_, i) => `<!-- slide class="s${i}" -->\n\n# Slide ${i}\n\n`,
        ).join(''),
      );
      const $ = load(html);

      expect(isPresentation).toBe(true);
      expect(
        $('section.slide')
          .map((_, section) => $(section).attr('class'))
          .get(),
      ).toEqual(Array.from({ length: count }, (_, i) => `slide s${i}`));
    },
  );

  test('a paragraph of its own is a slide marker and keeps its number', () => {
    expect(
      captures(
        `<p><span>[CROSSNOTESLIDE:${TOKEN}:0]</span></p>\n<p>First</p>\n<p><span>[CROSSNOTESLIDE:${TOKEN}:2]</span></p>\n<p>Second</p>`,
        slideMarkers,
      ),
    ).toEqual(['0', '2']);
  });

  test('a paragraph with attributes is a slide marker', () => {
    expect(
      captures(
        `<p data-source-line="4" class="x"><span>[CROSSNOTESLIDE:${TOKEN}:3]</span></p>`,
        slideMarkers,
      ),
    ).toEqual(['3']);
  });

  test('a marker that starts a line is found, with the spaces before it', () => {
    expect(
      captures(
        `  <span>[CROSSNOTESLIDE:${TOKEN}:1]</span>\n<p>Hi</p>`,
        slideMarkers,
      ),
    ).toEqual(['1']);
  });

  test('a marker that does not start a line and is not a paragraph is left', () => {
    expect(
      captures(`hello<span>[CROSSNOTESLIDE:${TOKEN}:1]</span>`, slideMarkers),
    ).toEqual([]);
  });

  // The number of a slide is no secret: `0` is always the first one's. Only
  // the token of the rendering tells the marker the engine wrote from text
  // (crossnote#589).
  test('a marker without the token of the rendering is not one', () => {
    const texts = [
      '[CROSSNOTESLIDE]',
      '[CROSSNOTESLIDE:0]',
      `[CROSSNOTESLIDE:${OTHER_TOKEN}:0]`,
      // All but the last character of the token, and the number of a slide.
      `[CROSSNOTESLIDE:${TOKEN.slice(0, 31)}0:0]`,
      // The token in capitals.
      `[CROSSNOTESLIDE:${TOKEN.toUpperCase()}:0]`,
      // The token of the rendering in the text of another marker.
      `[CROSSNOTESLIDE:0:${TOKEN}]`,
      `[CROSSNOTESLIDE:${OTHER_TOKEN}:0:${TOKEN}]`,
    ];
    for (const text of texts) {
      expect(
        captures(
          `<p><span>${text}</span></p>\n<p><span>${text}</span>`,
          slideMarkers,
        ),
      ).toEqual([]);
    }
  });

  test('a [toc] in a paragraph of its own, or that starts a line, is found', () => {
    const html = `<p><span>[CROSSNOTETOC]</span></p>
<p>Between</p>
  <span>[CROSSNOTETOC]</span>
`;
    expect([...html.matchAll(tocMarkerRegExp())]).toHaveLength(2);
  });

  test('real slide markers still split slides and keep their configs', async () => {
    const { html, isPresentation } =
      await renderPreview(`<!-- slide class="mine" -->

# First

\`\`\`js
let a = 1;
\`\`\`
<!-- slide vertical=true -->

# Second
`);

    expect(isPresentation).toBe(true);
    expect(html).not.toContain('[CROSSNOTESLIDE]');
    const slides = load(html)('section[data-h]');
    expect(
      slides.toArray().map((section) => ({
        h: section.attribs['data-h'],
        v: section.attribs['data-v'],
        class: section.attribs['class'],
        text: load(html)(section).text().replace(/\s+/g, ' ').trim(),
      })),
    ).toEqual([
      { h: '0', v: '0', class: 'slide mine', text: 'First let a = 1;' },
      { h: '0', v: '1', class: 'slide', text: 'Second' },
    ]);
  });

  test('a [toc] is still replaced by the table of contents', async () => {
    const { html } = await renderPreview(`# First

[toc]

# Second
`);

    expect(html).not.toContain('[CROSSNOTETOC]');
    expect(html).toContain('href="#second"');
  });

  test('a page of many <p with no > plus a slide marker is scanned quickly', () => {
    const html = pageOfOpenPThen(
      `\n<span>[CROSSNOTESLIDE:${TOKEN}:3]</span>\n<p>Hi</p>`,
    );
    const { ms, matches } = scan(html, slideMarkers);

    expect(matches.map((match) => match[1])).toEqual(['3']);
    expect(ms).toBeLessThan(SCAN_BOUND_MS);
  }, 20_000);

  /**
   * The token is compared at every `[CROSSNOTESLIDE:` in the page, and a
   * page can hold many that were written as text — each all but one
   * character of the token, which is the longest the comparison can run.
   */
  test('a page of many markers written as text is scanned quickly', () => {
    const almost = TOKEN.slice(0, 31) + (TOKEN.endsWith('0') ? '1' : '0');
    const html = (
      `<p><span>[CROSSNOTESLIDE:${almost}:3]</span></p>\n` +
      `<p><span>[CROSSNOTESLIDE:3]</span></p>\n`
    ).repeat(40_000);
    const { ms, matches } = scan(html, slideMarkers);

    expect(matches).toHaveLength(0);
    expect(ms).toBeLessThan(SCAN_BOUND_MS);
  }, 20_000);

  test('a page of many <p with no > plus a [toc] marker is scanned quickly', () => {
    const html = pageOfOpenPThen('\n<span>[CROSSNOTETOC]</span>\n<h1>Hi</h1>');
    const { ms, matches } = scan(html, tocMarkerRegExp);

    expect(matches).toHaveLength(1);
    expect(ms).toBeLessThan(SCAN_BOUND_MS);
  }, 20_000);

  /**
   * A page of many line breaks: at every line start the old `^\s*`
   * alternative scanned on through all the following line breaks to the
   * end of the page before `<span>` failed, which is quadratic (crossnote#588).
   */
  test('a page of many line breaks is scanned quickly', () => {
    const html = '\n'.repeat(80_000);
    const { ms, matches } = scan(html, slideMarkers);

    expect(matches).toHaveLength(0);
    expect(ms).toBeLessThan(SCAN_BOUND_MS);
  }, 20_000);

  test('a page of many spaced line breaks is scanned quickly', () => {
    const html = '\n '.repeat(40_000);
    const { ms, matches } = scan(html, tocMarkerRegExp);

    expect(matches).toHaveLength(0);
    expect(ms).toBeLessThan(SCAN_BOUND_MS);
  }, 20_000);
});
