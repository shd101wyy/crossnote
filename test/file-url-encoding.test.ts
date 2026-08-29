import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Notebook } from '../src/notebook/index';
import { addFileProtocol, removeFileProtocol, toFileURL } from '../src/utility';

describe('file:// URL encoding (issue #453)', () => {
  describe('addFileProtocol', () => {
    it('percent-encodes #, ? and spaces in paths', () => {
      const url = addFileProtocol('/proj/2026-06#1/img foo.png?v=2');
      expect(url).toBe('file:///proj/2026-06%231/img%20foo.png%3Fv=2');
    });

    it('keeps plain paths byte-identical to the legacy format', () => {
      expect(addFileProtocol('/a/b/c.js')).toBe('file:///a/b/c.js');
    });

    it('leaves already-prefixed file:// URLs untouched', () => {
      expect(addFileProtocol('file:///a%20b/c.js')).toBe('file:///a%20b/c.js');
    });
  });

  describe('toFileURL', () => {
    it('percent-encodes unsafe path characters', () => {
      expect(toFileURL('/proj/2026-06#1/img foo.png')).toBe(
        'file:///proj/2026-06%231/img%20foo.png',
      );
    });

    it('encodes the path in the WSL variant too', () => {
      process.env['WSL_DISTRO_NAME'] = 'Ubuntu';
      try {
        expect(toFileURL('/home/u/a#b.js', { useWSL: true })).toBe(
          'file:////wsl.localhost/Ubuntu/home/u/a%23b.js',
        );
      } finally {
        delete process.env['WSL_DISTRO_NAME'];
      }
    });
  });

  describe('removeFileProtocol', () => {
    it('decodes percent-encoded characters back to a filesystem path', () => {
      expect(removeFileProtocol('file:///proj/2026-06%231/img%20foo.png')).toBe(
        '/proj/2026-06#1/img foo.png',
      );
    });

    it('round-trips addFileProtocol output to the original path', () => {
      const original = '/proj/2026-06#1/arch docs/img foo.png';
      expect(removeFileProtocol(addFileProtocol(original))).toBe(original);
    });

    it('keeps legacy unencoded URLs and malformed % sequences as-is', () => {
      expect(removeFileProtocol('file:///a b/50%.png')).toBe('/a b/50%.png');
    });

    it('decodes vscode-resource URLs', () => {
      const decoded = removeFileProtocol(
        'vscode-resource://///file///C:/a%20b/c.png',
      );
      expect(decoded).toBe(
        process.platform === 'win32' ? 'C:/a b/c.png' : '/C:/a b/c.png',
      );
    });
  });

  describe('markdown rendering with # in the project path', () => {
    let tmp: string;
    let notebook: Notebook;
    let docsDir: string;
    let diagramsDir: string;
    const projectDirName = '2026-06-10#1-AI-platform-arch';

    const encodeFileUrl = (absolutePath: string): string =>
      `file://${encodeURI(absolutePath).replace(/#/g, '%23').replace(/\?/g, '%3F')}`;

    beforeAll(async () => {
      tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'file-url-encoding-'));
      const projectDir = path.join(tmp, projectDirName);
      docsDir = path.join(projectDir, 'docs');
      diagramsDir = path.join(docsDir, 'diagrams');
      fs.mkdirSync(diagramsDir, { recursive: true });
      const svgPath = path.join(diagramsDir, 'foo.svg');
      fs.writeFileSync(
        svgPath,
        '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      );
      const cssPath = path.join(projectDir, 'style.css');
      fs.writeFileSync(cssPath, 'body{}\n');
      const notePath = path.join(docsDir, 'architecture.md');
      fs.writeFileSync(notePath, '![img](diagrams/foo.svg)\n');
      notebook = await Notebook.init({
        notebookPath: tmp,
        config: { markdownParser: 'markdown-it' },
      });
    });

    afterAll(() => {
      fs.rmSync(tmp, { recursive: true, force: true });
    });

    it('encodes # in image src URLs', async () => {
      const notePath = path.join(docsDir, 'architecture.md');
      const engine = notebook.getNoteMarkdownEngine(notePath);
      const { html } = await engine.parseMD(
        '![img](diagrams/foo.svg)\n[link](diagrams/foo.svg)\n',
        {
          useRelativeFilePath: false,
          isForPreview: false,
          hideFrontMatter: true,
          fileDirectoryPath: docsDir,
        },
      );
      const svgPath = path.join(diagramsDir, 'foo.svg');
      expect(html).toContain(`src="${encodeFileUrl(svgPath)}"`);
      expect(html).toContain(`href="${encodeFileUrl(svgPath)}"`);
      // A raw `#` in the src/href would truncate the URL at the fragment.
      expect(html).not.toContain('#1-AI-platform-arch/docs');
    });

    it('encodes # in @import script/stylesheet URLs', async () => {
      const notePath = path.join(docsDir, 'architecture.md');
      const engine = notebook.getNoteMarkdownEngine(notePath);
      const { html } = await engine.parseMD('@import "style.css"\n', {
        useRelativeFilePath: false,
        isForPreview: false,
        hideFrontMatter: true,
        fileDirectoryPath: path.dirname(docsDir),
      });
      expect(html).toContain('%231-AI-platform-arch');
      expect(html).not.toContain('#1-AI-platform-arch/style.css');
    });
  });
});
