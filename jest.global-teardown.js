const fs = require('fs');
const path = require('path');

// The folder the setup made is the TMPDIR of this process now.
module.exports = () => {
  const dir = process.env.TMPDIR || '';
  if (path.basename(dir) === `crossnote-jest-${process.pid}`) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};
