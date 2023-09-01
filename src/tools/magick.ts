/**
 * ImageMagick magick command wrapper
 */
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import imagemagickCli from 'imagemagick-cli';
import { tempOpen } from '../utility';

export async function svgElementToPNGFile(
  svgElement: string,
  pngFilePath: string,
  imageMagickPath: string = '',
): Promise<string> {
  const info = await tempOpen({ prefix: 'crossnote-svg', suffix: '.svg' });
  fs.writeFileSync(info.fd, svgElement); // write svgElement to temp .svg file
  const args = [info.path, pngFilePath];
  try {
    if (imageMagickPath && imageMagickPath.length) {
      await execFileSync(imageMagickPath, args);
    } else {
      await imagemagickCli.exec(`convert ${args.join(' ')}`);
    }
  } catch (error) {
    throw new Error(
      'imagemagick-cli failure\n' +
        error.toString() +
        '\n\nPlease make sure you have ImageMagick installed.',
    );
  }

  return pngFilePath;
}
