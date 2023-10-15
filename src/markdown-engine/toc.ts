import MarkdownIt from 'markdown-it';
import HeadingIdGenerator from './heading-id-generator';

function nPrefix(str, n) {
  let output = '';
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
  let output = '';
  let offset = 0;

  // test ![...](...)
  // test [...](...)
  // <a name="myAnchor"></a>Anchor Header
  // test [^footnote]
  const r =
    /!?\[([^\]]*)\]\(([^)]*)\)|<([^>]*)>([^<]*)<\/([^>]*)>|\[\^([^\]]*)\]/g;
  let match: RegExpExecArray | null = null;
  // tslint:disable-next-line:no-conditional-assignment
  while ((match = r.exec(content))) {
    output += content.slice(offset, match.index);
    offset = match.index + match[0].length;

    if (match[0][0] === '<') {
      output += match[4];
    } else if (match[0][0] === '[' && match[0][1] === '^') {
      //  # footnote
      output += '';
    } else if (match[0][0] !== '!') {
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

export interface HeadingData {
  content: string;
  level: number;
  offset?: number;
  id?: string;
  /**
   * 1-based line number
   */
  lineNo?: number;
}

export function toc(headings: HeadingData[], opt: TocOption) {
  const headingIdGenerator = new HeadingIdGenerator();
  if (!headings) {
    return { content: '', array: [] };
  }

  const ordered = opt.ordered;
  const depthFrom = opt.depthFrom || 1;
  const depthTo = opt.depthTo || 6;
  let tab = opt.tab || '  ';
  const ignoreLink = opt.ignoreLink || false;

  if (ordered) {
    tab = '    ';
  }

  headings = headings.filter((heading) => {
    return heading.level >= depthFrom && heading.level <= depthTo;
  });

  if (!headings.length) {
    return { content: '', array: [] };
  }

  const outputArr: string[] = [];
  let smallestLevel = headings[0].level;

  // get smallestLevel
  for (const heading of headings) {
    if (heading.level < smallestLevel) {
      smallestLevel = heading.level;
    }
  }

  let orderedListNums: number[] = [];
  for (const heading of headings) {
    const content = heading.content.trim();
    const level = heading.level;
    const slug = heading.id || headingIdGenerator.generateId(content);
    const n = level - smallestLevel;
    let numStr: string = '1';
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
      numStr = orderedListNums[orderedListNums.length - 1].toString();
    }
    const listItem = `${nPrefix(tab, n)}${ordered ? `${numStr}.` : '-'} ${
      ignoreLink
        ? sanitizeContent(content)
        : `[${sanitizeContent(content)}](#${slug})`
    }`;
    outputArr.push(listItem);
  }

  return {
    content: outputArr.join('\n'),
    array: outputArr,
  };
}

export function generateSidebarToCHTML(
  headings: HeadingData[],
  md: MarkdownIt,
  opt: TocOption,
): string {
  if (!headings.length) {
    return '';
  }
  const headingIdGenerator = new HeadingIdGenerator();
  const depthFrom = opt.depthFrom || 1;
  const depthTo = opt.depthTo || 6;

  headings = headings.filter((heading) => {
    return heading.level >= depthFrom && heading.level <= depthTo;
  });
  headings = headings.map((heading, index) => {
    heading.offset = index;
    return heading;
  });

  let tocHtml = '';
  let smallestLevel = headings[0].level;
  for (let i = 0; i < headings.length; i++) {
    if (headings[i].level < smallestLevel) {
      smallestLevel = headings[i].level;
    }
  }

  /**
   * Get list of sub headers
   */
  const getSubHeadings = (
    headingsData: HeadingData[],
    expectedLevel: number,
    startOffset: number,
  ): HeadingData[] => {
    const arr: HeadingData[] = [];
    for (let i = startOffset; i < headingsData.length; i++) {
      const heading = headingsData[i];
      if (heading.level === expectedLevel) {
        arr.push(heading);
      } else if (heading.level < expectedLevel) {
        break;
      } else {
        continue;
      }
    }
    return arr;
  };

  /**
   * Build the ToC Html
   */
  const convertHeadingsDataToHTML = (
    allHeadingsData: HeadingData[],
    headingsData: HeadingData[],
  ) => {
    const left = 24;
    const marginLeftDelta = 18;
    let result = '';
    for (let i = 0; i < headingsData.length; i++) {
      const heading = headingsData[i];

      if (heading.offset === undefined) {
        continue;
      }

      const subHeadings = getSubHeadings(
        allHeadingsData,
        heading.level + 1,
        heading.offset + 1,
      );

      const leftIndentStyle = `padding-left:${
        heading.level === smallestLevel ? 0 : left
      }px;`;
      const paddingStyle = `padding:0;`;

      const headingHtml = md.render(heading.content);
      const headingId =
        heading.id || headingIdGenerator.generateId(heading.content);
      if (subHeadings.length) {
        result += `<details style="${paddingStyle};${leftIndentStyle}" ${
          'open' // headingsData.length === smallestLevel ? "open" : ""
        }>
        <summary class="md-toc-link-wrapper">
          <a href="#${headingId}" class="md-toc-link">${headingHtml}</a>
          </summary>
        <div>
          ${convertHeadingsDataToHTML(allHeadingsData, subHeadings)}
        </div>
      </details>
    `;
      } else {
        result += `<div class="md-toc-link-wrapper" style="${paddingStyle};display:list-item;list-style:square;margin-left:${
          heading.level === smallestLevel
            ? marginLeftDelta
            : left + marginLeftDelta
        }px">
          <a
            href="#${headingId}"
            class="md-toc-link"
          >
            ${headingHtml}
          </a></div>`;
      }
    }
    return result;
  };

  tocHtml = `
<div class="md-toc">
${convertHeadingsDataToHTML(
  headings,
  getSubHeadings(headings, smallestLevel, 0),
)}
</div>
`;

  return tocHtml;
}
