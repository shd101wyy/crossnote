import { snakeCase } from 'case-anything';
import { BlockAttributes } from './types';

/**
 * Walks through attribute keys and makes them kebabCase if needed
 * https://www.npmjs.com/package/case-anything
 * @param attributes
 */
export const normalizeBlockAttributes = (
  attributes: BlockAttributes,
): BlockAttributes => {
  if (typeof attributes !== 'object') {
    return {};
  }
  let changed = false;
  const result = { ...attributes };

  for (const key in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, key)) {
      // NOTE: Don't normalize the key that starts with `data-` or `aria-`
      if (key.startsWith('data-') || key.startsWith('aria-')) {
        continue;
      }

      const normalizedKey = snakeCase(key);
      if (normalizedKey !== key) {
        result[normalizedKey] = result[key];
        delete result[key];
        changed = true;
      }
    }
  }

  return changed ? result : attributes;
};
