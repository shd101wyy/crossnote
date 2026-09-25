/**
 * A wrapper of wavedrom CLI
 * https://github.com/wavedrom/cli
 */

import * as fs from 'fs';
import spawn from 'cross-spawn';
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
    // SECURITY: do NOT spawn through a shell — same reasoning as
    // `tools/mermaid.ts`. `cross-spawn` keeps every argument literal
    // (metacharacter-escaped through `cmd.exe` on Windows, where plain
    // `spawnSync` cannot launch `npx.cmd` at all).
    const result = spawn.sync('npx', ['wavedrom-cli', '-i', info.path], {
      cwd: projectDirectoryPath,
      // stdout carries the SVG; stderr streams to our console like the old
      // `execFileSync` call did.
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(`wavedrom CLI exited with code ${result.status}`);
    }
    return result.stdout.toString('utf-8');
  } catch (error) {
    throw new Error(
      'wavedrom CLI is required to be installed.\nCheck http://github.com/wavedrom/cli for more information.',
      { cause: error },
    );
  }
}
