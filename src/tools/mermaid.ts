/**
 * A wrapper of mermaid CLI
 * https://github.com/mermaid-js/mermaid-cli
 */

import * as fs from 'fs';
import spawn from 'cross-spawn';
import { tempOpen } from '../utility';

export async function mermaidToPNG(
  mermaidCode: string,
  pngFilePath: string,
  projectDirectoryPath: string,
  themeName: string,
): Promise<string> {
  const info = await tempOpen({
    prefix: 'crossnote-mermaid',
    suffix: '.mmd',
  });
  fs.writeFileSync(info.fd, mermaidCode);
  if (!themeName) {
    themeName = 'null';
  }
  try {
    // SECURITY: do NOT spawn through a shell (CVE-2022-45026). `pngFilePath`
    // is built from the diagram's `filename` attribute — untrusted markdown —
    // and from the notebook's `imageFolderPath` and project directory, none
    // of which a shell would treat as inert. `cross-spawn` keeps every path a
    // single literal argument: a passthrough to `spawnSync` on macOS/Linux,
    // and on Windows — where Node ≥ 18.20.2 refuses to launch `npx.cmd`
    // without a shell (CVE-2024-27980, `EINVAL`) — it routes through
    // `cmd.exe` itself with cmd metacharacters escaped.
    const result = spawn.sync(
      'npx',
      [
        '-p',
        '@mermaid-js/mermaid-cli',
        'mmdc',
        '--theme',
        themeName,
        '--input',
        info.path,
        '--output',
        pngFilePath,
      ],
      {
        cwd: projectDirectoryPath,
        // Match the old `execFileSync` behavior: the CLI's errors stream to
        // our stderr; neither stream is read here.
        stdio: ['ignore', 'ignore', 'inherit'],
      },
    );
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(`mermaid CLI exited with code ${result.status}`);
    }
    return pngFilePath;
  } catch (error) {
    throw new Error(
      'mermaid CLI is required to be installed.\nCheck https://github.com/mermaid-js/mermaid-cli for more information.',
      { cause: error },
    );
  }
}
