/**
 * ImageMagick magick command wrapper
 */
import { execFile, tempOpen, write } from "./utility"

export async function svgElementToPNGFile(svgElement:string, pngFilePath:string):Promise<string> {
  const info = await tempOpen({prefix: "mume-svg", suffix:'.svg'})
  await write(info.fd, svgElement) // write svgElement to temp .svg file
  try {
    await execFile('magick', [info.path, pngFilePath])
  } catch(error) {
    throw new Error ("ImageMagick is required to be installed to convert svg to png.\n" + error.toString());
  }
  return pngFilePath
}
