import { readFileSync, readdirSync } from 'fs';
import * as path from 'path';
import { Notebook, transformMarkdown } from '../../src';

const testCases = readdirSync(path.join(__dirname, './test-files'))
  .map((fileName) => {
    if (fileName.match(/\.expect\.md/)) {
      return [fileName.replace(/\.expect\./, '.'), fileName];
    }
  })
  .filter((x) => !!x);

describe('test markdown transformer', () => {
  testCases.forEach((arr) => {
    if (!arr) {
      return;
    }
    const [inputFileName, expectFileName] = arr;

    test(`transformMarkdown() correctly transforms ${inputFileName}`, async () => {
      const notebook = await Notebook.init({
        notebookPath: path.resolve(__dirname, './test-files'),
        config: {
          usePandocParser: false,
        },
      });
      const transform = async (markdown: string) => {
        return await transformMarkdown(markdown, {
          notebook,
          forPreview: true,
          fileDirectoryPath: '',
          projectDirectoryPath: '',
          filesCache: {},
          useRelativeFilePath: false,
          protocolsWhiteListRegExp: null,
          forJest: true,
        });
      };

      const markdown = readFileSync(
        path.join(__dirname, './test-files', inputFileName),
        'utf-8',
      );
      const expected = readFileSync(
        path.join(__dirname, './test-files', expectFileName),
        'utf-8',
      );
      const { outputString } = await transform(markdown);
      expect(outputString.trim()).toEqual(expected.trim());
    });
  });
});
