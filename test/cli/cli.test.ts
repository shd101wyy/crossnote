import * as path from 'path';
import { parseServeArgs } from '../../src/cli';

describe('crossnote CLI argument parsing', () => {
  test('defaults to no directories (caller uses cwd)', () => {
    const parsed = parseServeArgs([]);
    expect(parsed).toEqual({ directories: [] });
  });

  test('resolves directories against the cwd', () => {
    const parsed = parseServeArgs(['notes', 'docs']);
    expect(parsed?.directories).toEqual([
      path.resolve(process.cwd(), 'notes'),
      path.resolve(process.cwd(), 'docs'),
    ]);
  });

  test('parses port, host and boolean flags', () => {
    const parsed = parseServeArgs([
      '--port',
      '8080',
      '--host',
      'localhost',
      '--vscode',
      '--json',
    ]);
    expect(parsed?.port).toBe(8080);
    expect(parsed?.host).toBe('localhost');
    expect(parsed?.vscode).toBe(true);
    expect(parsed?.json).toBe(true);
  });

  test('keeps --vscode-settings and --build-dir raw (resolved downstream)', () => {
    const parsed = parseServeArgs([
      '--vscode-settings',
      'settings.json',
      '--build-dir',
      'build',
    ]);
    expect(parsed?.vscodeSettingsPath).toBe('settings.json');
    expect(parsed?.buildDirectory).toBe('build');
  });

  test('rejects invalid ports and unknown options', () => {
    expect(parseServeArgs(['--port', 'not-a-number'])).toBeNull();
    expect(parseServeArgs(['--port', '70000'])).toBeNull();
    expect(parseServeArgs(['--port'])).toBeNull();
    expect(parseServeArgs(['--nonsense'])).toBeNull();
    expect(parseServeArgs(['--help'])).toBeNull();
  });
});
