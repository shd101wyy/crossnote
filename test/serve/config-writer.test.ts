import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import JSON5 from 'json5';
import { updateVSCodeSetting } from '../../src/serve/config-writer';

const track = (): string[] => {
  const dirs: string[] = [];
  (globalThis as { __crossnoteTestDirs?: string[] }).__crossnoteTestDirs = dirs;
  return dirs;
};

const mkdirSync = (name: string): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
  (globalThis as { __crossnoteTestDirs?: string[] }).__crossnoteTestDirs?.push(
    dir,
  );
  return dir;
};

afterAll(() => {
  for (const dir of (globalThis as { __crossnoteTestDirs?: string[] })
    .__crossnoteTestDirs ?? []) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function settingsFile(lines: string[]): { path: string; read: () => string } {
  track();
  const dir = mkdirSync('crossnote-config-writer');
  const file = path.join(dir, 'settings.json');
  fs.writeFileSync(file, lines.join('\n'), 'utf-8');
  return { path: file, read: () => fs.readFileSync(file, 'utf-8') };
}

/** The written file must always stay loadable by the lenient reader. */
async function writeAndParse(
  file: { path: string; read: () => string },
  key: string,
  value: unknown,
): Promise<Record<string, unknown>> {
  await updateVSCodeSetting(file.path, key, value);
  const text = file.read();
  try {
    return JSON5.parse(text) as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      `written settings.json no longer parses: ${error}\n${text.slice(-200)}`,
      { cause: error },
    );
  }
}

describe('updateVSCodeSetting', () => {
  test('appending after a trailing // comment keeps the file parseable', async () => {
    // A real user's settings.json: the last entry before the closing brace
    // is a commented-out setting. Appending the separator comma directly
    // would land inside the comment (commenting the comma out), leaving the
    // new entry without a separator — the whole vscode config layer then
    // silently disappears on the next load.
    const file = settingsFile([
      '{',
      '  "editor.fontSize": 16,',
      '  "remote.SSH.remotePlatform": {',
      '    "home": "macOS"',
      '  }',
      '  // "rvAudits.backendUrl": "http://127.0.0.1:5000/api",',
      '}',
    ]);

    const parsed = await writeAndParse(file, 'enablePreviewZenMode', false);
    expect(parsed['markdown-preview-enhanced.enablePreviewZenMode']).toBe(
      false,
    );
    // Surgical: the comment and unrelated keys survive byte-for-byte.
    const text = file.read();
    expect(text).toContain(
      '// "rvAudits.backendUrl": "http://127.0.0.1:5000/api",',
    );
    expect(text).toContain('"editor.fontSize": 16,');
    expect(text).toContain('"home": "macOS"');
  });

  test('appending into an empty object adds no stray comma', async () => {
    const file = settingsFile(['{', '}']);
    const parsed = await writeAndParse(file, 'previewTheme', 'one-dark.css');
    expect(parsed['markdown-preview-enhanced.previewTheme']).toBe(
      'one-dark.css',
    );
  });

  test('appending after a trailing comma does not double it', async () => {
    const file = settingsFile(['{', '  "editor.fontSize": 16,', '}']);
    const parsed = await writeAndParse(file, 'enablePreviewZenMode', true);
    expect(parsed['markdown-preview-enhanced.enablePreviewZenMode']).toBe(true);
    expect(parsed['editor.fontSize']).toBe(16);
  });

  test('appending after a block comment keeps the file parseable', async () => {
    const file = settingsFile([
      '{',
      '  "editor.fontSize": 16 /* locked */',
      '}',
    ]);
    const parsed = await writeAndParse(file, 'enablePreviewZenMode', false);
    expect(parsed['markdown-preview-enhanced.enablePreviewZenMode']).toBe(
      false,
    );
    expect(file.read()).toContain('/* locked */');
  });

  test('replacing an existing entry swaps only the value (booleans too)', async () => {
    const file = settingsFile([
      '{',
      '  // my settings',
      '  "markdown-preview-enhanced.previewTheme": "github-dark.css",',
      '  "markdown-preview-enhanced.enablePreviewZenMode": true,',
      '}',
    ]);
    const parsed = await writeAndParse(file, 'enablePreviewZenMode', false);
    expect(parsed['markdown-preview-enhanced.enablePreviewZenMode']).toBe(
      false,
    );
    expect(parsed['markdown-preview-enhanced.previewTheme']).toBe(
      'github-dark.css',
    );
    const text = file.read();
    expect(text).toContain('// my settings');
    expect(text).toContain(
      '"markdown-preview-enhanced.enablePreviewZenMode": false',
    );
  });

  test('refuses to edit an unparseable file and leaves it untouched', async () => {
    const broken =
      '{\n  "editor.fontSize": 16\n  // no comma below\n  "a": 1 "b": 2\n}\n';
    const file = settingsFile([broken]);
    await expect(
      updateVSCodeSetting(file.path, 'enablePreviewZenMode', false),
    ).rejects.toThrow(/unparseable settings\.json/);
    expect(file.read()).toBe(broken);
  });
});
