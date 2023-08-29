import { MD5 } from 'crypto-es/lib/md5.js';

export type HashFunction = (text: string) => string;

const computeChecksum: HashFunction = text => {
  return MD5(text).toString();
};

// md5 can be replaced with a quicker and more robust hash in future
export default computeChecksum;
