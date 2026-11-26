const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = () => {
  const dir = os.tmpdir();
  if (path.basename(dir) !== `crossnote-jest-${process.pid}`) {
    return;
  }
  fs.rmSync(dir, { recursive: true, force: true });
  // The folder of before, for a run that follows in this process.
  for (const name of process.platform === 'win32'
    ? ['TEMP', 'TMP']
    : ['TMPDIR']) {
    process.env[name] = path.dirname(dir);
  }
};
