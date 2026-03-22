import * as vm from 'vm';
import { interpretJS } from '../src/utility';

describe('parser.js prototype-chain RCE prevention', () => {
  /**
   * Simulates the crossnote flow: interpretJS evaluates parser.js,
   * then the result is spread into a host object (the old vulnerable pattern).
   */
  function simulateVulnerableFlow(code: string) {
    const result = interpretJS(code);
    // Old pattern: spread into host object — this is what made it exploitable
    const parserConfig = {
      onWillParseMarkdown: async (md: string) => md,
      onDidParseMarkdown: async (html: string) => html,
      ...(result ?? {}),
    };
    return parserConfig;
  }

  /**
   * Simulates the fixed flow: hooks are called with a null-prototype `this`.
   */
  function simulateFixedFlow(code: string) {
    const result = interpretJS(code);
    const safeThis = Object.create(null);
    return {
      onWillParseMarkdown:
        typeof result?.onWillParseMarkdown === 'function'
          ? (md: string) => result.onWillParseMarkdown.call(safeThis, md)
          : async (md: string) => md,
      onDidParseMarkdown:
        typeof result?.onDidParseMarkdown === 'function'
          ? (html: string) => result.onDidParseMarkdown.call(safeThis, html)
          : async (html: string) => html,
    };
  }

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

  describe('vulnerable pattern (spread into host object)', () => {
    it('allows prototype-chain escape via onWillParseMarkdown', async () => {
      const config = simulateVulnerableFlow(maliciousCode);
      const result = await config.onWillParseMarkdown('test');
      // This demonstrates the vulnerability exists in the OLD pattern
      expect(result).toMatch(/^ESCAPED:/);
    });

    it('allows prototype-chain escape via onDidParseMarkdown', async () => {
      const config = simulateVulnerableFlow(maliciousCode);
      const result = await config.onDidParseMarkdown('test');
      expect(result).toMatch(/^ESCAPED:/);
    });
  });

  describe('fixed pattern (null-prototype this)', () => {
    it('blocks prototype-chain escape via onWillParseMarkdown', async () => {
      const config = simulateFixedFlow(maliciousCode);
      const result = await config.onWillParseMarkdown('test');
      expect(result).toMatch(/^BLOCKED:/);
    });

    it('blocks prototype-chain escape via onDidParseMarkdown', async () => {
      const config = simulateFixedFlow(maliciousCode);
      const result = await config.onDidParseMarkdown('test');
      expect(result).toMatch(/^BLOCKED:/);
    });

    it('still allows normal parser hooks to function', async () => {
      const config = simulateFixedFlow(safeCode);
      expect(await config.onWillParseMarkdown('foo baz')).toBe('bar baz');
      expect(await config.onDidParseMarkdown('foo baz')).toBe('bar baz');
    });
  });

  describe('vm.runInNewContext isolation (without spread)', () => {
    it('blocks escape when this stays in vm context', async () => {
      const context: Record<string, unknown> = {};
      vm.runInNewContext(`result = (${maliciousCode.trim()})`, context);
      // Without spreading, this stays the vm-context object
      const result = await (
        context.result as {
          onWillParseMarkdown: (s: string) => Promise<string>;
        }
      ).onWillParseMarkdown('test');
      expect(result).toMatch(/^BLOCKED:/);
    });
  });
});
