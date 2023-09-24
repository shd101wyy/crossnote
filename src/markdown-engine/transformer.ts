import * as fs from 'fs/promises';
import { escape } from 'html-escaper';
import * as less from 'less';
import * as Papa from 'papaparse';
import * as path from 'path';
import request from 'request';
import * as temp from 'temp';
import {
  BlockAttributes,
  parseBlockAttributes,
  stringifyBlockAttributes,
} from '../lib/block-attributes';
import computeChecksum from '../lib/compute-checksum';
import { Notebook } from '../notebook';
import * as PDF from '../tools/pdf';
import { CustomSubjects } from './custom-subjects';
import HeadingIdGenerator from './heading-id-generator';
import { HeadingData } from './toc';

export interface TransformMarkdownOutput {
  outputString: string;
  /**
   * An array of slide configs.
   */
  slideConfigs: object[];
  /**
   * whehter we found [TOC] in markdown file or not.
   */
  tocBracketEnabled: boolean;

  /**
   * imported javascript and css files
   * convert .js file to <script src='...'></script>
   * convert .css file to <link href='...'></link>
   */
  JSAndCssFiles: string[];

  headings: HeadingData[];

  /**
   * Get `---\n...\n---\n` string.
   */
  frontMatterString: string;
}

export interface TransformMarkdownOptions {
  fileDirectoryPath: string;
  projectDirectoryPath: string;
  filesCache: { [key: string]: string };
  useRelativeFilePath: boolean;
  forPreview: boolean;
  forMarkdownExport?: boolean;
  protocolsWhiteListRegExp: RegExp | null;
  notSourceFile?: boolean;
  imageDirectoryPath?: string;
  headingIdGenerator?: HeadingIdGenerator;
  notebook: Notebook;
}

const fileExtensionToLanguageMap = {
  vhd: 'vhdl',
  erl: 'erlang',
  dot: 'dot',
  gv: 'dot',
  viz: 'dot',
};

const selfClosingTag = {
  area: 1,
  base: 1,
  br: 1,
  col: 1,
  command: 1,
  embed: 1,
  hr: 1,
  img: 1,
  input: 1,
  keygen: 1,
  link: 1,
  meta: 1,
  param: 1,
  source: 1,
  track: 1,
  wbr: 1,
};

/**
 * Convert 2D array to markdown table.
 * The first row is headings.
 */
function twoDArrayToMarkdownTable(twoDArr) {
  let output = '  \n';
  twoDArr.forEach((arr, offset) => {
    let i = 0;
    output += '|';
    while (i < arr.length) {
      output += arr[i] + '|';
      i += 1;
    }
    output += '  \n';
    if (offset === 0) {
      output += '|';
      i = 0;
      while (i < arr.length) {
        output += '---|';
        i += 1;
      }
      output += '  \n';
    }
  });

  output += '  ';
  return output;
}

function createAnchor(lineNo) {
  return `\n\n<p data-line="${lineNo}" class="sync-line" style="margin:0;"></p>\n\n`;
}

let DOWNLOADS_TEMP_FOLDER: string | null = null;
/**
 * download file and return its local path
 */
function downloadFileIfNecessary(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!filePath.match(/^https?:\/\//)) {
      return resolve(filePath);
    }

    if (!DOWNLOADS_TEMP_FOLDER) {
      DOWNLOADS_TEMP_FOLDER = temp.mkdirSync('crossnote_downloads');
    }
    request.get(
      { url: filePath, encoding: 'binary' },
      async (error, response, body) => {
        if (error) {
          return reject(error);
        } else {
          const localFilePath =
            path.resolve(
              DOWNLOADS_TEMP_FOLDER ?? '/tmp/crossnote_downloads',
              computeChecksum(filePath),
            ) + path.extname(filePath);
          await fs.writeFile(localFilePath, body, 'binary');
          return localFilePath;
        }
      },
    );
  });
}

/**
 *
 * Load file by `filePath`
 * @param filePath
 * @param param1
 * @param filesCache
 */
async function loadFile(
  filePath: string,
  {
    fileDirectoryPath,
    imageDirectoryPath,
    notebook,
  }: {
    fileDirectoryPath: string;
    imageDirectoryPath: string;
    notebook: Notebook;
  },
  filesCache = {},
): Promise<string> {
  if (filesCache[filePath]) {
    return filesCache[filePath];
  }

  if (filePath.endsWith('.less')) {
    // less file
    const data = await notebook.fs.readFile(filePath);
    return await new Promise<string>((resolve, reject) => {
      less.render(
        data,
        { paths: [path.dirname(filePath)] },
        (error, output) => {
          if (error) {
            return reject(error);
          } else {
            return resolve(output?.css || '');
          }
        },
      );
    });
  } else if (filePath.endsWith('.pdf')) {
    // pdf file
    const localFilePath = await downloadFileIfNecessary(filePath);
    const svgMarkdown = await PDF.toSVGMarkdown(localFilePath, {
      markdownDirectoryPath: fileDirectoryPath,
      svgDirectoryPath: imageDirectoryPath,
    });
    return svgMarkdown;
  } else if (filePath.match(/^https?:\/\//)) {
    /*
  else if filePath.endsWith('.js') # javascript file
    requiresJavaScriptFiles(filePath, forPreview).then (jsCode)->
      return resolve(jsCode)
    .catch (e)->
      return resolve(e)
    # .catch (error)->
    #  return reject(error)
  */
    // online file
    // github
    if (filePath.startsWith('https://github.com/')) {
      filePath = filePath
        .replace('https://github.com/', 'https://raw.githubusercontent.com/')
        .replace('/blob/', '/');
    }

    return await new Promise<string>((resolve, reject) => {
      request(filePath, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(body.toString());
        }
      });
    });
  } else {
    // local file
    return await notebook.fs.readFile(filePath);
  }
}

/**
 *
 * @param inputString
 * @param fileDirectoryPath
 * @param projectDirectoryPath
 * @param param3
 */
export async function transformMarkdown(
  inputString: string,
  {
    fileDirectoryPath = '',
    projectDirectoryPath = '',
    filesCache = {},
    useRelativeFilePath = false,
    forPreview = false,
    forMarkdownExport = false,
    protocolsWhiteListRegExp = null,
    notSourceFile = false,
    imageDirectoryPath = '',
    headingIdGenerator = new HeadingIdGenerator(),
    notebook,
  }: TransformMarkdownOptions,
): Promise<TransformMarkdownOutput> {
  let lastOpeningCodeBlockFence: string | null = null;
  let codeChunkOffset = 0;
  const slideConfigs: BlockAttributes[] = [];
  const JSAndCssFiles: string[] = [];
  let headings: HeadingData[] = [];
  let tocBracketEnabled = false;
  let frontMatterString = '';

  /**
   * As the recursive version of this function will cause the error:
   *   RangeError: Maximum call stack size exceeded
   * I wrote it in iterative way.
   * @param i start offset
   * @param lineNo start line number
   */
  async function helper(
    i: number,
    lineNo = 0,
  ): Promise<TransformMarkdownOutput> {
    let outputString = '';

    while (i < inputString.length) {
      if (inputString[i] === '\n') {
        // return helper(i+1, lineNo+1, outputString+'\n')
        i = i + 1;
        lineNo = lineNo + 1;
        outputString = outputString + '\n';
        continue;
      }

      let end = inputString.indexOf('\n', i);
      if (end < 0) {
        end = inputString.length;
      }
      let line = inputString.substring(i, end);

      const inCodeBlock = !!lastOpeningCodeBlockFence;

      const currentCodeBlockFence = (line.match(/^[`]{3,}/) || [])[0];
      if (currentCodeBlockFence) {
        if (!inCodeBlock && forPreview) {
          outputString += createAnchor(lineNo);
        }

        const containsCmd = !!line.match(/"?cmd"?\s*[:=\s}]/);
        if (!inCodeBlock && !notSourceFile && containsCmd) {
          // it's code chunk, so mark its offset
          line = line.replace('{', `{code_chunk_offset=${codeChunkOffset}, `);
          codeChunkOffset++;
        }
        if (!inCodeBlock) {
          lastOpeningCodeBlockFence = currentCodeBlockFence;
        } else if (
          lastOpeningCodeBlockFence !== null &&
          currentCodeBlockFence.length >= lastOpeningCodeBlockFence.length
        ) {
          lastOpeningCodeBlockFence = null;
        }

        // return helper(end+1, lineNo+1, outputString+line+'\n')
        i = end + 1;
        lineNo = lineNo + 1;
        outputString = outputString + line + '\n';
        continue;
      }

      if (inCodeBlock) {
        // return helper(end+1, lineNo+1, outputString+line+'\n')
        i = end + 1;
        lineNo = lineNo + 1;
        outputString = outputString + line + '\n';
        continue;
      }

      let headingMatch;
      let taskListItemMatch;
      let htmlTagMatch;

      /*
        // I changed this because for case like:

        * haha
        ![](image.png)

        The image will not be displayed correctly in preview as there will be `anchor` inserted
        between...
        */
      if (
        line.match(/^(!\[|@import)/) &&
        inputString[i - 1] === '\n' &&
        inputString[i - 2] === '\n'
      ) {
        if (forPreview) {
          outputString += createAnchor(lineNo); // insert anchor for scroll sync
        }
        /* tslint:disable-next-line:no-conditional-assignment */
      } else if ((headingMatch = line.match(/^(#{1,7}).*/))) {
        /* ((headingMatch = line.match(/^(\#{1,7})(.+)$/)) ||
                  // the ==== and --- headers don't work well. For example, table and list will affect it, therefore I decide not to support it.
                  (inputString[end + 1] === '=' && inputString[end + 2] === '=') ||
                  (inputString[end + 1] === '-' && inputString[end + 2] === '-')) */ // headings

        if (forPreview) {
          outputString += createAnchor(lineNo);
        }
        let heading;
        // if (headingMatch) {
        heading = line.replace(headingMatch[1], '');
        const tag = headingMatch[1];
        const level = tag.length;
        /*} else {
            if (inputString[end + 1] === '=') {
              heading = line.trim()
              tag = '#'
              level = 1
            } else {
              heading = line.trim()
              tag = '##'
              level = 2
            }

            end = inputString.indexOf('\n', end + 1)
            if (end < 0) end = inputString.length
          }*/

        /*if (!heading.length) {
          // return helper(end+1, lineNo+1, outputString + '\n')
          i = end + 1;
          lineNo = lineNo + 1;
          outputString = outputString + "\n";
          continue;
        }*/

        // check {class:string, id:string, ignore:boolean}
        const optMatch = heading.match(/(\s+\{|^\{)(.+?)\}(\s*)$/);
        let classes = '';
        let id = '';
        let ignore = false;
        let opt: BlockAttributes = {};
        if (optMatch) {
          heading = heading.replace(optMatch[0], '');

          try {
            opt = parseBlockAttributes(optMatch[0]);

            (classes = opt['class'] ?? ''),
              (id = opt['id'] ?? ''),
              (ignore = opt['ignore']);
            delete opt['class'];
            delete opt['id'];
            delete opt['ignore'];
          } catch (e) {
            heading = 'OptionsError: ' + optMatch[1];
            ignore = true;
          }
        }

        if (!id) {
          id = headingIdGenerator.generateId(heading);
          if (notebook.config.usePandocParser) {
            id = id.replace(/^[\d-]+/, '');
            if (!id) {
              id = 'section';
            }
          }
        }

        if (!ignore) {
          headings.push({ content: heading, level, id });
        }

        if (notebook.config.usePandocParser) {
          // pandoc
          let optionsStr = '{';
          if (id) {
            optionsStr += `#${id} `;
          }
          if (classes) {
            optionsStr += '.' + classes.replace(/\s+/g, ' .') + ' ';
          }
          if (opt) {
            for (const key in opt) {
              if (typeof opt[key] === 'number') {
                optionsStr += ' ' + key + '=' + opt[key];
              } else {
                optionsStr += ' ' + key + '="' + opt[key] + '"';
              }
            }
          }
          optionsStr += '}';

          // return helper(end+1, lineNo+1, outputString + `${tag} ${heading} ${optionsStr}` + '\n')
          i = end + 1;
          lineNo = lineNo + 1;
          outputString =
            outputString + `${tag} ${heading} ${optionsStr}` + '\n';
          continue;
        } else {
          // markdown-it
          if (!forMarkdownExport) {
            // convert to <h? ... ></h?>
            line = `${tag} ${heading}\n<p class="crossnote-header ${classes}" id="${id}"></p>`;
          } else {
            line = `${tag} ${heading}`;
          }

          // return helper(end+1, lineNo+1, outputString + line + '\n\n')
          i = end + 1;
          lineNo = lineNo + 1;
          outputString = outputString + line + '\n\n';
          continue;
          // I added one extra `\n` here because remarkable renders content below
          // heading differently with `\n` and without `\n`.
        }
      } else if (line.match(/^<!--/)) {
        // custom comment
        if (forPreview) {
          outputString += createAnchor(lineNo);
        }
        let commentEnd = inputString.indexOf('-->', i + 4);

        if (commentEnd < 0) {
          // didn't find -->
          // return helper(inputString.length, lineNo+1, outputString+'\n')
          i = inputString.length;
          lineNo = lineNo + 1;
          outputString = outputString + '\n';
          continue;
        } else {
          commentEnd += 3;
        }

        const subjectMatch = line.match(/^<!--\s+([^\s]+)/);
        if (!subjectMatch) {
          const content = inputString.slice(i + 4, commentEnd - 3).trim();
          const newlinesMatch = content.match(/\n/g);
          const newlines = newlinesMatch ? newlinesMatch.length : 0;

          // return helper(commentEnd, lineNo + newlines, outputString + '\n')
          i = commentEnd;
          lineNo = lineNo + newlines;
          outputString = outputString + '\n';
          continue;
        } else {
          const subject = subjectMatch[1];
          if (subject === '@import') {
            const commentEnd2 = line.lastIndexOf('-->');
            if (commentEnd2 > 0) {
              line = line.slice(4, commentEnd2).trim();
            }
          } else if (subject in CustomSubjects) {
            const content = inputString.slice(i + 4, commentEnd - 3).trim();
            const newlinesMatch = content.match(/\n/g);
            const newlines = newlinesMatch ? newlinesMatch.length : 0;
            const optionsMatch = content.match(/^([^\s]+?)\s([\s\S]+)$/);

            let options = {};
            if (optionsMatch && optionsMatch[2]) {
              options = parseBlockAttributes(optionsMatch[2]);
            }
            options['lineNo'] = lineNo;

            if (subject === 'pagebreak' || subject === 'newpage') {
              // pagebreak
              // return helper(commentEnd, lineNo + newlines, outputString + '<div class="pagebreak"> </div>\n')
              i = commentEnd;
              lineNo = lineNo + newlines;
              outputString = outputString + '<div class="pagebreak"> </div>\n';
              continue;
            } else if (subject.match(/^\.?slide:?$/)) {
              // slide
              slideConfigs.push(options);
              if (forMarkdownExport) {
                // return helper(commentEnd, lineNo + newlines, outputString + `<!-- ${content} -->` + '\n')
                i = commentEnd;
                lineNo = lineNo + newlines;
                outputString = outputString + `<!-- ${content} -->` + '\n';
                continue;
              } else {
                // return helper(commentEnd, lineNo + newlines, outputString + '\n[CROSSNOTESLIDE]\n\n')
                i = commentEnd;
                lineNo = lineNo + newlines;
                outputString = outputString + '\n[CROSSNOTESLIDE]\n\n';
                continue;
              }
            }
          } else {
            const content = inputString.slice(i + 4, commentEnd - 3).trim();
            const newlinesMatch = content.match(/\n/g);
            const newlines = newlinesMatch ? newlinesMatch.length : 0;
            // return helper(commentEnd, lineNo + newlines, outputString + '\n')
            i = commentEnd;
            lineNo = lineNo + newlines;
            outputString = outputString + '\n';
            continue;
          }
        }
      } else if (line.match(/^\s*\[toc\]\s*$/i)) {
        // [TOC]
        if (forPreview) {
          outputString += createAnchor(lineNo); // insert anchor for scroll sync
        }
        tocBracketEnabled = true;
        // return helper(end+1, lineNo+1, outputString + `\n[CROSSNOTETOC]\n\n`)
        i = end + 1;
        lineNo = lineNo + 1;
        outputString = outputString + `\n[CROSSNOTETOC]\n\n`;
        continue;
      } else if (
        /* tslint:disable-next-line:no-conditional-assignment */
        (taskListItemMatch = line.match(
          /^\s*(?:[*\-+]|\d+\.)\s+(\[[xX\s]\])\s/,
        ))
      ) {
        // task list
        const checked = taskListItemMatch[1] !== '[ ]';
        if (!forMarkdownExport) {
          line = line.replace(
            taskListItemMatch[1],
            `<input type="checkbox" class="task-list-item-checkbox${
              forPreview ? ' sync-line' : ''
            }" ${forPreview ? `data-line="${lineNo}"` : ''}${
              checked ? ' checked' : ''
            }>`,
          );
        }
        // return helper(end+1, lineNo+1, outputString+line+`\n`)
        i = end + 1;
        lineNo = lineNo + 1;
        outputString = outputString + line + `\n`;
        continue;
      } else if (
        /* tslint:disable-next-line:no-conditional-assignment */
        (htmlTagMatch = line.match(
          /^\s*<(?:([a-zA-Z]+)|([a-zA-Z]+)\s+(?:.+?))>/,
        ))
      ) {
        // escape html tag like <pre>
        const tagName = htmlTagMatch[1] || htmlTagMatch[2];
        if (!(tagName in selfClosingTag)) {
          const closeTagName = `</${tagName}>`;
          const end2 = inputString.indexOf(
            closeTagName,
            i + htmlTagMatch[0].length,
          );
          if (end2 < 0) {
            // HTML error. Tag not closed
            // Do Nothing here. Reason:
            //     $$ x
            //     <y>
            //     $$
            /*
              i = inputString.length
              lineNo = lineNo + 1
              outputString = outputString + `\n\`\`\`\nHTML error. Tag <${tagName}> not closed. ${closeTagName} is required.\n\`\`\`\n\n`
              continue
              */
          } else {
            const htmlString = inputString.slice(i, end2 + closeTagName.length);
            const newlinesMatch = htmlString.match(/\n/g);
            const newlines = newlinesMatch ? newlinesMatch.length : 0;

            // return helper(commentEnd, lineNo + newlines, outputString + '\n')
            i = end2 + closeTagName.length;
            lineNo = lineNo + newlines;
            outputString = outputString + htmlString;
            continue;
          }
        }
      }

      // file import
      const importMatch = line.match(/^(\s*)@import(\s+)"([^"]+)";?/);
      if (importMatch) {
        outputString += importMatch[1];
        const filePath = importMatch[3].trim();

        const leftParen = line.indexOf('{');
        let config: BlockAttributes = {};
        let configStr = '';
        if (leftParen > 0) {
          const rightParen = line.lastIndexOf('}');
          if (rightParen > 0) {
            configStr = line.substring(leftParen + 1, rightParen);
            try {
              config = parseBlockAttributes(configStr);
            } catch (error) {
              // null
            }
          }
        }

        let absoluteFilePath;
        if (
          protocolsWhiteListRegExp &&
          filePath.match(protocolsWhiteListRegExp)
        ) {
          absoluteFilePath = filePath;
        } else if (filePath.startsWith('/')) {
          absoluteFilePath = path.resolve(projectDirectoryPath, '.' + filePath);
        } else {
          absoluteFilePath = path.resolve(fileDirectoryPath, filePath);
        }

        const extname = path.extname(filePath).toLocaleLowerCase();
        let output = '';
        if (
          ['.jpeg', '.jpg', '.gif', '.png', '.apng', '.svg', '.bmp'].indexOf(
            extname,
          ) >= 0
        ) {
          // image
          let imageSrc: string = filesCache[filePath];

          if (!imageSrc) {
            if (
              protocolsWhiteListRegExp &&
              filePath.match(protocolsWhiteListRegExp)
            ) {
              imageSrc = filePath;
            } else if (useRelativeFilePath) {
              imageSrc =
                path.relative(fileDirectoryPath, absoluteFilePath) +
                '?' +
                Math.random();
            } else {
              imageSrc =
                '/' +
                path.relative(projectDirectoryPath, absoluteFilePath) +
                '?' +
                Math.random();
            }
            // enchodeURI(imageSrc) is wrong. It will cause issue on Windows
            // #414: https://github.com/shd101wyy/markdown-preview-enhanced/issues/414
            imageSrc = imageSrc.replace(/ /g, '%20').replace(/\\/g, '/');
            filesCache[filePath] = imageSrc;
          }

          if (config) {
            if (
              config['width'] ||
              config['height'] ||
              config['class'] ||
              config['id']
            ) {
              output = `<img src="${imageSrc}" `;
              for (const key in config) {
                // eslint-disable-next-line no-prototype-builtins
                if (config.hasOwnProperty(key)) {
                  output += ` ${key}="${config[key]}" `;
                }
              }
              output += '>';
            } else {
              output = '![';
              if (config['alt']) {
                output += config['alt'];
              }
              output += `](${imageSrc}`;
              if (config['title']) {
                output += ` "${config['title']}"`;
              }
              output += ')  ';
            }
          } else {
            output = `![](${imageSrc})  `;
          }
          // return helper(end+1, lineNo+1, outputString+output+'\n')
          i = end + 1;
          lineNo = lineNo + 1;
          outputString = outputString + output + '\n';
          continue;
        } else if (filePath === '[TOC]') {
          if (!config) {
            config = {
              // same case as in normalized attributes
              ['depth_from']: 1,
              ['depth_to']: 6,
              ['ordered_list']: true,
            };
          }
          config['cmd'] = 'toc';
          config['hide'] = true;
          config['run_on_save'] = true;
          config['modify_source'] = true;
          if (!notSourceFile) {
            // mark code_chunk_offset
            config['code_chunk_offset'] = codeChunkOffset;
            codeChunkOffset++;
          }

          const output2 = `\`\`\`text ${stringifyBlockAttributes(
            config,
          )}  \n\`\`\`  `;
          // return helper(end+1, lineNo+1, outputString+output+'\n')
          i = end + 1;
          lineNo = lineNo + 1;
          outputString = outputString + output2 + '\n';
          continue;
        } else {
          try {
            let fileContent = await loadFile(
              absoluteFilePath,
              {
                fileDirectoryPath,
                /*forPreview,*/ imageDirectoryPath,
                notebook,
              },
              filesCache,
            );
            filesCache[absoluteFilePath] = fileContent;

            if (config && (config['line_begin'] || config['line_end'])) {
              const lines = fileContent.split(/\n/);
              fileContent = lines
                .slice(
                  parseInt(config['line_begin'], 10) || 0,
                  parseInt(config['line_end'], 10) || lines.length,
                )
                .join('\n');
            }

            if (config && config['code_block']) {
              const fileExtension = extname.slice(1, extname.length);
              output = `\`\`\`${config['as'] ||
                fileExtensionToLanguageMap[fileExtension] ||
                fileExtension} ${stringifyBlockAttributes(
                config,
              )}  \n${fileContent}\n\`\`\`  `;
            } else if (config && config['cmd']) {
              if (!config['id']) {
                // create `id` for code chunk
                config['id'] = computeChecksum(absoluteFilePath);
              }
              if (!notSourceFile) {
                // mark code_chunk_offset
                config['code_chunk_offset'] = codeChunkOffset;
                codeChunkOffset++;
              }
              const fileExtension = extname.slice(1, extname.length);
              output = `\`\`\`${config['as'] ||
                fileExtensionToLanguageMap[fileExtension] ||
                fileExtension} ${stringifyBlockAttributes(
                config,
              )}  \n${fileContent}\n\`\`\`  `;
            } else if (['.md', '.markdown', '.mmark'].indexOf(extname) >= 0) {
              if (notebook.config.parserConfig.onWillTransformMarkdown) {
                fileContent = await notebook.config.parserConfig.onWillTransformMarkdown(
                  fileContent,
                );
              }
              // markdown files
              // this return here is necessary
              let output2;
              let headings2;
              ({
                outputString: output2,
                // eslint-disable-next-line prefer-const
                headings: headings2,
              } = await transformMarkdown(fileContent, {
                fileDirectoryPath: path.dirname(absoluteFilePath),
                projectDirectoryPath,
                filesCache,
                useRelativeFilePath: false,
                forPreview: false,
                forMarkdownExport,
                protocolsWhiteListRegExp,
                notSourceFile: true, // <= this is not the sourcefile
                imageDirectoryPath,
                notebook,
                headingIdGenerator,
              }));

              if (notebook.config.parserConfig) {
                output2 = await notebook.config.parserConfig.onDidTransformMarkdown(
                  output2,
                );
              }

              output2 = '\n' + output2 + '  ';
              headings = headings.concat(headings2);

              // return helper(end+1, lineNo+1, outputString+output+'\n')
              i = end + 1;
              lineNo = lineNo + 1;
              outputString = outputString + output2 + '\n';
              continue;
            } else if (extname === '.html') {
              // html file
              output = '<div>' + fileContent + '</div>  ';
            } else if (extname === '.csv') {
              // csv file
              const parseResult = Papa.parse(fileContent.trim());
              if (parseResult.errors.length) {
                output = `<pre class="language-text"><code>${escape(
                  parseResult.errors[0].toString(),
                )}</code></pre>  `;
              } else {
                // format csv to markdown table
                output = twoDArrayToMarkdownTable(parseResult.data);
              }
            } else if (extname === '.css' || extname === '.js') {
              if (!forPreview) {
                // not for preview, so convert to corresponding HTML tag directly.
                let sourcePath;
                if (
                  protocolsWhiteListRegExp &&
                  filePath.match(protocolsWhiteListRegExp)
                ) {
                  sourcePath = filePath;
                } else if (useRelativeFilePath) {
                  sourcePath = path.relative(
                    fileDirectoryPath,
                    absoluteFilePath,
                  );
                } else {
                  sourcePath = 'file:///' + absoluteFilePath;
                }

                if (extname === '.js') {
                  output = `<script type="text/javascript" src="${sourcePath}"></script>`;
                } else {
                  output = `<link rel="stylesheet" href="${sourcePath}">`;
                }
              } else {
                output = '';
              }
              JSAndCssFiles.push(filePath);
            } else if (/*extname === '.css' || */ extname === '.less') {
              // css or less file
              output = `<style>${fileContent}</style>`;
            } else if (extname === '.pdf') {
              if (config && config['page_no']) {
                // only disply the nth page. 1-indexed
                const pages = fileContent.split('\n');
                let pageNo = parseInt(config['page_no'], 10) - 1;
                if (pageNo < 0) {
                  pageNo = 0;
                }
                output = pages[pageNo] || '';
              } else if (
                config &&
                (config['page_begin'] || config['page_end'])
              ) {
                const pages = fileContent.split('\n');
                let pageBegin = parseInt(config['page_begin'], 10) - 1 || 0;
                const pageEnd = config['page_end'] || pages.length - 1;
                if (pageBegin < 0) {
                  pageBegin = 0;
                }
                output = pages.slice(pageBegin, pageEnd).join('\n') || '';
              } else {
                output = fileContent;
              }
            } else if (
              extname === '.dot' ||
              extname === '.gv' ||
              extname === '.viz' ||
              extname === '.graphviz'
            ) {
              // graphviz
              output = `\`\`\`dot ${stringifyBlockAttributes(
                config,
                true,
              )}\n${fileContent}\n\`\`\`  `;
            } else if (extname === '.mermaid') {
              // mermaid
              output = `\`\`\`mermaid ${stringifyBlockAttributes(
                config,
                true,
              )}\n${fileContent}\n\`\`\`  `;
            } else if (extname === '.plantuml' || extname === '.puml') {
              // PlantUML
              output = `\`\`\`puml ${stringifyBlockAttributes(
                config,
                true,
              )}\n' @crossnote_file_directory_path:${path.dirname(
                absoluteFilePath,
              )}\n${fileContent}\n\`\`\`  `;
            } else {
              /*
              else if extname in ['.wavedrom']
                output = "```wavedrom\n${fileContent}\n```  "
                # filesCache?[absoluteFilePath] = output

              else if extname == '.js'
                if forPreview
                  output = '' # js code is evaluated and there is no need to display the code.
                else
                  if filePath.match(/^https?\:\/\//)
                    output = "<script src=\"${filePath}\"></script>"
                  else
                    output = "<script>${fileContent}</script>"
              */
              // # codeblock
              let aS = null;
              if (config) {
                aS = config['as'];
              }
              if (config && config['code_block'] === false) {
                // https://github.com/shd101wyy/markdown-preview-enhanced/issues/916
                output = fileContent;
              } else {
                const fileExtension = extname.slice(1, extname.length);
                output = `\`\`\`${aS ||
                  fileExtensionToLanguageMap[fileExtension] ||
                  fileExtension} ${
                  config ? stringifyBlockAttributes(config) : ''
                }  \n${fileContent}\n\`\`\`  `;
              }
            }

            // return helper(end+1, lineNo+1, outputString+output+'\n')
            i = end + 1;
            lineNo = lineNo + 1;
            outputString = outputString + output + '\n';
            continue;
          } catch (error) {
            output = `<pre class="language-text"><code>${escape(
              error.toString(),
            )}</code></pre>  `;
            // return helper(end+1, lineNo+1, outputString+output+'\n')
            i = end + 1;
            lineNo = lineNo + 1;
            outputString = outputString + output + '\n';
            continue;
          }
        }
      } else {
        // return helper(end+1, lineNo+1, outputString+line+'\n')
        i = end + 1;
        lineNo = lineNo + 1;
        outputString = outputString + line + '\n';
        continue;
      }
    }

    // done
    return {
      outputString,
      slideConfigs,
      tocBracketEnabled,
      JSAndCssFiles,
      headings,
      frontMatterString,
    };
  }

  let endFrontMatterOffset = 0;
  if (
    inputString.startsWith('---') &&
    /* tslint:disable-next-line:no-conditional-assignment */
    (endFrontMatterOffset = inputString.indexOf('\n---')) > 0
  ) {
    frontMatterString = inputString.slice(0, endFrontMatterOffset + 4);
    return await helper(
      frontMatterString.length,
      (frontMatterString.match(/\n/g) ?? []).length,
    );
  } else {
    return await helper(0, 0);
  }
}
