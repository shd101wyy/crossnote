const fs = require('fs');
const os = require('os');
const path = require('path');

// What the tests write to the temp folder goes into a folder of its own,
// which the teardown removes: the exit handler of `src/lib/temp.ts` never
// runs under jest, which gives every test file a `process` of its own.
// `os.tmpdir()` reads `TMPDIR`, except on Windows, where it reads `TEMP`
// and `TMP`.
module.exports = () => {
  const tmpDir = path.join(os.tmpdir(), `crossnote-jest-${process.pid}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  for (const name of process.platform === 'win32'
    ? ['TEMP', 'TMP']
    : ['TMPDIR']) {
    process.env[name] = tmpDir;
  }
};
