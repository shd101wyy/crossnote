import { CheerioAPI } from "cheerio";
import { resolve } from "path";
import * as twemoji from "twemoji";

/**
 * Replace emoji with svg.
 * @param $
 */
export default function enhance($: CheerioAPI): void {
  const html = twemoji.parse($.html(), {
    callback: (icon) => {
      return (
        "file://" +
        resolve(__dirname, "../../../node_modules/twemoji/2/svg") +
        "/" +
        icon +
        ".svg"
      );
    },
  });

  $.root().html(html);
}
