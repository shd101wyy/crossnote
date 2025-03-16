import * as cheerio from 'cheerio';
import * as path from 'path';
import { compileLaTeX } from '../code-chunk/code-chunk';
import { CodeChunkData } from '../code-chunk/code-chunk-data';
import { parseBlockAttributes } from '../lib/block-attributes';
import computeChecksum from '../lib/compute-checksum';
import { Notebook } from '../notebook';
import * as plantumlAPI from '../renderers/puml';
import * as vegaAPI from '../renderers/vega';
import * as vegaLiteAPI from '../renderers/vega-lite';
import { Viz } from '../renderers/viz';
import * as magick from '../tools/magick';
import * as mermaidAPI from '../tools/mermaid';
import * as sharp from '../tools/sharp';
import * as wavedromAPI from '../tools/wavedrom';
import { extractCommandFromBlockInfo } from '../utility';

export async function processGraphs(
  text: string,
  {
    fileDirectoryPath,
    projectDirectoryPath,
    imageDirectoryPath,
    imageFilePrefix,
    useRelativeFilePath,
    codeChunksData,
    graphsCache,
    addOptionsStr,
    notebook,
  }: {
    fileDirectoryPath: string;
    projectDirectoryPath: string;
    imageDirectoryPath: string;
    imageFilePrefix: string;
    useRelativeFilePath: boolean;
    codeChunksData: { [key: string]: CodeChunkData };
    graphsCache: { [key: string]: string };
    addOptionsStr: boolean;
    notebook: Notebook;
  },
): Promise<{ outputString: string; imagePaths: string[] }> {
  const lines = text.split('\n');
  const codes: {
    start: number;
    end: number;
    content: string;
    options: object;
    optionsStr: string;
  }[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (
      trimmedLine.match(/^```(.+)"?cmd"?[:=]/) || // code chunk
      trimmedLine.match(
        /^```(puml|plantuml|dot|viz|mermaid|vega|vega-lite|wavedrom)/,
      )
    ) {
      // graphs
      const numOfSpacesAhead = (line.match(/^\s*/) ?? []).length;
      let j = i + 1;
      let content = '';
      while (j < lines.length) {
        if (
          lines[j].trim() === '```' &&
          (lines[j].match(/^\s*/) ?? []).length === numOfSpacesAhead
        ) {
          let options = {};
          let optionsStr = '';
          const optionsMatch = trimmedLine.match(/\{(.+)\}$/);
          if (optionsMatch) {
            try {
              options = parseBlockAttributes(optionsMatch[0]);
              optionsStr = optionsMatch[1];
            } catch (error) {
              options = {};
            }
          }

          codes.push({
            start: i,
            end: j,
            content,
            options,
            optionsStr,
          });
          i = j;
          break;
        }
        content += lines[j] + '\n';
        j += 1;
      }
    } else if (trimmedLine.match(/^```\S/)) {
      // remove {...} after ```lang
      const indexOfFirstSpace = line.indexOf(' ', line.indexOf('```'));
      if (indexOfFirstSpace > 0) {
        lines[i] = line.slice(0, indexOfFirstSpace);
      }
    } else if (!trimmedLine) {
      lines[i] = '  ';
    }

    i += 1;
  }

  if (!imageFilePrefix) {
    imageFilePrefix = Math.random().toString(36).substr(2, 9) + '_';
  }

  imageFilePrefix = imageFilePrefix.replace(/[/&]/g, '_ss_');
  imageFilePrefix = encodeURIComponent(imageFilePrefix);

  let imgCount = 0;

  const asyncFunctions = [];
  const imagePaths: string[] = [];

  let currentCodeChunk: CodeChunkData | null = null;
  for (const key in codeChunksData) {
    // get the first code chunk.
    if (!codeChunksData[key].prev) {
      currentCodeChunk = codeChunksData[key];
      break;
    }
  }

  /* tslint:disable-next-line:no-shadowed-variable */
  function clearCodeBlock(lines: string[], start: number, end: number) {
    let s = start;
    while (s <= end) {
      lines[s] = '';
      s += 1;
    }
  }

  async function convertSVGToPNGFile(
    outFileName = '',
    svg: string,
    /* tslint:disable-next-line:no-shadowed-variable */
    lines: string[],
    start: number,
    end: number,
    modifyCodeBlock: boolean,
    altName: string,
    optionsStr: string,
  ) {
    if (!outFileName) {
      outFileName = imageFilePrefix + imgCount + '.png';
    }

    const pngFilePath = path.resolve(imageDirectoryPath, outFileName);
    if (notebook.config.imageMagickPath) {
      // use `magick`
      await magick.svgElementToPNGFile(
        svg,
        pngFilePath,
        notebook.config.imageMagickPath,
      );
    } else {
      // use `sharp`
      await sharp.svgElementToPNGFile(svg, pngFilePath);
    }
    let displayPNGFilePath;
    if (useRelativeFilePath) {
      displayPNGFilePath =
        path.relative(fileDirectoryPath, pngFilePath) + '?' + Math.random();
    } else {
      displayPNGFilePath =
        '/' +
        path.relative(projectDirectoryPath, pngFilePath) +
        '?' +
        Math.random();
    }
    displayPNGFilePath = displayPNGFilePath.replace(/\\/g, '/'); // fix windows path error.

    imgCount++;

    if (modifyCodeBlock) {
      clearCodeBlock(lines, start, end);
      let altCaption = altName;
      if (altCaption == null) {
        altCaption = '';
      }
      let imageOptions = '';
      if (addOptionsStr) {
        imageOptions = `{${optionsStr}}`;
      }
      lines[end] +=
        '\n' + `![${altCaption}](${displayPNGFilePath})${imageOptions}  `;
    }

    imagePaths.push(pngFilePath);
    return displayPNGFilePath;
  }

  for (const codeData of codes) {
    const { start, end, content, options, optionsStr } = codeData;
    const def = lines[start].trim().slice(3).trim();

    if (options['code_block']) {
      // Do Nothing
    } else if (def.match(/^(puml|plantuml)/)) {
      try {
        const checksum = computeChecksum(optionsStr + content);
        let svg = graphsCache[checksum];
        if (!svg) {
          // check whether in cache
          svg = await plantumlAPI.render({
            content,
            fileDirectoryPath,
            plantumlJarPath: notebook.config.plantumlJarPath,
            serverURL: notebook.config.plantumlServer,
          });
        }
        await convertSVGToPNGFile(
          options['filename'],
          svg,
          lines,
          start,
          end,
          true,
          options['alt'],
          optionsStr,
        );
      } catch (error) {
        clearCodeBlock(lines, start, end);
        lines[end] += `\n` + `\`\`\`\n${error}\n\`\`\`  \n`;
      }
    } else if (def.match(/^(viz|dot)/)) {
      try {
        const checksum = computeChecksum(optionsStr + content);
        let svg = graphsCache[checksum];
        if (!svg) {
          const engine = options['engine'] || 'dot';
          svg = await Viz(content, { engine });
        }
        await convertSVGToPNGFile(
          options['filename'],
          svg,
          lines,
          start,
          end,
          true,
          options['alt'],
          optionsStr,
        );
      } catch (error) {
        clearCodeBlock(lines, start, end);
        lines[end] += `\n` + `\`\`\`\n${error}\n\`\`\`  \n`;
      }
    } else if (def.match(/^vega-lite/)) {
      // vega-lite
      try {
        const checksum = computeChecksum(optionsStr + content);
        let svg = graphsCache[checksum];
        if (!svg) {
          svg = await vegaLiteAPI.toSVG(content, fileDirectoryPath);
        }
        await convertSVGToPNGFile(
          options['filename'],
          svg,
          lines,
          start,
          end,
          true,
          options['alt'],
          optionsStr,
        );
      } catch (error) {
        clearCodeBlock(lines, start, end);
        lines[end] += `\n` + `\`\`\`\n${error}\n\`\`\`  \n`;
      }
    } else if (def.match(/^vega/)) {
      // vega
      try {
        const checksum = computeChecksum(optionsStr + content);
        let svg = graphsCache[checksum];
        if (!svg) {
          svg = await vegaAPI.toSVG(content, fileDirectoryPath);
        }
        await convertSVGToPNGFile(
          options['filename'],
          svg,
          lines,
          start,
          end,
          true,
          options['alt'],
          optionsStr,
        );
      } catch (error) {
        clearCodeBlock(lines, start, end);
        lines[end] += `\n` + `\`\`\`\n${error}\n\`\`\`  \n`;
      }
    } else if (def.match(/^mermaid/)) {
      // mermaid-cli Ver.8.4.8 has a bug, render in png https://github.com/mermaid-js/mermaid/issues/664
      try {
        let pngFileName = options['filename'];
        if (!pngFileName) {
          pngFileName = imageFilePrefix + imgCount + '.png';
        }
        const pngFilePath = path.resolve(imageDirectoryPath, pngFileName);
        imgCount++;
        await mermaidAPI.mermaidToPNG(
          content,
          pngFilePath,
          projectDirectoryPath,
          notebook.config.mermaidTheme,
        );

        let displayPNGFilePath;
        if (useRelativeFilePath) {
          displayPNGFilePath =
            path.relative(fileDirectoryPath, pngFilePath) + '?' + Math.random();
        } else {
          displayPNGFilePath =
            '/' +
            path.relative(projectDirectoryPath, pngFilePath) +
            '?' +
            Math.random();
        }
        clearCodeBlock(lines, start, end);

        let altCaption = options['alt'];
        if (altCaption == null) {
          altCaption = '';
        }
        let imageOptions = '';
        if (addOptionsStr) {
          imageOptions = `{${optionsStr}}`;
        }
        lines[end] +=
          '\n' +
          `![${altCaption}](${displayPNGFilePath.replace(
            /\\/g,
            '/',
          )})${imageOptions}  `;

        imagePaths.push(pngFilePath);
      } catch (error) {
        clearCodeBlock(lines, start, end);
        lines[end] += `\n` + `\`\`\`\n${error}\n\`\`\`  \n`;
      }
    } else if (def.match(/^wavedrom/)) {
      try {
        const checksum = computeChecksum(optionsStr + content);
        let svg = graphsCache[checksum];
        if (!svg) {
          // check whether in cache
          svg = await wavedromAPI.render(content, projectDirectoryPath);
        }
        await convertSVGToPNGFile(
          options['filename'],
          svg,
          lines,
          start,
          end,
          true,
          options['alt'],
          optionsStr,
        );
      } catch (error) {
        clearCodeBlock(lines, start, end);
        lines[end] += `\n` + `\`\`\`\n${error}\n\`\`\`  \n`;
      }
    } else if (currentCodeChunk) {
      // code chunk
      if (currentCodeChunk.normalizedInfo.attributes['hide']) {
        // remove code block
        clearCodeBlock(lines, start, end);
      } else {
        // remove {...} after ```lang
        const line = lines[start];
        const indexOfFirstSpace = line.indexOf(' ', line.indexOf('```'));
        lines[start] = line.slice(0, indexOfFirstSpace);
      }

      if (currentCodeChunk.result) {
        // append result
        let result = currentCodeChunk.result;
        const attributes = currentCodeChunk.normalizedInfo.attributes;
        if (attributes['output'] === 'html' || attributes['matplotlib']) {
          // check svg and convert it to png
          const $ = cheerio.load(currentCodeChunk.result); // xmlMode here is necessary...
          const svg = $('svg');
          if (svg.length === 1) {
            const pngFilePath = (
              await convertSVGToPNGFile(
                attributes['filename'],
                $.html('svg'),
                lines,
                start,
                end,
                false,
                options['alt'],
                optionsStr,
              )
            ).replace(/\\/g, '/');
            result = `![](${pngFilePath})  \n`;
          }
        } else if (
          (
            extractCommandFromBlockInfo(currentCodeChunk.normalizedInfo) || ''
          ).match(/^(la)?tex$/)
        ) {
          // for latex, need to run it again to generate svg file in currect directory.
          result = await compileLaTeX(
            content,
            fileDirectoryPath,
            Object.assign({}, attributes, {
              latex_svg_dir: imageDirectoryPath,
            }),
          );
        } else if (
          currentCodeChunk.normalizedInfo.attributes['output'] === 'markdown'
        ) {
          result = currentCodeChunk.plainResult;
        } else if (!attributes['output'] || attributes['output'] === 'text') {
          result = `\n\`\`\`\n${currentCodeChunk.plainResult}\`\`\`\n`;
        }

        lines[end] += '\n' + result;
      }
      if (currentCodeChunk.next) {
        currentCodeChunk = codeChunksData[currentCodeChunk.next];
      } else {
        currentCodeChunk = null;
      }
    }
  }

  await Promise.all(asyncFunctions);

  const outputString = lines.filter((line) => line).join('\n');
  return { outputString, imagePaths };
}
