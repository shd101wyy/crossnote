import { resolve } from "path";
import { extensionDirectoryPath } from "../utility";

export type HashFunction = (text: string) => string;

// tslint:disable-next-line:no-var-requires
const computeChecksum: HashFunction = require(resolve(
  extensionDirectoryPath,
  "./dependencies/javascript-md5/md5.js",
));

// md5 can be replaced with a quicker and more robust hash in future
export default computeChecksum;
