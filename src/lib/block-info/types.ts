import { BlockAttributes } from '../block-attributes/types.js';

export interface BlockInfo {
  attributes: BlockAttributes;
  derivedAttributes?: BlockAttributes;
  language: string;
}
