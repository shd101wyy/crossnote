import MarkdownIt from 'markdown-it';
import Token from 'markdown-it/lib/token';

export default (md: MarkdownIt) => {
  const _calloutTypes = new Set([
    'summary',
    'abstract',
    'tldr',
    'info',
    'todo',
    'hint',
    'tip',
    'check',
    'done',
    'success',
    'help',
    'question',
    'faq',
    'attention',
    'caution',
    'warning',
    'fail',
    'failure',
    'missing',
    'danger',
    'error',
    'bug',
    'example',
    'cite',
    'quote',
  ]);
  // replace blockquote renderer
  const originalBlockquoteOpen =
    md.renderer.rules.blockquote_open || (() => '<blockquote>\n');
  const originalBlockquoteClose =
    md.renderer.rules.blockquote_close || (() => '</blockquote>\n');

  // find the matching blockquote_close token and mark it
  const markCalloutCloseToken = (
    tokens: Token[],
    openIdx: number,
    calloutTag: 'div' | 'details',
  ) => {
    const openToken = tokens[openIdx];
    const targetLevel = openToken.level;
    for (let i = openIdx + 1; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (token.type === 'blockquote_close' && token.level === targetLevel) {
        token.meta = { ...(token.meta || {}), callout: true, calloutTag };
        return;
      }
    }
  };

  const toTitleCase = (value: string) =>
    value.length > 0 ? `${value[0].toUpperCase()}${value.slice(1)}` : value;

  md.renderer.rules.blockquote_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    // check if it's a callout: see if the first child token is a paragraph and starts with [!
    let isCallout = false;
    let calloutType = 'info';
    let title = '';
    let foldable: 'open' | 'closed' | null = null;

    // find the next non-empty token
    const nextToken = tokens[idx + 1];
    if (nextToken && nextToken.type === 'paragraph_open') {
      const textToken = tokens[idx + 2]; // inline token
      if (textToken && textToken.type === 'inline') {
        const content = textToken.content;
        const match = content.match(
          /^\[!(\w+)\]([+-])?(?:[ \t]+([^\r\n]+))?(?:\r?\n|$)/,
        );
        if (match && _calloutTypes.has(match[1].toLowerCase())) {
          isCallout = true;
          calloutType = match[1].toLowerCase();
          foldable =
            match[2] === '+' ? 'open' : match[2] === '-' ? 'closed' : null;
          title = match[3] || calloutType;

          // remove the callout marker and "\n" from the inline token's children
          textToken.children =
            textToken.children?.filter((_, i) => i > 1) || null;

          const remainingChildren = textToken.children;
          const isEmptyParagraph =
            !remainingChildren ||
            remainingChildren.length === 0 ||
            remainingChildren.every(
              (child) =>
                child.type === 'softbreak' || child.type === 'hardbreak',
            );

          if (isEmptyParagraph) {
            const paragraphOpen = tokens[idx + 1];
            const paragraphClose = tokens[idx + 3];
            if (paragraphOpen) {
              paragraphOpen.hidden = true;
            }
            textToken.hidden = true;
            if (paragraphClose) {
              paragraphClose.hidden = true;
            }
          }
        }
      }
    } else {
      isCallout = false;
    }

    if (isCallout) {
      const calloutTag = foldable ? 'details' : 'div';
      token.meta = { callout: true, type: calloutType, title, calloutTag };
      markCalloutCloseToken(tokens, idx, calloutTag);
      const displayTitle = title || (foldable ? toTitleCase(calloutType) : '');
      if (foldable) {
        const openAttr = foldable === 'open' ? ' open' : '';
        let html = `<details class="callout" data-callout="${calloutType}"${openAttr}>\n`;
        html += `<summary class="callout-title">${md.utils.escapeHtml(displayTitle)}</summary>\n`;
        return html;
      }

      let html = `<div class="callout" data-callout="${calloutType}">\n`;
      if (displayTitle) {
        html += `<div class="callout-title">${md.utils.escapeHtml(displayTitle)}</div>\n`;
      }
      return html;
    } else {
      return originalBlockquoteOpen(tokens, idx, options, env, self);
    }
  };

  md.renderer.rules.blockquote_close = (tokens, idx, options, env, self) => {
    if (tokens[idx].meta?.callout) {
      return tokens[idx].meta?.calloutTag === 'details'
        ? '</details>\n'
        : '</div>\n';
    }
    return originalBlockquoteClose(tokens, idx, options, env, self);
  };
};
