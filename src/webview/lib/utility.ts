export function getElementBackgroundColor(element: HTMLElement) {
  const computedStyle = window.getComputedStyle(element);
  const bgColor = computedStyle.backgroundColor;
  return bgColor;
}

export function isBackgroundColorLight(element) {
  // Get the computed background color
  const bgColor = getElementBackgroundColor(element);

  // Function to calculate luminance from a color string
  function calculateLuminance(color) {
    // Remove any spaces and convert to lowercase
    color = color.replace(/\s+/g, '').toLowerCase();

    // If the color starts with "rgb", extract the RGB values
    if (color.startsWith('rgb')) {
      const rgb = color.match(/\d+/g).map(Number);
      const r = rgb[0];
      const g = rgb[1];
      const b = rgb[2];
      return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // If the color starts with "#" (hexadecimal), parse it
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const bigint = parseInt(hex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // If the color is not recognized, return a default value
    return 0;
  }

  // Calculate the luminance
  const luminance = calculateLuminance(bgColor);

  // Compare the luminance to a threshold (e.g., 128)
  return luminance > 128;
}

export function copyTextToClipboard(text: string) {
  const input = document.createElement('textarea');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}

export function copyBlobToClipboard(blob: Blob) {
  navigator.clipboard
    .write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ])
    .catch((error) => {
      console.error(error);
    });
}
