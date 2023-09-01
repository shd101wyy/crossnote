import { BlockAttributes } from '../block-attributes/types';

export interface BlockInfo {
  attributes: BlockAttributes;
  derivedAttributes?: BlockAttributes;
  language: string;
}
