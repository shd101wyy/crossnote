import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { NotebookConfig } from '../notebook';
import {
  loadConfigsInDirectory,
  wrapNodeFSAsApi,
} from '../notebook/config-helper';
import {
  detectVSCodeSettingsPath,
  loadVSCodeConfig,
  updateGlobalConfigKey,
  updateVSCodeSetting,
} from './config-writer';

/**
 * Resolve the global crossnote config directory the same way the
 * vscode-markdown-preview-enhanced extension does (`getGlobalConfigPath` in
 * its `src/utils.ts`): Windows keeps `~/.crossnote`, other platforms prefer
 * `$XDG_CONFIG_HOME/crossnote` and finally fall back to
 * `~/.local/state/crossnote`.
 */
export function getGlobalConfigDirectory(): string {
  if (process.platform === 'win32') {
    return path.join(os.homedir(), './.crossnote');
  }
  if (
    typeof process.env.XDG_CONFIG_HOME === 'string' &&
    process.env.XDG_CONFIG_HOME !== ''
  ) {
    return path.resolve(process.env.XDG_CONFIG_HOME, './crossnote');
  }
  return path.resolve(os.homedir(), './.local/state/crossnote');
}

export interface ServerConfigOptions {
  /**
   * The directory being served. Its `.crossnote/` config is merged on top of
   * the global one, mirroring the extension's merge order.
   */
  rootDirectory: string;
  /** Load `markdown-preview-enhanced.*` from VS Code user settings. */
  vscode?: boolean;
  /** Explicit path to the VS Code user settings.json. */
  vscodeSettingsPath?: string;
  /** Override for tests; defaults to {@link getGlobalConfigDirectory}. */
  globalConfigDirectory?: string;
}

export interface ServerConfigContext {
  rootDirectory: string;
  vscode: boolean;
  globalConfigDirectory: string;
  vscodeSettingsPath: string | null;
}

export async function createConfigContext(
  options: ServerConfigOptions,
): Promise<ServerConfigContext> {
  const globalConfigDirectory =
    options.globalConfigDirectory ?? getGlobalConfigDirectory();
  return {
    rootDirectory: path.resolve(options.rootDirectory),
    vscode: !!options.vscode,
    globalConfigDirectory,
    vscodeSettingsPath: options.vscode
      ? detectVSCodeSettingsPath(options.vscodeSettingsPath)
      : null,
  };
}

/**
 * Load the effective config, mirroring the extension's
 * `loadNotebookConfig` merge:
 *
 *     defaults ← vscode settings ← global ← workspace
 *
 * with `globalCss` concatenated and, in vscode mode, `previewTheme` always
 * taken from VS Code settings (the extension resolves light/dark variants
 * there before the merge). Sensitive keys stripped from workspace config.js
 * evaluation by the sandbox can therefore only come from the user-owned
 * layers.
 */
export async function loadServerConfig(
  context: ServerConfigContext,
): Promise<Partial<NotebookConfig>> {
  let vscodeConfig: Partial<NotebookConfig> | null = null;
  if (context.vscode) {
    vscodeConfig = await loadVSCodeConfig(context.vscodeSettingsPath);
  }

  let globalConfig: Partial<NotebookConfig> = {};
  try {
    globalConfig = await loadConfigsInDirectory(
      context.globalConfigDirectory,
      wrapNodeFSAsApi(),
      true,
    );
  } catch (error) {
    console.error('Failed to load global crossnote config:', error);
  }

  let workspaceConfig: Partial<NotebookConfig> = {};
  const workspaceConfigDirectory = path.join(
    context.rootDirectory,
    './.crossnote',
  );
  try {
    if (fs.existsSync(workspaceConfigDirectory)) {
      workspaceConfig = await loadConfigsInDirectory(
        workspaceConfigDirectory,
        wrapNodeFSAsApi(),
        false,
      );
    }
  } catch (error) {
    console.error('Failed to load workspace config:', error);
  }

  const merged: Partial<NotebookConfig> = {
    ...(vscodeConfig ?? {}),
    ...globalConfig,
    ...workspaceConfig,
    globalCss:
      (globalConfig.globalCss ?? '') + (workspaceConfig.globalCss ?? ''),
  };
  if (vscodeConfig?.previewTheme) {
    merged.previewTheme = vscodeConfig.previewTheme;
  }
  return merged;
}

/**
 * Persist one config key change to the appropriate place —
 *
 * - vscode mode → the VS Code user `settings.json` (surgical, comment
 *   preserving), because that layer owns `previewTheme` there;
 * - standalone → the global crossnote `config.js`;
 *
 * then reload and return the freshly merged config.
 */
export async function updateServerConfigKey(
  context: ServerConfigContext,
  key: string,
  value: unknown,
): Promise<Partial<NotebookConfig>> {
  if (context.vscode && context.vscodeSettingsPath) {
    await updateVSCodeSetting(context.vscodeSettingsPath, key, value);
  } else {
    await updateGlobalConfigKey(context.globalConfigDirectory, key, value);
  }
  return loadServerConfig(context);
}
