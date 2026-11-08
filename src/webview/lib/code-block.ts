/**
 * Return the rendered source `<code>` element for a code block highlighted
 * by the preview. Standard fenced blocks are `pre[data-role="codeBlock"]`;
 * executable chunks highlight their wrapper instead, so their input lives
 * under `.input-div`.
 */
export function getCodeBlockSource(
  element: HTMLElement | null,
): HTMLElement | null {
  if (!element) {
    return null;
  }

  if (element.matches('pre[data-role="codeBlock"]')) {
    return element.querySelector<HTMLElement>(':scope > code');
  }

  if (element.classList.contains('code-chunk')) {
    return element.querySelector<HTMLElement>('.input-div > pre > code');
  }

  return null;
}
