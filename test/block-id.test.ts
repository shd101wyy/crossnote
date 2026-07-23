/**
 * Tests for the `^block-id` line transform in transformMarkdown
 * (the `<span id="..." class="block-id"></span>` injection).
 *
 * The main syntax battery lives in the fixture pair
 * test/markdown/test-files/block-id.md / block-id.expect.md.  This file
 * pins the cases that cannot live in fixture files because editors and
 * git rewrite exactly those bytes (trailing whitespace, CRLF line
 * endings), plus edge cases best expressed on constructed strings.
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
