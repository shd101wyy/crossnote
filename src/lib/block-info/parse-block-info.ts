import { BlockAttributes, parseBlockAttributes } from '../block-attributes';
import { BlockInfo } from './types';

export const parseBlockInfo = (raw = ''): BlockInfo => {
  let language: string | undefined;
  let attributesAsString: string;
  let attributes: BlockAttributes;
  const trimmedParams = raw.trim();
  if (trimmedParams.indexOf('{') !== -1) {
    // The transformer appends {data-source-line="N"} to fence info strings.
    // Depending on whether the fence already had attrs, it produces one of:
    //
    //   "lang {attrs data-source-line="N"}"       ← brace-attrs merged with source line
    //   "lang space-attrs {data-source-line="N"}" ← space-attrs with source line appended
    //   "lang {data-source-line="N"}"             ← no prior attrs, source line only
    //   "lang {attrs}"                            ← no source tracking (normal case)
    //
    // Strategy: extract the language token (up to first space or '{'), then
    // gather all brace-group contents and bare space-separated tokens as attrs.
    const langMatch = trimmedParams.match(/^([^\s{]*)/);
    if (langMatch?.[1].length) {
      language = langMatch[1];
    }
    const afterLang = trimmedParams.slice(language?.length ?? 0).trim();
    // Collect all {…} blocks and bare tokens between them
    const attrParts: string[] = [];
    let rest = afterLang;
    while (rest.length) {
      const braceStart = rest.indexOf('{');
      if (braceStart === -1) {
        // remaining bare tokens
        const bare = rest.trim();
        if (bare) attrParts.push(bare);
        break;
      }
      // bare tokens before the brace
      const bare = rest.slice(0, braceStart).trim();
      if (bare) attrParts.push(bare);
      // find matching closing brace
      let depth = 1;
      let i = braceStart + 1;
      while (i < rest.length && depth > 0) {
        if (rest[i] === '{') depth++;
        else if (rest[i] === '}') depth--;
        i++;
      }
      const braceContent = rest.slice(braceStart + 1, i - 1).trim();
      if (braceContent) attrParts.push(braceContent);
      rest = rest.slice(i).trim();
    }
    attributesAsString = attrParts.join(' ');
  } else {
    const match = trimmedParams.match(/^([^\s]+)\s+(.+?)$/);
    if (match) {
      if (match[1].length) {
        language = match[1];
      }
      attributesAsString = match[2];
    } else {
      language = trimmedParams;
      attributesAsString = '';
    }
  }

  if (attributesAsString) {
    try {
      attributes = parseBlockAttributes(attributesAsString);
    } catch (e) {
      attributes = {};
    }
  } else {
    attributes = {};
  }

  const classNames = attributes.class ? attributes.class.split(/\s+/) : [];
  if (!language) {
    language = classNames[0] || '';
  }
  if (!classNames.includes(language)) {
    attributes.class = [language, ...classNames].join(' ');
  }
  return { language, attributes };
};
