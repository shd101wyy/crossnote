import { MarkdownEngineRenderOption } from "../markdown-engine";

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
  usePandocParser,
): Promise<void> {
  // resolve image paths
  $("img, a").each((i, imgElement) => {
    let srcTag = "src";
    if (imgElement.name === "a") {
      srcTag = "href";
    }

    const img = $(imgElement);
    const src = img.attr(srcTag);

    // insert anchor for scroll sync.
    if (
      options.isForPreview &&
      imgElement.name !== "a" &&
      img
        .parent()
        .prev()
        .hasClass("sync-line")
    ) {
      const lineNo = parseInt(
        img
          .parent()
          .prev()
          .attr("data-line"),
        10,
      );
      if (lineNo) {
        img
          .parent()
          .after(
            `<p data-line="${lineNo +
              1}" class="sync-line" style="margin:0;"></p>`,
          );
      }
    }

    img.attr(
      srcTag,
      resolveFilePath(
        src,
        options.useRelativeFilePath,
        options.fileDirectoryPath,
      ),
    );
  });

  if (!usePandocParser) {
    // check .mume-header in order to add id and class to headers.
    $(".mume-header").each((i, e) => {
      const classes = e.attribs.class;
      const id = e.attribs.id;
      const $e = $(e);
      const $h = $e.prev();
      $h.addClass(classes);
      $h.attr("id", encodeURIComponent(id)); // encodeURIComponent to fix utf-8 header.
      $e.remove();
    });
  }
}
