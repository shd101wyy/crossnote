import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import JSON5 from 'json5';
import { NotebookConfig } from '../notebook';
import {
  loadConfigsInDirectory,
  wrapNodeFSAsApi,
} from '../notebook/config-helper';
import { evalConfigJS } from '../lib/js-sandbox';

const MPE_SETTINGS_PREFIX = 'markdown-preview-enhanced.';

/**
 * Detect the VS Code user settings.json. Order: explicit override, then the
 * Insiders build, then stable — matching where the extension reads its
 * settings from on each platform.
 */
export function detectVSCodeSettingsPath(explicitPath?: string): string | null {
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  const home = os.homedir();
  const candidates: string[] =
    process.platform === 'win32'
      ? [
          path.join(home, 'AppData/Roaming/Code - Insiders/User/settings.json'),
          path.join(home, 'AppData/Roaming/Code/User/settings.json'),
        ]
      : process.platform === 'darwin'
        ? [
            path.join(
              home,
              'Library/Application Support/Code - Insiders/User/settings.json',
            ),
            path.join(
              home,
              'Library/Application Support/Code/User/settings.json',
            ),
          ]
        : [
            path.join(home, '.config/Code - Insiders/User/settings.json'),
            path.join(home, '.config/Code/User/settings.json'),
          ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Read `markdown-preview-enhanced.*` keys from the VS Code user settings.
 * Returns null when no settings file exists (fresh machines) — callers treat
 * that as "no vscode layer".
 */
export async function loadVSCodeConfig(
  settingsPath: string | null,
): Promise<Partial<NotebookConfig> | null> {
  if (!settingsPath || !fs.existsSync(settingsPath)) {
    return null;
  }
  const raw = await fs.promises.readFile(settingsPath, 'utf-8');
  let settings: Record<string, unknown>;
  try {
    settings = JSON5.parse(raw) as Record<string, unknown>;
  } catch (error) {
    console.error(
      `crossnote serve: failed to parse VS Code settings at ${settingsPath}:`,
      error,
    );
    return null;
  }
  const config: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (key.startsWith(MPE_SETTINGS_PREFIX)) {
      config[key.slice(MPE_SETTINGS_PREFIX.length)] = value;
    }
  }
  return config as Partial<NotebookConfig>;
}

/**
 * Surgically update one `markdown-preview-enhanced.<key>` entry in the VS
 * Code user settings.json, preserving the rest of the file byte-for-byte —
 * including comments and unrelated keys (settings.json is JSONC).
 */
export async function updateVSCodeSetting(
  settingsPath: string,
  key: string,
  value: unknown,
): Promise<void> {
  let text = '{}';
  if (fs.existsSync(settingsPath)) {
    text = await fs.promises.readFile(settingsPath, 'utf-8');
  }
  try {
    JSON5.parse(text);
  } catch (error) {
    throw new Error(
      `refusing to edit unparseable settings.json (${settingsPath}): ${error}`,
      { cause: error },
    );
  }

  const serialized = JSON.stringify(value);
  // Replace the existing entry wherever it appears (top level only in
  // practice; nested scopes use the same quoted form but a global regex
  // replace keeps this simple — settings files never nest this key).
  const entryPattern = new RegExp(
    `("${MPE_SETTINGS_PREFIX}${key}"\\s*:\\s*)(?:"(?:[^"\\\\]|\\\\.)*"|-?\\d+(?:\\.\\d+)?|true|false|null)`,
  );
  if (entryPattern.test(text)) {
    // Function replacer: `serialized` may contain `$`-sequences that a
    // replacement string would otherwise interpret as group references.
    text = text.replace(
      entryPattern,
      (_match, prefix: string) => `${prefix}${serialized}`,
    );
  } else {
    const trimmed = text.replace(/\s+$/, '');
    const lastBrace = trimmed.lastIndexOf('}');
    if (lastBrace === -1) {
      text = `{\n  "${MPE_SETTINGS_PREFIX}${key}": ${serialized}\n}\n`;
    } else {
      const head = trimmed.slice(0, lastBrace).replace(/\s+$/, '');
      // Where the separator comma goes depends on what precedes the new
      // entry: appended after a trailing `//` comment it would land inside
      // the comment (commenting the comma out and leaving the new entry
      // without a separator), and after `{` or an existing `,` none is
      // wanted at all. Build the candidates and keep the first one the
      // lenient parser still accepts.
      const candidates = [',', '\n,', ''];
      const insertions = candidates.map(
        (separator) =>
          head +
          separator +
          `\n  "${MPE_SETTINGS_PREFIX}${key}": ${serialized}\n}\n`,
      );
      const valid = insertions.find((candidate) => {
        try {
          JSON5.parse(candidate);
          return true;
        } catch {
          return false;
        }
      });
      if (!valid) {
        throw new Error(
          `cannot insert "${MPE_SETTINGS_PREFIX}${key}" into ${settingsPath} while keeping it parseable`,
        );
      }
      text = valid;
    }
  }
  // Never leave the user's settings.json behind in a state the readers
  // (this file is JSONC, parsed leniently) cannot load.
  try {
    JSON5.parse(text);
  } catch (error) {
    throw new Error(
      `refusing to write settings.json that no longer parses (${settingsPath}): ${error}`,
      { cause: error },
    );
  }
  await fs.promises.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.promises.writeFile(settingsPath, text, 'utf-8');
}

/**
 * Merge one key into the global crossnote config.js (creating the directory
 * and file when missing). The file is rewritten as a pretty-printed object
 * expression, which is the format `loadConfigsInDirectory` evaluates.
 */
export async function updateGlobalConfigKey(
  globalConfigDirectory: string,
  key: string,
  value: unknown,
): Promise<void> {
  const configScriptPath = path.join(globalConfigDirectory, './config.js');
  let parsed: Record<string, unknown> = {};
  if (fs.existsSync(configScriptPath)) {
    const raw = await fs.promises.readFile(configScriptPath, 'utf-8');
    try {
      const evaluated = await evalConfigJS(raw);
      if (evaluated && typeof evaluated === 'object') {
        parsed = evaluated as Record<string, unknown>;
      }
    } catch (error) {
      console.error(
        'crossnote serve: existing global config.js failed to evaluate; rewriting it.',
        error,
      );
    }
  } else {
    await fs.promises.mkdir(globalConfigDirectory, { recursive: true });
  }
  parsed[key] = value;
  await fs.promises.writeFile(
    configScriptPath,
    `/* crossnote global config (managed by \`crossnote serve\`) */\n${JSON.stringify(
      parsed,
      null,
      2,
    )}\n`,
    'utf-8',
  );
  // Sanity-check: the file we just wrote must load.
  await loadConfigsInDirectory(
    globalConfigDirectory,
    wrapNodeFSAsApi(),
    false,
  ).catch((error: unknown) => {
    throw new Error(`rewritten config.js failed to load: ${error}`);
  });
}
