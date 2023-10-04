import { extname } from 'path';
import { Notebook } from '../notebook';
import { removeFileProtocol } from '../utility';

/**
 * Embed local images. Load the image file and display it in base64 format
 */
export default async function enhance(
  $: CheerioStatic,
  notebook: Notebook,
  resolveFilePath: (path: string, useRelativeFilePath: boolean) => string,
): Promise<void> {
  const asyncFunctions: Promise<string | null>[] = [];

  $('img').each((i, img) => {
    const $img = $(img);
    let src = resolveFilePath($img.attr('src'), false);

    const fileProtocolMatch = src.match(/^(file|vscode-resource):\/\/+/);
    if (fileProtocolMatch) {
      src = removeFileProtocol(src);
      src = src.replace(/\?(\.|\d)+$/, ''); // remove cache
      const imageType = extname(src).slice(1);
      if (imageType === 'svg') {
        return;
      }
      asyncFunctions.push(
        new Promise((resolve) => {
          notebook.fs
            .readFile(decodeURI(src), 'base64')
            .then((base64) => {
              // const base64 = new Buffer(data).toString('base64');
              $img.attr(
                'src',
                `data:image/${imageType};charset=utf-8;base64,${base64}`,
              );
              return resolve(base64);
            })
            .catch((error) => {
              console.error(error);
              return resolve(null);
            });
        }),
      );
    }
  });

  await Promise.all(asyncFunctions);
}
