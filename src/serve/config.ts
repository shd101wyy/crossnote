import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { NotebookConfig } from '../notebook';
import {
  loadConfigsInDirectory,
  wrapNodeFSAsApi,
} from '../notebook/config-helper';

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
   * the global one, mirroring the extension's
   * `defaults ← vscode settings ← global ← workspace` order (vscode settings
   * are layered in by the caller once `--vscode` support kicks in).
   */
  rootDirectory: string;
  /** Override for tests; defaults to {@link getGlobalConfigDirectory}. */
  globalConfigDirectory?: string;
}

/**
 * Load the effective standalone config: global config dir merged under the
 * workspace `<root>/.crossnote` config. Sensitive keys stripped from
 * workspace evaluation by `loadConfigsInDirectory` can therefore only come
 * from the (user-owned) global directory.
 */
export async function loadServerConfig({
  rootDirectory,
  globalConfigDirectory = getGlobalConfigDirectory(),
}: ServerConfigOptions): Promise<Partial<NotebookConfig>> {
  let globalConfig: Partial<NotebookConfig> = {};
  try {
    globalConfig = await loadConfigsInDirectory(
      globalConfigDirectory,
      wrapNodeFSAsApi(),
      true,
    );
  } catch (error) {
    console.error('Failed to load global crossnote config:', error);
  }

  let workspaceConfig: Partial<NotebookConfig> = {};
  const workspaceConfigDirectory = path.join(rootDirectory, './.crossnote');
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

  return {
    ...globalConfig,
    ...workspaceConfig,
    globalCss:
      (globalConfig.globalCss ?? '') + (workspaceConfig.globalCss ?? ''),
  };
}
