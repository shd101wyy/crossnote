// `pdf2svg` is required to be installed
// http://www.cityinthesky.co.uk/opensource/pdf2svg/
//

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as temp from 'temp';
import computeChecksum from '../lib/compute-checksum';

let SVG_DIRECTORY_PATH: string | undefined;

export function toSVGMarkdown(
  pdfFilePath: string,
  {
    svgDirectoryPath,
    markdownDirectoryPath,
    svgZoom,
    svgWidth,
    svgHeight,
  }: {
    markdownDirectoryPath: string;
    svgDirectoryPath?: string;
    svgZoom?: string;
    svgWidth?: string;
    svgHeight?: string;
  },
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (!svgDirectoryPath) {
      if (!SVG_DIRECTORY_PATH) {
        SVG_DIRECTORY_PATH = temp.mkdirSync('crossnote_pdf');
      }
      svgDirectoryPath = SVG_DIRECTORY_PATH;
    }

    const svgFilePrefix = computeChecksum(pdfFilePath) + '_';

    const task = spawn(
      'pdf2svg',
      [
        `"${pdfFilePath}"`,
        `"${path.resolve(
          svgDirectoryPath ?? `/tmp/crossnote_pdf`,
          svgFilePrefix + '%d.svg',
        )}"`,
        'all',
      ],
      { shell: true },
    );
    const chunks: string[] = [];
    task.stdout.on('data', (chunk) => {
      chunks.push(chunk);
    });

    const errorChunks: Buffer[] = [];
    task.stderr.on('data', (chunk) => {
      errorChunks.push(chunk);
    });

    task.on('error', (error) => {
      errorChunks.push(Buffer.from(error.toString(), 'utf-8'));
    });

    task.on('close', () => {
      if (errorChunks.length) {
        return reject(Buffer.concat(errorChunks).toString());
      } else {
        fs.readdir(svgDirectoryPath ?? '', (error, items) => {
          if (error) {
            return reject(error.toString());
          }

          items = items.sort((a, b) => {
            const offsetA = parseInt((a.match(/_(\d+)\.svg$/) ?? [])[1], 10);
            const offsetB = parseInt((b.match(/_(\d+)\.svg$/) ?? [])[1], 10);
            return offsetA - offsetB;
          });

          let svgMarkdown = '';
          const r = Math.random();

          items.forEach((fileName) => {
            const match = fileName.match(
              new RegExp(`^${svgFilePrefix}(\\d+).svg`),
            );
            if (match) {
              let svgFilePath = path.relative(
                markdownDirectoryPath,
                path.resolve(svgDirectoryPath ?? '', fileName),
              );

              // nvm, the converted result looks so ugly
              /*
            const pngFilePath = svgFilePath.replace(/\.svg$/, '.png')

            // convert svg to png
            gm(svgFilePath)
            .noProfile()
            .write(pngFilePath, function(error) {
              console.log(error, pngFilePath)
            })
            */
              svgFilePath = svgFilePath
                .replace(/\.\.\\/g, '../')
                .replace(
                  /\\/g,
                  '/',
                ); /* Windows file path issue. "..\..\blabla" doesn't work */

              if (svgZoom || svgWidth || svgHeight) {
                svgMarkdown += `<img src="${svgFilePath}" ${
                  svgWidth ? `width="${svgWidth}"` : ''
                } ${svgHeight ? `height="${svgHeight}"` : ''} ${
                  svgZoom ? `style="zoom:${svgZoom};"` : ''
                }>`;
              } else {
                svgMarkdown += `![](${svgFilePath}?${r})\n`;
              }
            }
          });
          return resolve(svgMarkdown);
        });
      }
    });
  });
}
