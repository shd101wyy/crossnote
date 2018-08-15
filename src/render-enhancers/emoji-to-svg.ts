import { resolve } from "path";
import * as twemoji from "twemoji";

/**
 * Replace emoji with svg.
 * @param $
 */
export default async function enhance($: CheerioStatic): Promise<void> {
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
    attributes: () => {
      return {
        height: "0.8em",
      };
    },
  });

  $.root().html(html);
}
