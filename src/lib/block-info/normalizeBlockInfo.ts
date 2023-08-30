import { normalizeBlockAttributes } from '../block-attributes/normalizeBlockAttributes.js';

import { BlockInfo } from './types.js';

const normalizeLanguage = (language?: string): string => {
  if (typeof language === 'string') {
    return language.trim().toLowerCase();
  }

  return '';
};

export const normalizeBlockInfo = (blockInfo: BlockInfo): BlockInfo => {
  const normalizedAttributes = normalizeBlockAttributes(blockInfo.attributes);
  const normalizedLanguage = normalizeLanguage(blockInfo.language);
  if (
    normalizedAttributes !== blockInfo.attributes ||
    normalizedLanguage !== blockInfo.language
  ) {
    return {
      language: normalizedLanguage,
      attributes: normalizedAttributes,
    };
  }

  return blockInfo;
};
