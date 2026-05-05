/**
 * Classify what kind of click action an anchor in rendered preview should
 * trigger. Pure helper so the routing logic can be tested without mounting
 * the full preview React tree.
 */

export type AnchorClickAction =
  | { kind: 'tag'; tag: string }
  | { kind: 'in-page-anchor'; targetId: string }
  | { kind: 'external'; href: string };

/**
 * @param a       the anchor element being clicked
 * @param hrefAttr the raw `href` attribute (NOT yet decoded)
 * @returns the action to dispatch, or `null` if `hrefAttr` is malformed
 *          (e.g. invalid percent-encoding) and the click should be ignored
 */
export function classifyAnchorClick(
  a: HTMLAnchorElement,
  hrefAttr: string,
): AnchorClickAction | null {
  let href: string;
  try {
    href = decodeURIComponent(hrefAttr);
  } catch {
    return null;
  }

  // Tag anchors take precedence: they have either class="tag" or a
  // tag:// scheme href (or both — the markdown-it/transformer renderer
  // emits both, but a host extension may inject just the class).
  if (a.classList.contains('tag') || href.startsWith('tag://')) {
    const tag = a.dataset.tag || href.replace(/^tag:\/\//, '');
    return { kind: 'tag', tag };
  }

  // In-page anchors (#heading) — caller will scroll to the target id.
  if (href && href[0] === '#') {
    return { kind: 'in-page-anchor', targetId: href.slice(1) };
  }

  // Everything else is an external/file link the host should open.
  return { kind: 'external', href };
}
