/**
 * ditaa API:
 *     https://github.com/stathissideris/ditaa
 */
import * as path from "path";

import * as utility from "./utility";
import computeChecksum from "./lib/compute-checksum";

const CACHE: {
  [key: string]: {
    code: string;
    args: any[];
    svg: string;
  };
} = {};

/**
 * Render ditaa diagrams with `code` to svg.
 * @param code the ditaa code
 * @param args args passed to ditaa.jar
 * @return rendered svg
 */
export async function render(code: string = "", args = []): Promise<string> {
  try {
    const info = await utility.tempOpen({
      prefix: "mume_ditaa",
      suffix: ".ditaa",
    });
    await utility.writeFile(info.fd, code);

    const dest = (
      await utility.tempOpen({
        prefix: "mume_ditaa",
        suffix: ".svg",
      })
    ).path;

    let codes = code;
    if (args.length > 0) {
      codes = args.join() + code;
    }
    const checksum = computeChecksum(codes);

    if (
      checksum in CACHE &&
      CACHE[checksum].code === code &&
      utility.isArrayEqual(args, CACHE[checksum].args)
    ) {
      // already rendered
      return CACHE[checksum].svg;
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
        "--svg",
      ].concat(args),
    );
    const pathToSvgWithoutVersion = dest.replace(/\?[\d\.]+$/, "");
    const svg = await utility.readFile(pathToSvgWithoutVersion);

    // save to cache
    CACHE[checksum] = { code, args, svg };

    return svg;
  } catch (error) {
    throw new Error(`Java is required to be installed.\n${error.toString()}`);
  }
}
