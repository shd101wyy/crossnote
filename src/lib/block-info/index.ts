import { Attributes } from "../attributes";

export interface BlockInfo {
  attributes: Attributes;
  derivedAttributes?: Attributes;
  language: string;
}

export { default as normalizeBlockInfo } from "./normalize";
export { default as parseBlockInfo } from "./parse";

export const extractCommandFromBlockInfo = (info: BlockInfo) =>
  info.attributes["cmd"] === true ? info.language : info.attributes["cmd"];
