/**
 * A wrapper of wavedrom CLI
 * https://github.com/wavedrom/cli
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import { npxCommand, tempOpen } from '../utility';

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
    // SECURITY: do NOT use `shell: true` — same reasoning as
    // `tools/mermaid.ts`. `projectDirectoryPath` and the temp input path are
    // passed as literal arguments; Windows resolves `npx` via `npxCommand()`.
    const svg = (
      await execFileSync(npxCommand(), ['wavedrom-cli', '-i', info.path], {
        cwd: projectDirectoryPath,
      })
    ).toString('utf-8');
    return svg;
  } catch (error) {
    throw new Error(
      'wavedrom CLI is required to be installed.\nCheck http://github.com/wavedrom/cli for more information.',
      { cause: error },
    );
  }
}
