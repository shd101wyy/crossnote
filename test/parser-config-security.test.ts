import {
  createSandboxedParserConfig,
  evalConfigJS,
} from '../src/lib/js-sandbox';
import { loadConfigsInDirectory } from '../src/notebook/config-helper';
import {
  FileSystemApi,
  ParserConfig,
  getDefaultParserConfig,
} from '../src/notebook/types';

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

/**
 * Regression tests for GHSA-427h-jhpr-8jch: `.crossnote/config.js` and
 * `.crossnote/parser.js` are untrusted code from the workspace and must never
 * be able to reach the host realm (and from there `process` / `child_process`).
 *
 * They are now evaluated inside the QuickJS WASM sandbox, which has its own
 * realm/intrinsics, so the prototype-chain escape
 * (`({}).constructor.constructor('return process')()`) that defeated both
 * `vm.runInNewContext` and `sval` cannot reach a host `process`.
 */

// The advisory's proof-of-concept escape, used verbatim where possible.
const RCE_EXPRESSION = `(function () {
  try {
    var F = this.constructor.constructor;
    var p = F('return process')();
    return 'ESCAPED:' + (p && p.version);
  } catch (e) {
    return 'BLOCKED:' + e.message;
  }
})()`;

describe('js-sandbox: config.js evaluation', () => {
  it('returns plain data from a config object', async () => {
    const result = (await evalConfigJS(
      `({ a: 1, nested: { b: [2, 3] }, katexConfig: { macros: {} } })`,
    )) as Record<string, unknown>;
    expect(result).toEqual({
      a: 1,
      nested: { b: [2, 3] },
      katexConfig: { macros: {} },
    });
  });

  it('does not expose host globals (process / require) to config.js', async () => {
    const result = (await evalConfigJS(`({
      hasProcess: typeof globalThis.process,
      hasRequire: typeof globalThis.require,
      escapeAttempt: ${RCE_EXPRESSION},
    })`)) as Record<string, string>;
    expect(result.hasProcess).toBe('undefined');
    expect(result.hasRequire).toBe('undefined');
    expect(result.escapeAttempt).toMatch(/^BLOCKED:/);
  });

  it('rejects the advisory RCE payload instead of executing it', async () => {
    // `process` does not exist in the sandbox realm, so the payload throws
    // at evaluation time rather than achieving code execution.
    await expect(
      evalConfigJS(`(() => {
        var F = this.constructor.constructor;
        var p = F('return process')();
        p.getBuiltinModule('child_process').execSync('echo pwned');
        return { enableScriptExecution: true };
      })()`),
    ).rejects.toThrow(/process'? is not defined/);
  });

  it('aborts an infinite loop via the interrupt deadline (DoS guard)', async () => {
    await expect(evalConfigJS(`(() => { while (true) {} })()`)).rejects.toThrow(
      /interrupted|InternalError/i,
    );
  }, 15000);
});

describe('js-sandbox: parser.js hooks', () => {
  it('runs safe sync and async hooks with string-in/string-out', async () => {
    const parser = await createSandboxedParserConfig(
      `({
        onWillParseMarkdown: async function (md) { return md.replace(/foo/g, 'bar'); },
        onDidParseMarkdown: function (html) { return html.toUpperCase(); }
      })`,
      getDefaultParserConfig(),
    );
    try {
      expect(await parser.onWillParseMarkdown('foo baz')).toBe('bar baz');
      expect(await parser.onDidParseMarkdown('hi')).toBe('HI');
    } finally {
      parser.dispose();
    }
  });

  it('prevents prototype-chain escape from inside a hook', async () => {
    const parser = await createSandboxedParserConfig(
      `({
        onWillParseMarkdown: async function (md) { return ${RCE_EXPRESSION}; },
        onDidParseMarkdown: function (html) { return html; }
      })`,
      getDefaultParserConfig(),
    );
    try {
      expect(await parser.onWillParseMarkdown('x')).toMatch(/^BLOCKED:/);
    } finally {
      parser.dispose();
    }
  });

  it('falls back to identity when a hook throws uncaught', async () => {
    const parser = await createSandboxedParserConfig(
      `({
        onWillParseMarkdown: async function (md) {
          // Uncaught reference to a host global -> rejects inside the sandbox.
          return process.version;
        },
        onDidParseMarkdown: function (html) { return html; }
      })`,
      getDefaultParserConfig(),
    );
    try {
      // The default parser config is identity, so the input passes through.
      expect(await parser.onWillParseMarkdown('untouched')).toBe('untouched');
    } finally {
      parser.dispose();
    }
  });
});

describe('loadConfigsInDirectory (production code path)', () => {
  function mockFs(files: Record<string, string>): FileSystemApi {
    return {
      readFile: async (filePath: string) => {
        if (filePath in files) return files[filePath];
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

  it('blocks the prototype-chain escape via parser.js hooks', async () => {
    const fs = mockFs({
      'test-dir/parser.js': `({
        onWillParseMarkdown: async function (md) { return ${RCE_EXPRESSION}; },
        onDidParseMarkdown: async function (html) { return ${RCE_EXPRESSION}; }
      })`,
    });
    const config = await loadConfigsInDirectory('test-dir', fs);
    const parserConfig = config.parserConfig as ParserConfig;
    expect(await parserConfig.onWillParseMarkdown('test')).toMatch(/^BLOCKED:/);
    expect(await parserConfig.onDidParseMarkdown('test')).toMatch(/^BLOCKED:/);
  });

  it('still allows normal parser hooks to function', async () => {
    const fs = mockFs({
      'test-dir/parser.js': `({
        onWillParseMarkdown: async function (md) { return md.replace(/foo/g, 'bar'); },
        onDidParseMarkdown: async function (html) { return html.replace(/foo/g, 'bar'); }
      })`,
    });
    const config = await loadConfigsInDirectory('test-dir', fs);
    const parserConfig = config.parserConfig as ParserConfig;
    expect(await parserConfig.onWillParseMarkdown('foo baz')).toBe('bar baz');
    expect(await parserConfig.onDidParseMarkdown('foo baz')).toBe('bar baz');
  });

  it('does not execute the config.js RCE payload', async () => {
    const fs = mockFs({
      'test-dir/config.js': `(() => {
        var F = this.constructor.constructor;
        F('return process')().getBuiltinModule('child_process').execSync('echo pwned');
        return { enableScriptExecution: true };
      })()`,
    });
    // The payload throws inside the sandbox; loadConfigsInDirectory swallows the
    // error and the malicious config is simply not applied.
    const config = await loadConfigsInDirectory('test-dir', fs);
    expect(config.enableScriptExecution).not.toBe(true);
  });

  it('strips security-sensitive keys a config.js tries to set', async () => {
    // Even without any escape attempt, an untrusted config.js must not be able
    // to grant itself trust or point executable paths at arbitrary binaries.
    const fs = mockFs({
      'test-dir/config.js': `({
        enableScriptExecution: true,
        pandocPath: '/tmp/evil',
        chromePath: '/tmp/evil-chrome',
        imageMagickPath: '/tmp/evil-magick',
        markdownYoBinaryPath: '/tmp/evil-yo',
        previewTheme: 'github-light.css'
      })`,
    });
    const config = await loadConfigsInDirectory('test-dir', fs);
    expect(config.enableScriptExecution).toBeUndefined();
    expect(config.pandocPath).toBeUndefined();
    expect(config.chromePath).toBeUndefined();
    expect(config.imageMagickPath).toBeUndefined();
    expect(config.markdownYoBinaryPath).toBeUndefined();
    // Non-sensitive keys are still honoured.
    expect(config.previewTheme).toBe('github-light.css');
  });
});
