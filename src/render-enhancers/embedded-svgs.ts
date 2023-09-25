import { extname } from 'path';
import { Notebook } from '../notebook';
import { removeFileProtocol } from '../utility';

/**
 * Load local svg files and embed them into html directly.
 * @param $
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
      if (imageType !== 'svg') {
        return;
      }
      asyncFunctions.push(
        new Promise((resolve) => {
          notebook.fs
            .readFile(decodeURI(src), 'base64')
            .then((base64) => {
              $img.attr(
                'src',
                `data:image/svg+xml;charset=utf-8;base64,${base64}`,
              );
              return resolve(base64);
            })
            .catch(() => {
              return resolve(null);
            });
        }),
      );
    }
  });

  await Promise.all(asyncFunctions);
}
