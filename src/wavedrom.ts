/**
 * A wrapper of wavedrom CLI
 * https://github.com/wavedrom/cli
 */

import * as utility from "./utility";

export async function render(
  wavedromCode: string,
  projectDirectoryPath: string,
): Promise<string> {
  const info = await utility.tempOpen({
    prefix: "mume-wavedrom",
    suffix: ".js",
  });
  await utility.write(info.fd, wavedromCode);
  try {
    const svg = await utility.execFile(
      "npx",
      ["wavedrom-cli", "-i", info.path],
      {
        shell: true,
        cwd: projectDirectoryPath,
      },
    );
    return svg;
  } catch (error) {
    throw new Error(
      "wavedrom CLI is required to be installed.\nCheck http://github.com/wavedrom/cli for more information.\n\n" +
        error.toString(),
    );
  }
}
