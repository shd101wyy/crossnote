import * as fs from 'fs';
import * as less from 'less';
import * as path from 'path';
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
  let loadedConfig = {
    globalCss: defaultConfig.globalCss,
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

  return await new Promise<string>(resolve => {
    const generateErrorMessage = error => {
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

async function getConfigs(
  configPath: string,
  fs: FileSystemApi,
): Promise<Partial<NotebookConfig>> {
  const configScriptPath = path.join(configPath, './config.mjs');
  const setupDefaultConfigScript = async () => {
    const defaultKatexConfig = getDefaultKatexConfig();
    const defaultMathjaxConfig = getDefaultMathjaxConfig();
    const defaultMermaidConfig = getDefaultMermaidConfig();
    await fs.writeFile(
      configScriptPath,
      `export const katexConfig = ${JSON.stringify(
        defaultKatexConfig,
        null,
        2,
      )};

export const mathjaxConfig = ${JSON.stringify(defaultMathjaxConfig, null, 2)};

export const mermaidConfig = ${JSON.stringify(defaultMermaidConfig, null, 2)};
`,
    );
    return {
      katexConfig: defaultKatexConfig,
      mathjaxConfig: defaultMathjaxConfig,
      mermaidConfig: defaultMermaidConfig,
    };
  };

  if (await fs.exists(configScriptPath)) {
    try {
      const result = await import(
        configScriptPath + `?version=${Number(new Date())}`
      );
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
  const parserConfigPath = path.join(configPath, './parser.mjs');
  if (await fs.exists(parserConfigPath)) {
    try {
      const result = await import(
        parserConfigPath + `?version=${Number(new Date())}`
      );
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
      `
export async function onWillParseMarkdown(markdown) {
  return markdown;
}
      
export async function onDidParseMarkdown(html, {cheerio}) {
  return html;
}

export async function onWillTransformMarkdown(markdown) {
  return markdown;
}

export async function onDidTransformMarkdown(markdown) {
  return markdown;
}

export function processWikiLink({text, link}) {
  return { 
    text,  
    link: link ? link : text.endsWith('.md') ? text : \`\${text}.md\`,
  };
}

`,
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
