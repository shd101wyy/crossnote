/**
 * ditaa API:
 *     https://github.com/stathissideris/ditaa
 */
import * as path from "path";

import * as utility from "./utility";

const CACHE: {
  [key: string]: {
    code: string;
    args: any[];
    outputDest: string;
  };
} = {};

/**
 * Render ditaa diagrams with `code` to `dest`.
 * @param code the ditaa code
 * @param args args passed to ditaa.jar
 * @param dest where to output the png file. Should be an absolute path.
 * @return the `dest`
 */
export async function render(
  code: string = "",
  args = [],
  dest: string = "",
): Promise<string> {
  try {
    const info = await utility.tempOpen({
      prefix: "mume_ditaa",
      suffix: ".ditaa",
    });
    await utility.writeFile(info.fd, code);

    if (!dest) {
      dest = (
        await utility.tempOpen({
          prefix: "mume_ditaa",
          suffix: ".png",
        })
      ).path;
    }

    if (
      dest in CACHE &&
      CACHE[dest].code === code &&
      utility.isArrayEqual(args, CACHE[dest].args)
    ) {
      // already rendered
      return CACHE[dest].outputDest;
    }

    await utility.execFile(
      "java",
      [
        "-Djava.awt.headless=true",
        "-jar",
        path.resolve(
          utility.extensionDirectoryPath,
          "./dependencies/ditaa/ditaa.jar",
        ),
        info.path,
        dest,
      ].concat(args),
    );
    const outputDest = dest + "?" + Math.random();

    // save to cache
    CACHE[dest] = { code, args, outputDest };

    return outputDest;
  } catch (error) {
    throw new Error(`Java is required to be installed.\n${error.toString()}`);
  }
}
