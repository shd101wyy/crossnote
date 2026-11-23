/**
 * Run `action` with the presentation's slide transition switched off, then
 * switch the configured one back on. Positioning the first slide must not
 * animate, but afterwards the preview has to animate the way the presentation
 * was configured (vscode-markdown-preview-enhanced#2341).
 */
export function withoutSlideTransition(
  reveal: Pick<Window['Reveal'], 'configure' | 'getConfig'>,
  action: () => void,
): void {
  const { transition = 'default' } = reveal.getConfig();
  reveal.configure({ transition: 'none' });
  try {
    action();
  } finally {
    reveal.configure({ transition });
  }
}
