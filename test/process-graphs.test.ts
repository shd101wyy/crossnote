import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Notebook } from '../src/notebook/index';
import { processGraphs } from '../src/converters/process-graphs';

jest.mock('../src/renderers/puml', () => ({
  render: jest
    .fn()
    .mockResolvedValue(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="red"/></svg>',
    ),
}));

describe('processGraphs cacheBust option', () => {
  let notebook: Notebook;
  let tmpDir: string;
  let imageDir: string;

  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crossnote-graphs-'));
    imageDir = path.join(tmpDir, 'assets');
    fs.mkdirSync(imageDir);
    notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: { markdownParser: 'markdown-it' },
    });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const markdown = [
    '```puml',
    '@startuml',
    'Alice -> Bob: hello',
    '@enduml',
    '```',
  ].join('\n');

  it('produces clean image URLs when cacheBust is false', async () => {
    const { outputString, imagePaths } = await processGraphs(markdown, {
      fileDirectoryPath: tmpDir,
      projectDirectoryPath: tmpDir,
      imageDirectoryPath: imageDir,
      imageFilePrefix: 'test_',
      useRelativeFilePath: true,
      codeChunksData: {},
      graphsCache: {},
      addOptionsStr: false,
      cacheBust: false,
      notebook,
    });

    const pngPath = imagePaths[0];
    expect(pngPath).toBeTruthy();
    expect(fs.existsSync(pngPath)).toBe(true);

    // Image reference should NOT contain a query string.
    expect(outputString).toContain('![');
    expect(outputString).toContain('.png');
    const imageLine = outputString.split('\n').find((l) => l.includes('.png'));
    expect(imageLine).not.toContain('.png?');
  });

  it('adds cache-bust query string by default', async () => {
    const { outputString, imagePaths } = await processGraphs(markdown, {
      fileDirectoryPath: tmpDir,
      projectDirectoryPath: tmpDir,
      imageDirectoryPath: imageDir,
      imageFilePrefix: 'test2_',
      useRelativeFilePath: true,
      codeChunksData: {},
      graphsCache: {},
      addOptionsStr: false,
      notebook,
    });

    const pngPath = imagePaths[0];
    expect(pngPath).toBeTruthy();
    expect(fs.existsSync(pngPath)).toBe(true);

    const imageLine = outputString.split('\n').find((l) => l.includes('.png'));
    expect(imageLine).toContain('.png?');
  });

  it('returns text unchanged when no diagram blocks are present', async () => {
    const plain = '# Hello\n\nSome text.\n';
    const { outputString, imagePaths } = await processGraphs(plain, {
      fileDirectoryPath: tmpDir,
      projectDirectoryPath: tmpDir,
      imageDirectoryPath: imageDir,
      imageFilePrefix: 'test3_',
      useRelativeFilePath: true,
      codeChunksData: {},
      graphsCache: {},
      addOptionsStr: false,
      notebook,
    });

    // processGraphs normalizes trailing whitespace on empty lines but
    // preserves the original heading and text content.
    expect(outputString).toContain('# Hello');
    expect(outputString).toContain('Some text.');
    expect(imagePaths).toHaveLength(0);
  });
});
