const fs = require('fs');
const os = require('os');
const path = require('path');

// What the tests write to the temp folder goes into a folder of its own, which
// the teardown removes: the exit handler of `src/lib/temp.ts` never runs under
// jest, which gives every test file a `process` of its own.
const tmpDir = path.join(os.tmpdir(), `crossnote-jest-${process.pid}`);

module.exports = () => {
  fs.mkdirSync(tmpDir, { recursive: true });
  process.env.TMPDIR = tmpDir;
};
