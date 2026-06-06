import * as fs from 'fs';
import * as less from 'less';
import * as path from 'path';
import { createSandboxedParserConfig, evalConfigJS } from '../lib/js-sandbox';
import {
  FileSystemApi,
  NotebookConfig,
  ParserConfig,
  getDefaultKatexConfig,
  getDefaultMathjaxConfig,
  getDefaultMermaidConfig,
  getDefaultNotebookConfig,
  getDefaultParserConfig,
} from './types';

/**
 * Config keys that a workspace-provided `.crossnote/config.js` must NOT be able
 * to set, because they control code execution or which executables are spawned.
 * Letting an untrusted repository set these would let it grant itself trust
 * (`enableScriptExecution`) or point an executable path at an arbitrary binary,
 * re-introducing the very RCE that sandboxing `config.js` is meant to close.
 * These settings are only honoured when they come from trusted VS Code
 * settings, not from the workspace file.
 */
const SECURITY_SENSITIVE_CONFIG_KEYS: readonly (keyof NotebookConfig)[] = [
  'enableScriptExecution',
  'chromePath',
  'pandocPath',
  'imageMagickPath',
  'markdownYoBinaryPath',
];

/**
 * Remove security-sensitive keys from the result of an untrusted
 * `.crossnote/config.js` and warn if any were present.
 */
function stripSensitiveConfigKeys(
  config: Partial<NotebookConfig>,
): Partial<NotebookConfig> {
  const sanitized = { ...config };
  for (const key of SECURITY_SENSITIVE_CONFIG_KEYS) {
    if (key in sanitized) {
      delete sanitized[key];
      console.warn(
        `crossnote: ignoring "${key}" set in .crossnote/config.js — this ` +
          `setting can only be configured via trusted editor settings.`,
      );
    }
  }
  return sanitized;
}

/**
 * Load the configs from the given directory path.
 * If the directory does not exist and `createDirectoryIfNotExists` is `true`, create it and return the default configs.
 */
export async function loadConfigsInDirectory(
  directoryPath: string,
  fileSystem: FileSystemApi,
  createDirectoryIfNotExists: boolean = false,
): Promise<Partial<NotebookConfig>> {
  const defaultConfig = getDefaultNotebookConfig();
  let loadedConfig: Partial<NotebookConfig> = {
    globalCss: defaultConfig.globalCss,
    includeInHeader: defaultConfig.includeInHeader,
    mermaidConfig: defaultConfig.mermaidConfig,
    mathjaxConfig: defaultConfig.mathjaxConfig,
    katexConfig: defaultConfig.katexConfig,
    parserConfig: defaultConfig.parserConfig,
  };

  if (createDirectoryIfNotExists) {
    await fileSystem.mkdir(directoryPath);
  }

  if (await fileSystem.exists(directoryPath)) {
    loadedConfig.globalCss = await getGlobalStyles(directoryPath, fileSystem);
    loadedConfig.parserConfig = await getParserConfig(
      directoryPath,
      fileSystem,
    );
    loadedConfig.includeInHeader = await getHeaderIncludes(
      directoryPath,
      fileSystem,
    );
    loadedConfig = {
      ...loadedConfig,
      ...(await getConfigs(directoryPath, fileSystem)),
    };
  }
  return loadedConfig;
}

async function getGlobalStyles(configPath: string, fs: FileSystemApi) {
  const globalLessPath = path.join(configPath, './style.less');

  let fileContent: string;
  try {
    fileContent = await fs.readFile(globalLessPath);
  } catch {
    // create style.less file
    fileContent = `
/* Please visit the URL below for more information: */
/*   https://shd101wyy.github.io/markdown-preview-enhanced/#/customize-css */

.markdown-preview.markdown-preview {
  // modify your style here
  // eg: background-color: blue;
}
`;
    await fs.writeFile(globalLessPath, fileContent);
  }

  return await new Promise<string>((resolve) => {
    const generateErrorMessage = (error: unknown) => {
      return `html body:before {
        content: "Failed to compile \`style.less\`. ${error}" !important;
        padding: 2em !important;
      }
      .crossnote.crossnote { display: none !important; }`;
    };

    less.render(
      fileContent,
      { paths: [path.dirname(globalLessPath)] },
      (error, output) => {
        if (error) {
          return resolve(generateErrorMessage(error));
        } else {
          return resolve(output?.css || '');
        }
      },
    );
  });
}

async function getHeaderIncludes(configPath: string, fs: FileSystemApi) {
  const headerIncludesPath = path.join(configPath, './head.html');
  let fileContent: string;
  try {
    fileContent = await fs.readFile(headerIncludesPath);
  } catch {
    // create head.html file
    fileContent = `<!-- The content below will be included at the end of the <head> element. -->
<script type="text/javascript">
  document.addEventListener("DOMContentLoaded", function () {
    // your code here
  });
</script>`;
    await fs.writeFile(headerIncludesPath, fileContent);
  }
  return fileContent;
}

async function getConfigs(
  configPath: string,
  fs: FileSystemApi,
): Promise<Partial<NotebookConfig>> {
  const configScriptPath = path.join(configPath, './config.js');
  const setupDefaultConfigScript = async () => {
    const defaultKatexConfig = getDefaultKatexConfig();
    const defaultMathjaxConfig = getDefaultMathjaxConfig();
    const defaultMermaidConfig = getDefaultMermaidConfig();
    await fs.writeFile(
      configScriptPath,
      `({
  katexConfig: ${JSON.stringify(defaultKatexConfig, null, 2)},
  
  mathjaxConfig: ${JSON.stringify(defaultMathjaxConfig, null, 2)},
  
  mermaidConfig: ${JSON.stringify(defaultMermaidConfig, null, 2)},
})`,
    );
    return {
      katexConfig: defaultKatexConfig,
      mathjaxConfig: defaultMathjaxConfig,
      mermaidConfig: defaultMermaidConfig,
    };
  };

  if (await fs.exists(configScriptPath)) {
    try {
      // `config.js` is untrusted code from the workspace. Evaluate it inside the
      // QuickJS WASM sandbox (see ../lib/js-sandbox) so it cannot reach the host
      // realm. Only plain data crosses back out.
      const script = await fs.readFile(configScriptPath);
      const result = (await evalConfigJS(script)) as
        | Partial<NotebookConfig>
        | undefined;
      if (Object.keys(result ?? {}).length === 0) {
        return await setupDefaultConfigScript();
      }
      return stripSensitiveConfigKeys(result ?? {});
    } catch (e) {
      console.error(e);
      return {};
    }
  } else {
    return setupDefaultConfigScript();
  }
}

async function getParserConfig(
  configPath: string,
  fs: FileSystemApi,
): Promise<ParserConfig> {
  const defaultParserConfig = getDefaultParserConfig();
  const parserConfigPath = path.join(configPath, './parser.js');
  if (await fs.exists(parserConfigPath)) {
    try {
      // `parser.js` is untrusted code from the workspace. Its hooks run inside
      // the QuickJS WASM sandbox (see ../lib/js-sandbox); only strings cross the
      // boundary, so the hooks cannot reach the host realm / Node APIs.
      const script = await fs.readFile(parserConfigPath);
      return await createSandboxedParserConfig(script, defaultParserConfig);
    } catch (e) {
      console.error(e);
      return defaultParserConfig;
    }
  } else {
    await fs.writeFile(
      parserConfigPath,
      `({
  // Please visit the URL below for more information:
  // https://shd101wyy.github.io/markdown-preview-enhanced/#/extend-parser

  onWillParseMarkdown: async function(markdown) {
    return markdown;
  },

  onDidParseMarkdown: async function(html) {
    return html;
  },
})`,
    );
    return defaultParserConfig;
  }
}

export function wrapNodeFSAsApi(): FileSystemApi {
  const fsPromises = fs.promises;
  return {
    readFile: async (_path: string, encoding: BufferEncoding = 'utf-8') => {
      return (await fsPromises.readFile(_path, encoding)).toString();
    },
    writeFile: async (
      _path: string,
      content: string,
      encoding: BufferEncoding = 'utf8',
    ) => {
      return await fsPromises.writeFile(_path, content, encoding);
    },
    mkdir: async (_path: string) => {
      await fsPromises.mkdir(_path, { recursive: true });
    },
    exists: async (_path: string) => {
      return fs.existsSync(_path);
    },
    stat: async (_path: string) => {
      return await fsPromises.stat(_path);
    },
    readdir: async (_path: string) => {
      return await fsPromises.readdir(_path);
    },
    unlink: async (_path: string) => {
      return await fsPromises.unlink(_path);
    },
  };
}
