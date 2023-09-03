import * as fs from 'fs';
import { KatexOptions } from 'katex';
import * as less from 'less';
import { MermaidConfig } from 'mermaid';
import * as path from 'path';
import { JsonObject } from 'type-fest';
import {
  FileSystemApi,
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
): Promise<{
  globalCss: string;
  mermaidConfig: MermaidConfig;
  mathjaxConfig: JsonObject;
  katexConfig: KatexOptions;
  parserConfig: ParserConfig;
}> {
  const defaultConfig = getDefaultNotebookConfig();
  const loadedConfig = {
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
    loadedConfig.mermaidConfig = await getMermaidConfig(
      directoryPath,
      fileSystem,
    );
    loadedConfig.mathjaxConfig = await getMathjaxConfig(
      directoryPath,
      fileSystem,
    );
    loadedConfig.katexConfig = await getKatexConfig(directoryPath, fileSystem);
    loadedConfig.parserConfig = await getParserConfig(
      directoryPath,
      fileSystem,
    );
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
    less.render(
      fileContent,
      { paths: [path.dirname(globalLessPath)] },
      (error, output) => {
        if (error) {
          return resolve(`html body:before {
  content: "Failed to compile \`style.less\`. ${error}" !important;
  padding: 2em !important;
}
.mume.mume { display: none !important; }`);
        } else {
          return resolve(output?.css || '');
        }
      },
    );
  });
}

export async function getMermaidConfig(
  configPath: string,
  fs: FileSystemApi,
): Promise<MermaidConfig> {
  const defaultMermaidConfig = getDefaultMermaidConfig();
  const mermaidConfigFilePath = path.join(configPath, './mermaid.json');
  if (await fs.exists(mermaidConfigFilePath)) {
    try {
      const mermaidConfig = JSON.parse(
        await fs.readFile(mermaidConfigFilePath),
      );
      return mermaidConfig;
    } catch (e) {
      return defaultMermaidConfig;
    }
  } else {
    await fs.writeFile(
      mermaidConfigFilePath,
      JSON.stringify(defaultMermaidConfig, null, 2),
    );
    return defaultMermaidConfig;
  }
}

export async function getMathjaxConfig(
  configPath: string,
  fs: FileSystemApi,
): Promise<JsonObject> {
  const defaultMathjaxConfig = getDefaultMathjaxConfig();
  const mathjaxConfigFilePath = path.join(configPath, './mathjax_v3.json');
  if (await fs.exists(mathjaxConfigFilePath)) {
    try {
      const mathjaxConfig = JSON.parse(
        await fs.readFile(mathjaxConfigFilePath),
      );
      return mathjaxConfig;
    } catch (e) {
      return defaultMathjaxConfig;
    }
  } else {
    await fs.writeFile(
      mathjaxConfigFilePath,
      JSON.stringify(defaultMathjaxConfig, null, 2),
    );
    return defaultMathjaxConfig;
  }
}

export async function getKatexConfig(
  configPath: string,
  fs: FileSystemApi,
): Promise<KatexOptions> {
  const defaultKatexConfig = getDefaultKatexConfig();
  const katexConfigFilePath = path.join(configPath, './katex.json');
  if (await fs.exists(katexConfigFilePath)) {
    try {
      const katexConfig = JSON.parse(await fs.readFile(katexConfigFilePath));
      return katexConfig;
    } catch (e) {
      return defaultKatexConfig;
    }
  } else {
    await fs.writeFile(
      katexConfigFilePath,
      JSON.stringify(defaultKatexConfig, null, 2),
    );
    return defaultKatexConfig;
  }
}

export async function getParserConfig(
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
}`,
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
