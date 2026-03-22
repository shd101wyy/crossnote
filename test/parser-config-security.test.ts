import * as vm from 'vm';
import { loadConfigsInDirectory } from '../src/notebook/config-helper';
import { FileSystemApi, ParserConfig } from '../src/notebook/types';
import { interpretJS } from '../src/utility';

// Mock `less` since it's not available in the test environment
jest.mock('less', () => ({
  render: (
    _input: string,
    _options: unknown,
    callback: (error: unknown, output: { css: string } | undefined) => void,
  ) => {
    callback(null, { css: '' });
  },
}));

describe('parser.js prototype-chain RCE prevention', () => {
  const maliciousCode = `({
    onWillParseMarkdown: async function(markdown) {
      try {
        const p = this.constructor.constructor("return process")();
        return "ESCAPED:" + p.version;
      } catch(e) {
        return "BLOCKED:" + e.message;
      }
    },
    onDidParseMarkdown: async function(html) {
      try {
        const p = this.constructor.constructor("return process")();
        return "ESCAPED:" + p.version;
      } catch(e) {
        return "BLOCKED:" + e.message;
      }
    }
  })`;

  const safeCode = `({
    onWillParseMarkdown: async function(markdown) {
      return markdown.replace(/foo/g, "bar");
    },
    onDidParseMarkdown: async function(html) {
      return html.replace(/foo/g, "bar");
    }
  })`;

  /**
   * Create a mock FileSystemApi that serves the given parser.js content.
   */
  function mockFs(parserJsContent: string): FileSystemApi {
    const files: Record<string, string> = {
      'test-dir/parser.js': parserJsContent,
    };
    return {
      readFile: async (filePath: string) => {
        if (files[filePath]) return files[filePath];
        throw new Error(`File not found: ${filePath}`);
      },
      writeFile: async (filePath: string, content: string) => {
        files[filePath] = content;
      },
      mkdir: async () => {},
      exists: async (filePath: string) =>
        filePath in files || filePath === 'test-dir',
      stat: async () => {
        throw new Error('Not implemented');
      },
      readdir: async () => [],
      unlink: async () => {},
    };
  }

  describe('loadConfigsInDirectory (production code path)', () => {
    it('blocks prototype-chain escape via onWillParseMarkdown', async () => {
      const fs = mockFs(maliciousCode);
      const config = await loadConfigsInDirectory('test-dir', fs);
      const parserConfig = config.parserConfig as ParserConfig;
      const result = await parserConfig.onWillParseMarkdown('test');
      expect(result).toMatch(/^BLOCKED:/);
    });

    it('blocks prototype-chain escape via onDidParseMarkdown', async () => {
      const fs = mockFs(maliciousCode);
      const config = await loadConfigsInDirectory('test-dir', fs);
      const parserConfig = config.parserConfig as ParserConfig;
      const result = await parserConfig.onDidParseMarkdown('test');
      expect(result).toMatch(/^BLOCKED:/);
    });

    it('still allows normal parser hooks to function', async () => {
      const fs = mockFs(safeCode);
      const config = await loadConfigsInDirectory('test-dir', fs);
      const parserConfig = config.parserConfig as ParserConfig;
      expect(await parserConfig.onWillParseMarkdown('foo baz')).toBe('bar baz');
      expect(await parserConfig.onDidParseMarkdown('foo baz')).toBe('bar baz');
    });
  });

  describe('vulnerable pattern (spread into host object)', () => {
    function simulateVulnerableFlow(code: string) {
      const result = interpretJS(code);
      return {
        onWillParseMarkdown: async (md: string) => md,
        onDidParseMarkdown: async (html: string) => html,
        ...(result ?? {}),
      };
    }

    it('allows prototype-chain escape via onWillParseMarkdown', async () => {
      const config = simulateVulnerableFlow(maliciousCode);
      const result = await config.onWillParseMarkdown('test');
      expect(result).toMatch(/^ESCAPED:/);
    });

    it('allows prototype-chain escape via onDidParseMarkdown', async () => {
      const config = simulateVulnerableFlow(maliciousCode);
      const result = await config.onDidParseMarkdown('test');
      expect(result).toMatch(/^ESCAPED:/);
    });
  });

  describe('vm.runInNewContext isolation (without spread)', () => {
    it('blocks escape when this stays in vm context', async () => {
      const context: Record<string, unknown> = {};
      vm.runInNewContext(`result = (${maliciousCode.trim()})`, context);
      const result = await (
        context.result as {
          onWillParseMarkdown: (s: string) => Promise<string>;
        }
      ).onWillParseMarkdown('test');
      expect(result).toMatch(/^BLOCKED:/);
    });
  });
});
