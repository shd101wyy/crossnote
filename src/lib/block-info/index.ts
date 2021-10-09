import { BlockAttributes } from "../block-attributes";

export interface BlockInfo {
  attributes: BlockAttributes;
  derivedAttributes?: BlockAttributes;
  language: string;
}

export { default as normalizeBlockInfo } from "./normalize";
export { default as parseBlockInfo } from "./parse";

export const extractCommandFromBlockInfo = (info: BlockInfo) =>
  info.attributes["cmd"] === true ? info.language : info.attributes["cmd"];
