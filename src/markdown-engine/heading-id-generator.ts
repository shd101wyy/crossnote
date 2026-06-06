import uslug from 'uslug';

export default class HeadingIdGenerator {
  private table: { [key: string]: number };
  constructor() {
    this.table = {};
  }
  public generateId(heading: string): string {
    const replacement = (match: string, capture: string): string => {
      const sanitized = capture
        .replace(/[!"#$%&'()*+,./:;<=>?@[\\]^`{|}~]/g, '')
        .replace(/^\s/, '')
        .replace(/\s$/, '')
        .replace(/`/g, '~');
      return (
        (capture.match(/^\s+$/) ? '~' : sanitized) +
        (match.endsWith(' ') && !sanitized.endsWith('~') ? '~' : '')
      );
    };
    heading = heading
      .trim()
      .replace(/~|。/g, '') // sanitize
      .replace(/``(.+?)``\s?/g, replacement)
      .replace(/`(.*?)`\s?/g, replacement)
      // Strip underscore emphasis markers the way markdown renders them,
      // so the generated id matches GitHub's anchors (which are derived
      // from the *rendered* heading text). Per CommonMark, `_` emphasis
      // opens after start-of-line/whitespace/punctuation and closes
      // before end-of-line/whitespace/punctuation (no intraword `_`
      // emphasis, so `foo_bar_` keeps its underscores). The boundary
      // classes exclude `_` itself so that an intraword `__` run is not
      // half-consumed as a boundary, and the trailing boundary is a
      // lookahead so adjacent runs like `_a_ _b_` both match.
      .replace(
        /(^|\s|(?!_)[\p{P}\p{S}])___([^\s_](?:[^_]*[^\s_])?)___(?=$|\s|(?!_)[\p{P}\p{S}])/gu,
        `$1$2`,
      )
      .replace(
        /(^|\s|(?!_)[\p{P}\p{S}])__([^\s_](?:[^_]*[^\s_])?)__(?=$|\s|(?!_)[\p{P}\p{S}])/gu,
        `$1$2`,
      )
      .replace(
        /(^|\s|(?!_)[\p{P}\p{S}])_([^\s_](?:[^_]*[^\s_])?)_(?=$|\s|(?!_)[\p{P}\p{S}])/gu,
        `$1$2`,
      );
    let slug = uslug(heading.replace(/\s/g, '~')).replace(/~/g, '-');
    if (this.table[slug] >= 0) {
      this.table[slug] = this.table[slug] + 1;
      slug += '-' + this.table[slug];
    } else {
      this.table[slug] = 0;
    }
    return slug;
  }
}
