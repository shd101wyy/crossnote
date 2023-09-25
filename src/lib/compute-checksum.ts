import md5 from 'md5';

export type HashFunction = (text: string) => string;

const computeChecksum: HashFunction = (text) => {
  return md5(text).toString();
};

// md5 can be replaced with a quicker and more robust hash in future
export default computeChecksum;
