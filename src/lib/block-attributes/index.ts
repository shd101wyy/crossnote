export interface BlockAttributes {
  [key: string]: any;
}

export { default as normalizeBlockAttributes } from "./normalize";
export { default as parseBlockAttributes } from "./parse";
export { default as stringifyBlockAttributes } from "./stringify";
