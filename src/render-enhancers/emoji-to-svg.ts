import { twemojiParse } from "../custom-markdown-it-features/emoji";

/**
 * Replace emoji with svg.
 * @param $
 */
export default function enhance($: CheerioStatic): void {
  $.root().html(twemojiParse($.html()));
}
