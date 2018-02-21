import * as snakeCase from "lodash/snakeCase";
import { Attributes } from ".";

/**
 * Walks through attribute keys and makes them snakeCase if needed
 * @param attributes
 */
export default function(attributes: Attributes): Attributes {
  if (typeof attributes !== "object") {
    return {};
  }
  let changed = false;
  const result = { ...attributes };

  for (const key in attributes) {
    if (attributes.hasOwnProperty(key)) {
      const normalizedKey = snakeCase(key);
      if (normalizedKey !== key) {
        result[normalizedKey] = result[key];
        delete result[key];
        changed = true;
      }
    }
  }

  return changed ? result : attributes;
}
