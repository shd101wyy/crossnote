import { BlockAttributes } from "./types";

const stringifyArray = (value: any[]) => {
  const parts = ["["];
  value.forEach((v, i) => {
    if (v instanceof Array) {
      parts.push(stringifyArray(v));
    } else {
      parts.push(JSON.stringify(v));
    }
    if (i + 1 !== value.length) {
      parts.push(", ");
    }
  });
  parts.push("]");

  return parts.join("");
};

/**
 * Convert attributes as JSON object to attributes as string
 * @param attributes
 */
export const stringifyBlockAttributes = (
  attributes: BlockAttributes,
  addCurlyBrackets = false,
): string => {
  const parts: string[] = [];
  for (const key in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, key)) {
      parts.push(" ");
      parts.push(`${key}=`);
      const value = attributes[key];
      if (value instanceof Array) {
        parts.push(stringifyArray(value));
      } else {
        parts.push(JSON.stringify(value));
      }
    }
  }
  parts.shift();
  if (addCurlyBrackets) {
    parts.unshift("{");
    parts.push("}");
  }

  return parts.join("");
};
