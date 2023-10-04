import { MarkdownEngineRenderOption } from '../markdown-engine';

/**
 * This function resolves image paths
 * @param $ cheerio object that we will analyze
 * @return cheerio object
 */
export default async function enhance(
  $,
  options: MarkdownEngineRenderOption,
  resolveFilePath: (
    path: string,
    useRelativeFilePath: boolean,
    fileDirectoryPath?: string,
  ) => string,
): Promise<void> {
  // resolve image paths
  $('img, a').each((i, imgElement) => {
    let srcTag = 'src';
    if (imgElement.name === 'a') {
      srcTag = 'href';
    }

    const img = $(imgElement);
    const src = img.attr(srcTag);

    img.attr(
      srcTag,
      resolveFilePath(
        src,
        options.useRelativeFilePath,
        options.fileDirectoryPath,
      ),
    );
  });
}
