import * as fs from 'fs';
import * as less from 'less';
import * as path from 'path';
import { interpretJS } from '../utility';
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
  } catch (e) {
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
    const generateErrorMessage = (error) => {
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
  } catch (e) {
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
      // HACK: Dyamic import here doesn't work for the VSCode packaged extension.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      /*
      const result = isVSCodeWebExtension()
        ? await import(configScriptPath + `?version=${Date.now()}`)
        : (() => {
            delete require.cache[require.resolve(configScriptPath)];
            return require(configScriptPath);
          })();
      */
      // NOTE: Never mind, the above code doesn't work in VSCode Web extension

      const script = await fs.readFile(configScriptPath);
      const result = interpretJS(script);
      if (Object.keys(result ?? {}).length === 0) {
        return await setupDefaultConfigScript();
      }
      return result;
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
      // HACK: Dyamic import here doesn't work for the VSCode packaged extension.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      /*
      const result = isVSCodeWebExtension()
        ? await import(parserConfigPath)
        : (() => {
            delete require.cache[require.resolve(parserConfigPath)];
            return require(parserConfigPath);
          })();
      */
      // NOTE: Never mind, the above code doesn't work in VSCode Web extension
      const script = await fs.readFile(parserConfigPath);
      const result = interpretJS(script);
      return {
        ...defaultParserConfig,
        ...(result ?? {}),
      };
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
