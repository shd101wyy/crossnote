/**
 * A wrapper of mermaid CLI
 * https://github.com/mermaid-js/mermaid-cli
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import { npxCommand, tempOpen } from '../utility';

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
    // SECURITY: do NOT use `shell: true` (CVE-2022-45026). `pngFilePath` is
    // built from the diagram's `filename` attribute — untrusted markdown — and
    // from the notebook's `imageFolderPath` and project directory, none of
    // which a shell would treat as inert. Spawning without a shell passes
    // every path as a single literal argument. Windows resolves `npx` through
    // `npxCommand()` instead of relying on the shell for it.
    execFileSync(
      npxCommand(),
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
      },
    );
    return pngFilePath;
  } catch (error) {
    throw new Error(
      'mermaid CLI is required to be installed.\nCheck https://github.com/mermaid-js/mermaid-cli for more information.',
      { cause: error },
    );
  }
}
