import * as uslug from "uslug";

export default class HeadingIdGenerator {
  private table: { [key: string]: number };
  constructor() {
    this.table = {};
  }
  public generateId(heading: string): string {
    const replacement = (match: string, capture: string): string => {
      let sanitized = capture
        .replace(/[!"#$%&'()*+,./:;<=>?@[\\]^`{|}~]/g, "")
        .replace(/^\s/, "")
        .replace(/\s$/, "")
        .replace(/`/g, "~");
      return (
        (capture.match(/^\s+$/) ? "~" : sanitized) +
        (match.endsWith(" ") && !sanitized.endsWith("~") ? "~" : "")
      );
    };
    heading = heading
      .trim()
      .replace(/~|。/g, "") // sanitize
      .replace(/``(.+?)``\s?/g, replacement)
      .replace(/`(.*?)`\s?/g, replacement);
    let slug = uslug(heading.replace(/\s/g, "~")).replace(/~/g, "-");
    if (this.table[slug] >= 0) {
      this.table[slug] = this.table[slug] + 1;
      slug += "-" + this.table[slug];
    } else {
      this.table[slug] = 0;
    }
    return slug;
  }
}
