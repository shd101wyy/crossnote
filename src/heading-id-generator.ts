import * as uslug from "uslug";

export default class HeadingIdGenerator {
  private table: { [key: string]: number };
  constructor() {
    this.table = {};
  }
  public generateId(heading: string): string {
    heading = heading.replace(/。/g, ""); // sanitize
    let slug = uslug(heading);
    if (this.table[slug] >= 0) {
      this.table[slug] = this.table[slug] + 1;
      slug += "-" + this.table[slug];
    } else {
      this.table[slug] = 0;
    }
    return slug;
  }
}
