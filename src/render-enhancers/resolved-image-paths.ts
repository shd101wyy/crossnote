import type { CheerioAPI } from 'cheerio';
import { MarkdownEngineRenderOption } from '../markdown-engine';

/**
 * Apply `mapUrl` to every image candidate URL in a `srcset` value, keeping
 * each candidate's width/density descriptor (`480w`, `2x`) as it was.
 *
 * Follows the candidate splitting of the HTML srcset parser: a URL is a run of
 * non-whitespace, so commas inside it (`data:` URLs) are kept, and trailing
 * commas end the candidate. Descriptors run up to the next comma.
 */
export function mapSrcsetUrls(
  srcset: string,
  mapUrl: (url: string) => string,
): string {
  const candidates: string[] = [];
  let i = 0;
  while (i < srcset.length) {
    // Skip the whitespace and commas between candidates.
    while (i < srcset.length && /[\s,]/.test(srcset[i])) {
      i++;
    }
    if (i >= srcset.length) {
      break;
    }
    let j = i;
    while (j < srcset.length && !/\s/.test(srcset[j])) {
      j++;
    }
    let url = srcset.slice(i, j);
    let descriptor = '';
    if (/,$/.test(url)) {
      url = url.replace(/,+$/, '');
    } else {
      const comma = srcset.indexOf(',', j);
      const end = comma === -1 ? srcset.length : comma;
      descriptor = srcset.slice(j, end).trim();
      j = end;
    }
    i = j;
    const mapped = mapUrl(url);
    candidates.push(descriptor ? `${mapped} ${descriptor}` : mapped);
  }
  return candidates.join(', ');
}

/**
 * This function resolves image paths
 * @param $ cheerio object that we will analyze
 * @return cheerio object
 */
export default async function enhance(
  $: CheerioAPI,
  options: MarkdownEngineRenderOption,
  resolveFilePath: (
    path: string,
    useRelativeFilePath: boolean,
    fileDirectoryPath?: string,
  ) => string,
): Promise<void> {
  const resolve = (src: string) =>
    resolveFilePath(
      src,
      options.useRelativeFilePath,
      options.fileDirectoryPath,
    );

  // resolve image paths
  $('img, a').each((i, imgElement) => {
    let srcTag = 'src';
    if (imgElement.name === 'a') {
      srcTag = 'href';
    }

    const img = $(imgElement);
    const src = img.attr(srcTag);
    if (!src) {
      return;
    }

    img.attr(srcTag, resolve(src));
  });

  // Resolve responsive and theme-dependent image candidates too, e.g. GitHub's
  // `<picture><source media="(prefers-color-scheme: dark)" srcset="…">`.
  // Left relative, they resolve against the preview document, which inside a
  // VS Code webview is `vscode-webview://<uuid>/`, so the image never loads.
  $('img[srcset], source[srcset]').each((i, element) => {
    const $element = $(element);
    const srcset = $element.attr('srcset');
    if (!srcset) {
      return;
    }
    $element.attr('srcset', mapSrcsetUrls(srcset, resolve));
  });
}
