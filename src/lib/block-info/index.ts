import { Attributes, parseAttributes } from "../attributes";

export interface BlockInfo {
  attributes: Attributes;
  derivedAttributes?: Attributes;
  language: string;
}

export { default as normalizeBlockInfo } from "./normalize";
export { default as parseBlockInfo } from "./parse";
