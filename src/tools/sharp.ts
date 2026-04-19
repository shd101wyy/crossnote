export async function svgElementToPNGFile(
  svgElement: string,
  pngFilePath: string,
): Promise<string> {
  try {
    const sharp = (await import('sharp')).default;
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
      'sharp conversion failure\n\nPlease make sure you have libvips installed.',
      { cause: error },
    );
  }

  return pngFilePath;
}
