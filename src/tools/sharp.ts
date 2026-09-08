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
    // Include the underlying cause in the message: processGraphs embeds
    // this error in the rendered markdown instead of throwing it past the
    // converter, so `${error}` is all users (and tests) ever see.
    const causeMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `sharp conversion failure: ${causeMessage}\n\nPlease make sure you have libvips installed.`,
      { cause: error },
    );
  }

  return pngFilePath;
}
