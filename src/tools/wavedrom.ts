/**
 * A wrapper of wavedrom CLI
 * https://github.com/wavedrom/cli
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import { tempOpen } from '../utility';

export async function render(
  wavedromCode: string,
  projectDirectoryPath: string,
): Promise<string> {
  const info = await tempOpen({
    prefix: 'crossnote-wavedrom',
    suffix: '.js',
  });
  await fs.writeFileSync(info.fd, wavedromCode);
  try {
    const svg = (
      await execFileSync('npx', ['wavedrom-cli', '-i', info.path], {
        shell: true,
        cwd: projectDirectoryPath,
      })
    ).toString('utf-8');
    return svg;
  } catch (error) {
    throw new Error(
      'wavedrom CLI is required to be installed.\nCheck http://github.com/wavedrom/cli for more information.\n\n' +
        error.toString(),
    );
  }
}
