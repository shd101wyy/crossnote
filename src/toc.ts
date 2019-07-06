import HeadingIdGenerator from "./heading-id-generator";

function nPrefix(str, n) {
  let output = "";
  for (let i = 0; i < n; i++) {
    output += str;
  }
  return output;
}

/**
 *  eg:
 * Haha [A](www.a.com) xxx [B](www.b.com)
 *  should become
 * Haha A xxx B
 *
 * check issue #41
 */

function sanitizeContent(content) {
  let output = "";
  let offset = 0;

  // test ![...](...)
  // test [...](...)
  // <a name="myAnchor"></a>Anchor Header
  // test [^footnote]
  const r = /\!?\[([^\]]*)\]\(([^)]*)\)|<([^>]*)>([^<]*)<\/([^>]*)>|\[\^([^\]]*)\]/g;
  let match = null;
  // tslint:disable-next-line:no-conditional-assignment
  while ((match = r.exec(content))) {
    output += content.slice(offset, match.index);
    offset = match.index + match[0].length;

    if (match[0][0] === "<") {
      output += match[4];
    } else if (match[0][0] === "[" && match[0][1] === "^") {
      //  # footnote
      output += "";
    } else if (match[0][0] !== "!") {
      output += match[1]; // image
    } else {
      output += match[0];
    }
  }

  output += content.slice(offset, content.length);
  return output;
}

/**
 *  ordered: boolean
 *  depthFrom: number, default 1
 *  depthTo: number, default 6
 *  tab: string, default `  `
 */
export interface TocOption {
  ordered: boolean;
  depthFrom: number;
  depthTo: number;
  tab: string;
  ignoreLink?: boolean;
}

/**
 *
 * @param opt:TocOption =
 * @param tokens = [{content:string, level:number, id:optional|string }]
 * @return {content, array}
 */
export function toc(
  tokens: Array<{ content: string; level: number; id?: string }>,
  opt: TocOption,
) {
  const headingIdGenerator = new HeadingIdGenerator();
  if (!tokens) {
    return { content: "", array: [] };
  }

  const ordered = opt.ordered;
  const depthFrom = opt.depthFrom || 1;
  const depthTo = opt.depthTo || 6;
  let tab = opt.tab || "  ";
  const ignoreLink = opt.ignoreLink || false;

  if (ordered) {
    tab = "    ";
  }

  tokens = tokens.filter((token) => {
    return token.level >= depthFrom && token.level <= depthTo;
  });

  if (!tokens.length) {
    return { content: "", array: [] };
  }

  const outputArr = [];
  let smallestLevel = tokens[0].level;

  // get smallestLevel
  for (const token of tokens) {
    if (token.level < smallestLevel) {
      smallestLevel = token.level;
    }
  }

  let orderedListNums = [];
  for (const token of tokens) {
    const content = token.content.trim();
    const level = token.level;
    const slug = token.id || headingIdGenerator.generateId(content);
    const n = level - smallestLevel;
    let numStr = "1";
    if (ordered) {
      // number for ordered list
      if (n >= orderedListNums.length) {
        orderedListNums.push(1);
      } else if (n === orderedListNums.length - 1) {
        orderedListNums[orderedListNums.length - 1]++;
      } else {
        orderedListNums = orderedListNums.slice(0, n + 1);
        if (orderedListNums.length) {
          orderedListNums[orderedListNums.length - 1]++;
        }
      }
      numStr = orderedListNums[orderedListNums.length - 1];
    }
    const listItem = `${nPrefix(tab, n)}${ordered ? `${numStr}.` : "-"} ${
      ignoreLink
        ? sanitizeContent(content)
        : `[${sanitizeContent(content)}](#${slug})`
    }`;
    outputArr.push(listItem);
  }

  return {
    content: outputArr.join("\n"),
    array: outputArr,
  };
}
