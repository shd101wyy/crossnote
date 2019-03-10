/**
 * ImageMagick magick command wrapper
 */
import imagemagickCli = require("imagemagick-cli");
import { tempOpen, write } from "./utility";

export async function svgElementToPNGFile(
  svgElement: string,
  pngFilePath: string,
): Promise<string> {
  const info = await tempOpen({ prefix: "mume-svg", suffix: ".svg" });
  await write(info.fd, svgElement); // write svgElement to temp .svg file
  const args = [info.path, pngFilePath];
  try {
    await imagemagickCli.exec(`convert ${args.join(" ")}`);
  } catch (error) {
    throw new Error(
      "imagemagick-cli failure\n" +
        error.toString() +
        "\n\nPlease make sure you have ImageMagick installed.",
    );
  }

  return pngFilePath;
}
