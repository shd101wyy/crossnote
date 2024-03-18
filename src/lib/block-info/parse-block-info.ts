import { BlockAttributes, parseBlockAttributes } from '../block-attributes';
import { BlockInfo } from './types';

export const parseBlockInfo = (raw = ''): BlockInfo => {
  let language: string | undefined;
  let attributesAsString: string;
  let attributes: BlockAttributes;
  const trimmedParams = raw.trim();
  const match =
    trimmedParams.indexOf('{') !== -1
      ? trimmedParams.match(/^([^\s{]*)\s*\{(.*?)\}/)
      : trimmedParams.match(/^([^\s]+)\s+(.+?)$/);

  if (match) {
    if (match[1].length) {
      language = match[1];
    }
    attributesAsString = match[2];
  } else {
    language = trimmedParams;
    attributesAsString = '';
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
