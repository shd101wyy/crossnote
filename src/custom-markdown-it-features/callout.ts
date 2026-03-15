import MarkdownIt from 'markdown-it';
import Token from 'markdown-it/lib/token';

export default (md: MarkdownIt) => {
  const _calloutTypes = new Set([
    'note',
    'summary',
    'abstract',
    'tldr',
    'info',
    'todo',
    'hint',
    'tip',
    'important',
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
  const _calloutTitleMap: Record<string, string> = {
    note: 'Note',
    summary: 'Summary',
    abstract: 'Abstract',
    tldr: 'TL;DR',
    info: 'Info',
    todo: 'Todo',
    hint: 'Hint',
    tip: 'Tip',
    important: 'Important',
    check: 'Check',
    done: 'Done',
    success: 'Success',
    help: 'Help',
    question: 'Question',
    faq: 'FAQ',
    attention: 'Attention',
    caution: 'Caution',
    warning: 'Warning',
    fail: 'Fail',
    failure: 'Failure',
    missing: 'Missing',
    danger: 'Danger',
    error: 'Error',
    bug: 'Bug',
    example: 'Example',
    cite: 'Cite',
    quote: 'Quote',
  };

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

        // use regex to match the callout pattern: [!type]+ optional title
        const match = content.match(
          /^\[!(\w+)\]([+-])?(?:[ \t]+([^\r\n]+))?(?:\r?\n|$)/,
        );
        if (match && _calloutTypes.has(match[1].toLowerCase())) {
          isCallout = true;
          calloutType = match[1].toLowerCase();
          foldable =
            match[2] === '+' ? 'open' : match[2] === '-' ? 'closed' : null;
          title = match[3] || '';

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
      const displayTitle = title || _calloutTitleMap[calloutType];
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
