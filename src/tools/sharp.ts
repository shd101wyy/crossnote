import sharp from 'sharp';

export async function svgElementToPNGFile(
  svgElement: string,
  pngFilePath: string,
): Promise<string> {
  try {
    await sharp(
      Buffer.from(
        svgElement.replace(
          /font-family="[\w|\-|,|\s]+"/g,
          'font-family="Arial, sans-serif"',
        ),
      ),
    )
      .png()
      .toFile(pngFilePath);
  } catch (error) {
    throw new Error(
      'sharp conversion failure\n' +
        error.toString() +
        '\n\nPlease make sure you have libvips installed.',
    );
  }

  return pngFilePath;
}
