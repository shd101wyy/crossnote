/**
 * Convert Crossnote markdown to Githb Flavored Markdown
 */
import * as fs from 'fs';
import { escape } from 'html-escaper';
import { mkdirp } from 'mkdirp';
import * as path from 'path';
import { CodeChunkData } from '../code-chunk/code-chunk-data';
import computeChecksum from '../lib/compute-checksum';
import { toc } from '../markdown-engine/toc';
import { transformMarkdown } from '../markdown-engine/transformer';
import { Notebook } from '../notebook';
import { processGraphs } from './process-graphs';

/**
 * Convert all math expressions inside markdown to images.
 * @param text input markdown text
 * @param config
 */
function processMath(
  text: string,
  { mathInlineDelimiters, mathBlockDelimiters, mathRenderingOnlineService },
): string {
  let line = text.replace(/\\\$/g, '#slash_dollarsign#');

  const inline = mathInlineDelimiters;
  const block = mathBlockDelimiters;

  const inlineBegin =
    '(?:' +
    inline
      .map((x) => x[0])
      .join('|')
      .replace(/\\/g, '\\\\')
      .replace(/([()[\]$])/g, '\\$1') +
    ')';
  const inlineEnd =
    '(?:' +
    inline
      .map((x) => x[1])
      .join('|')
      .replace(/\\/g, '\\\\')
      .replace(/([()[\]$])/g, '\\$1') +
    ')';
  const blockBegin =
    '(?:' +
    block
      .map((x) => x[0])
      .join('|')
      .replace(/\\/g, '\\\\')
      .replace(/([()[\]$])/g, '\\$1') +
    ')';
  const blockEnd =
    '(?:' +
    block
      .map((x) => x[1])
      .join('|')
      .replace(/\\/g, '\\\\')
      .replace(/([()[\]$])/g, '\\$1') +
    ')';

  // display
  line = line.replace(
    new RegExp(
      `(\`\`\`(?:[\\s\\S]+?)\`\`\`\\s*(?:\\n|$))|(?:${blockBegin}([\\s\\S]+?)${blockEnd})`,
      'g',
    ),
    ($0, $1, $2) => {
      if ($1) {
        return $1;
      }
      let math = $2;
      math = math.replace(/\n/g, '').replace(/#slash_dollarsign#/g, '\\$');
      math = escape(math);
      return `<p align="center"><img src="${mathRenderingOnlineService}?${math
        .trim()
        .replace(/ /g, '%20')}"/></p>  \n`;
    },
  );

  // inline
  line = line.replace(
    new RegExp(
      `(\`\`\`(?:[\\s\\S]+?)\`\`\`\\s*(?:\\n|$))|(?:${inlineBegin}([\\s\\S]+?)${inlineEnd})`,
      'g',
    ),
    ($0, $1, $2) => {
      if ($1) {
        return $1;
      }
      let math = $2;
      math = math.replace(/\n/g, '').replace(/#slash_dollarsign#/g, '\\$');
      math = escape(math);
      return `<img src="${mathRenderingOnlineService}?${math
        .trim()
        .replace(/ /g, '%20')}"/>`;
    },
  );

  line = line.replace(/#slash_dollarsign#/g, '\\$');
  return line;
}

/**
 * Format paths
 * @param text
 * @param fileDirectoryPath
 * @param projectDirectoryPath
 * @param useRelativeFilePath
 * @param protocolsWhiteListRegExp
 */
function processPaths(
  text,
  fileDirectoryPath,
  projectDirectoryPath,
  useRelativeFilePath,
  protocolsWhiteListRegExp: RegExp,
) {
  function resolvePath(src) {
    if (src.match(protocolsWhiteListRegExp)) {
      // do nothing
    } else if (useRelativeFilePath) {
      if (src.startsWith('/')) {
        src = path.relative(
          fileDirectoryPath,
          path.resolve(projectDirectoryPath, '.' + src),
        );
      }
    } else {
      if (!src.startsWith('/')) {
        // ./test.png or test.png
        src =
          '/' +
          path.relative(
            projectDirectoryPath,
            path.resolve(fileDirectoryPath, src),
          );
      }
    }
    return src.replace(/\\/g, '/'); // https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/17
  }

  let inBlock = false;
  let lines = text.split('\n');
  lines = lines.map((line) => {
    if (line.match(/^\s*```/)) {
      inBlock = !inBlock;
      return line;
    } else if (inBlock) {
      return line;
    } else {
      // replace path in ![](...) and []()
      let r = /(!?\[.*?]\()([^)|^'|^"]*)(.*?\))/gi;
      line = line.replace(r, (whole, a, b, c) => {
        if (b[0] === '<') {
          b = b.slice(1, b.length - 1);
          return a + '<' + resolvePath(b.trim()) + '> ' + c;
        } else {
          return a + resolvePath(b.trim()) + ' ' + c;
        }
      });

      // replace path in tag
      r = /(<[img|a|iframe].*?[src|href]=['"])(.+?)(['"].*?>)/gi;
      line = line.replace(r, (whole, a, b, c) => {
        return a + resolvePath(b) + c;
      });
      return line;
    }
  });

  return lines.join('\n');
}

export async function markdownConvert(
  text,
  {
    projectDirectoryPath,
    fileDirectoryPath,
    protocolsWhiteListRegExp,
    filesCache,
    codeChunksData,
    graphsCache,
    notebook,
  }: {
    projectDirectoryPath: string;
    fileDirectoryPath: string;
    protocolsWhiteListRegExp: RegExp;
    filesCache: { [key: string]: string };
    codeChunksData: { [key: string]: CodeChunkData };
    graphsCache: { [key: string]: string };
    notebook: Notebook;
  },
  config: object,
): Promise<string> {
  if (!config['path']) {
    throw new Error('{path} has to be specified');
  }

  if (!config['image_dir']) {
    throw new Error('{image_dir} has to be specified');
  }

  // dest
  let outputFilePath;
  if (config['path'][0] === '/') {
    outputFilePath = path.resolve(projectDirectoryPath, '.' + config['path']);
  } else {
    outputFilePath = path.resolve(fileDirectoryPath, config['path']);
  }

  for (const key in filesCache) {
    if (key.endsWith('.pdf')) {
      delete filesCache[key];
    }
  }

  let imageDirectoryPath: string;
  if (config['image_dir'][0] === '/') {
    imageDirectoryPath = path.resolve(
      projectDirectoryPath,
      '.' + config['image_dir'],
    );
  } else {
    imageDirectoryPath = path.resolve(fileDirectoryPath, config['image_dir']);
  }

  const useRelativeFilePath = !config['absolute_image_path'];

  if (notebook.config.parserConfig.onWillParseMarkdown) {
    text = await notebook.config.parserConfig.onWillParseMarkdown(text);
  }

  // import external files
  const data = await transformMarkdown(text, {
    fileDirectoryPath,
    projectDirectoryPath,
    useRelativeFilePath,
    filesCache,
    forPreview: false,
    usePandocParser: true, // NOTE: We need to set this to true here even though we don't use pandoc to parse the markdown.
    forMarkdownExport: true,
    protocolsWhiteListRegExp,
    imageDirectoryPath,
    notebook,
  });

  text = data.outputString;

  // replace [CROSSNOTETOC]
  const tocBracketEnabled = data.tocBracketEnabled;
  if (tocBracketEnabled) {
    // [TOC]
    const headings = data.headings;
    const { content: tocMarkdown } = toc(headings, {
      ordered: false,
      depthFrom: 1,
      depthTo: 6,
      tab: '  ',
    });
    text = text.replace(
      /^\s*(?:<p[^>]*>)?<span>\[CROSSNOTETOC\]<\/span>(?:<\/p>)?\s*/gm,
      '\n\n' + tocMarkdown + '\n\n',
    );
  }

  // change link path to project '/' path
  // this is actually different from pandoc-convert.coffee
  text = processPaths(
    text,
    fileDirectoryPath,
    projectDirectoryPath,
    useRelativeFilePath,
    protocolsWhiteListRegExp,
  );

  text =
    notebook.config.mathRenderingOption !== 'None'
      ? processMath(text, {
          mathInlineDelimiters: notebook.config.mathInlineDelimiters,
          mathBlockDelimiters: notebook.config.mathBlockDelimiters,
          mathRenderingOnlineService:
            notebook.config.mathRenderingOnlineService,
        })
      : text;

  return await new Promise<string>((resolve, reject) => {
    mkdirp(imageDirectoryPath)
      .then(() => {
        processGraphs(text, {
          fileDirectoryPath,
          projectDirectoryPath,
          imageDirectoryPath,
          imageFilePrefix: computeChecksum(outputFilePath),
          useRelativeFilePath,
          codeChunksData,
          graphsCache,
          addOptionsStr: false,
          notebook,
        }).then(({ outputString }) => {
          outputString = data.frontMatterString + outputString; // put the front-matter back.

          fs.writeFile(
            outputFilePath,
            outputString,
            { encoding: 'utf-8' },
            (error2) => {
              if (error2) {
                return reject(error2.toString());
              }
              return resolve(outputFilePath);
            },
          );
        });
      })
      .catch((error) => {
        if (error) {
          return reject(error.toString());
        }
      });
  });
}
