/**
 * Tests for the `^block-id` line transform in transformMarkdown
 * (the `<span id="..." class="block-id"></span>` injection).
 *
 * The main syntax battery lives in the fixture pair
 * test/markdown/test-files/block-id.md / block-id.expect.md.  This file
 * pins the cases that cannot live in fixture files because editors and
 * git rewrite exactly those bytes (trailing whitespace, CRLF line
 * endings), plus edge cases best expressed on constructed strings.
 * It also holds the performance smoke tests for the transform.
 */
import * as path from 'path';
import { transformMarkdown } from '../src/markdown-engine/transformer';
import { Notebook } from '../src/notebook/index';

describe('^block-id transform', () => {
  let notebook: Notebook;

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-it',
      },
    });
  });

  async function transform(markdown: string): Promise<string> {
    const { outputString } = await transformMarkdown(markdown, {
      notebook,
      forPreview: true,
      fileDirectoryPath: path.resolve(__dirname, './markdown/test-files'),
      projectDirectoryPath: path.resolve(__dirname, './markdown/test-files'),
      filesCache: {},
      useRelativeFilePath: false,
      protocolsWhiteListRegExp: /^(https?)/,
      forJest: true,
      timestamp: 12345,
    });
    return outputString;
  }

  it('replaces a trailing ^id with a block-id span', async () => {
    expect(await transform('Basic block id at end ^ref1')).toEqual(
      'Basic block id at end <span id="ref1" class="block-id"></span>\n',
    );
  });

  it('does not transform when a space follows the id', async () => {
    expect(await transform('Trailing space after id ^ref10 ')).toEqual(
      'Trailing space after id ^ref10 \n',
    );
  });

  it('transforms a CRLF line, with the \\r stripped up front', async () => {
    expect(await transform('CRLF line ^ref11\r\nplain second line')).toEqual(
      'CRLF line <span id="ref11" class="block-id"></span>\nplain second line\n',
    );
  });

  it('transforms only the last ^id when several are present', async () => {
    expect(await transform('a ^x ^y')).toEqual(
      'a ^x <span id="y" class="block-id"></span>\n',
    );
  });

  it('transforms a whitespace-only prefix, keeping the empty rest', async () => {
    expect(await transform(' ^id')).toEqual(
      ' <span id="id" class="block-id"></span>\n',
    );
  });
});

describe('^block-id transform performance', () => {
  // The block-id replace regex runs on nearly every line, so it must
  // stay linear-time on lines that do NOT match, which is almost every
  // line of a real document.  Two backtracking regimes have produced
  // quadratic blowups here, and each gets a smoke test below:
  //   1. long prose lines: a lazy `(.*?)` head retried per start offset
  //      costs the sum of squared line lengths (0.9.31 shipped this);
  //   2. long whitespace runs: a `\s+\^` suffix attempted from each
  //      offset inside a run costs the squared run length (an anchored
  //      `/^(.*?)\s+\^(id)$/` lands here despite fixing regime 1).
  // There is no asserted time bound: a regression shows up as the
  // affected test's reported runtime ballooning.  Measured on an
  // M-series laptop (Node 26), 2000 lines x ~2128 chars per regime:
  //   linear lookbehind suffix regex   ~10 ms regime 1, ~40 ms regime 2
  //   regime 1 regression              ~5.6 s
  //   regime 2 regression              ~14 s
  let notebook: Notebook;

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-it',
      },
    });
  });

  it('passes long non-matching lines through unchanged', async () => {
    const line =
      'lorem ipsum dolor sit amet, consectetur adipiscing elit '.repeat(38);
    const input = Array.from({ length: 2000 }, () => line).join('\n');

    const { outputString } = await transformMarkdown(input, {
      notebook,
      forPreview: true,
      fileDirectoryPath: path.resolve(__dirname, './markdown/test-files'),
      projectDirectoryPath: path.resolve(__dirname, './markdown/test-files'),
      filesCache: {},
      useRelativeFilePath: false,
      protocolsWhiteListRegExp: /^(https?)/,
      forJest: true,
      timestamp: 12345,
    });

    // Non-matching prose lines must pass through unchanged.
    expect(outputString.trim()).toEqual(input.trim());
  });

  it('passes lines ending in long whitespace runs through unchanged', async () => {
    const line = 'x' + ' '.repeat(2127);
    const input = Array.from({ length: 2000 }, () => line).join('\n');

    const { outputString } = await transformMarkdown(input, {
      notebook,
      forPreview: true,
      fileDirectoryPath: path.resolve(__dirname, './markdown/test-files'),
      projectDirectoryPath: path.resolve(__dirname, './markdown/test-files'),
      filesCache: {},
      useRelativeFilePath: false,
      protocolsWhiteListRegExp: /^(https?)/,
      forJest: true,
      timestamp: 12345,
    });

    // Trailing whitespace carries no ^block-id, so it must survive.
    expect(outputString.trim()).toEqual(input.trim());
  });
});
