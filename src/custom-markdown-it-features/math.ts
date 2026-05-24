// tslint:disable-next-line no-implicit-dependencies
import MarkdownIt from 'markdown-it';
import { Notebook } from '../notebook';
import parseMath from '../renderers/parse-math';

export default (md: MarkdownIt, notebook: Notebook) => {
  // ── Block-level math ────────────────────────────────────────────
  // markdown-it's block parser runs *before* the inline parser.
  // Without a block-level rule, multi-line `$$…$$` content (e.g.
  // matrices containing `=` on its own line) is split into a Setext
  // heading + a dangling paragraph by the `lheading` rule.  We insert
  // a rule before `lheading` that consumes `$$` blocks early,
  // preventing Setext / paragraph splitting.
  md.block.ruler.before(
    'lheading',
    'math_block',
    (state, startLine, endLine, silent) => {
      if (notebook.config.mathRenderingOption === 'None') {
        return false;
      }
      const pos = state.bMarks[startLine] + state.tShift[startLine];
      const { mathBlockDelimiters: blockDelimiters } = notebook.config;

      let openTag: string | null = null;
      let closeTag: string | null = null;
      for (const [open, close] of blockDelimiters) {
        if (state.src.slice(pos, pos + open.length) === open) {
          openTag = open;
          closeTag = close;
          break;
        }
      }
      if (!openTag || !closeTag) {
        return false;
      }

      // Scan forward in state.src for the closing delimiter.
      let scanPos = pos + openTag.length;
      let closingPos = -1;
      while (scanPos < state.src.length) {
        if (state.src.startsWith(closeTag, scanPos)) {
          closingPos = scanPos;
          break;
        }
        if (state.src[scanPos] === '\\') {
          scanPos += 1;
        }
        scanPos += 1;
      }
      if (closingPos < 0) {
        return false;
      }

      // Determine which line the closing delimiter ends on so we can
      // advance state.line past the whole block.
      const closeEnd = closingPos + closeTag.length;
      let nextLine = startLine;
      while (nextLine < endLine && state.bMarks[nextLine] <= closeEnd) {
        nextLine++;
      }

      if (silent) {
        return true;
      }

      const content = state.src.slice(pos + openTag.length, closingPos).trim();

      const token = state.push('math_block', 'div', 0);
      token.content = content;
      token.meta = { openTag, closeTag };
      token.map = [startLine, nextLine];

      state.line = nextLine;
      return true;
    },
  );

  md.inline.ruler.before('escape', 'math', (state, silent) => {
    if (notebook.config.mathRenderingOption === 'None') {
      return false;
    }

    let openTag: string | null = null;
    let closeTag: string | null = null;
    let displayMode = true;
    const {
      mathBlockDelimiters: blockDelimiters,
      mathInlineDelimiters: inlineDelimiters,
    } = notebook.config;

    for (const tagPair of blockDelimiters) {
      if (state.src.startsWith(tagPair[0], state.pos)) {
        [openTag, closeTag] = tagPair;
        break;
      }
    }

    if (!openTag) {
      for (const tagPair of inlineDelimiters) {
        if (state.src.startsWith(tagPair[0], state.pos)) {
          [openTag, closeTag] = tagPair;
          displayMode = false;
          break;
        }
      }
    }

    if (!openTag || !closeTag) {
      return false; // not math
    }

    let content: string | null;
    let end = -1;
    let i = state.pos + openTag.length;
    while (i < state.src.length) {
      if (closeTag && state.src.startsWith(closeTag, i)) {
        end = i;
        break;
      } else if (state.src[i] === '\\') {
        i += 1;
      }
      i += 1;
    }

    if (end >= 0) {
      content = state.src.slice(state.pos + openTag.length, end);
    } else {
      return false;
    }

    if (content && !silent) {
      const token = state.push('math', '', 0);
      token.content = content.trim();
      token.meta = token.meta || {};
      token.meta.openTag = openTag;
      token.meta.closeTag = closeTag;
      token.meta.displayMode = displayMode;

      state.pos += content.length + openTag.length + closeTag.length;
      return true;
    } else {
      return false;
    }
  });

  md.renderer.rules.math = (tokens, idx) => {
    const content: string = tokens[idx].content ?? '';
    return parseMath({
      content,
      openTag: tokens[idx].meta.openTag,
      closeTag: tokens[idx].meta.closeTag,
      renderingOption: notebook.config.mathRenderingOption,
      displayMode: tokens[idx].meta.displayMode,
      katexConfig: notebook.config.katexConfig,
    });
  };

  // Render math_block tokens (produced by the block-level rule).
  // These are always display-mode math.
  md.renderer.rules.math_block = (tokens, idx) => {
    const content: string = tokens[idx].content ?? '';
    return parseMath({
      content,
      openTag: tokens[idx].meta.openTag,
      closeTag: tokens[idx].meta.closeTag,
      renderingOption: notebook.config.mathRenderingOption,
      displayMode: true,
      katexConfig: notebook.config.katexConfig,
    });
  };

  // Process math inside `html_block` tokens.  Markdown-it treats a
  // top-level HTML block (e.g. `<table>…</table>` starting at column
  // 0) as verbatim content — its inline parser never sees the
  // contents, so the inline math rule above doesn't fire on
  // `$a^2$` written inside `<td>…</td>`.  This was a regression
  // reported in vscode-mpe#2280: 0.8.22 used to render those
  // formulas; later versions stopped.
  //
  // Hook the html_block render rule, run the rendered content
  // through `renderMathInHtml`, and replace any unprotected math
  // delimiters with the configured renderer's output.  Inline HTML
  // (`<span>$x$</span>`) already worked because markdown-it's
  // inline parser splits around the tags; this fix only touches
  // the block path.
  const defaultHtmlBlock = md.renderer.rules.html_block;
  md.renderer.rules.html_block = (tokens, idx, options, env, self) => {
    const html = defaultHtmlBlock
      ? defaultHtmlBlock(tokens, idx, options, env, self)
      : tokens[idx].content;
    if (notebook.config.mathRenderingOption === 'None') {
      return html;
    }
    return renderMathInHtml(html, notebook);
  };
};

/**
 * Scan a chunk of rendered HTML for math delimiters and replace each
 * match with the rendered output of `parseMath`.  Used to recover
 * math rendering inside `html_block` tokens, where the inline math
 * rule never runs.
 *
 * Skips content inside `<code>`, `<pre>`, `<script>`, and `<style>`
 * tags — those are intentionally verbatim and shouldn't be
 * rewritten (a code sample showing `$x$` in a markdown tutorial
 * shouldn't accidentally render to KaTeX).
 *
 * Tries the configured *block* delimiters first, then *inline*.
 * Most users put `$$ $$` (block) ahead of `$ $` (inline) which
 * means a `$$…$$` pair would otherwise be greedily matched as two
 * adjacent `$…$` inlines.
 */
function renderMathInHtml(html: string, notebook: Notebook): string {
  const {
    mathBlockDelimiters: blockDelimiters,
    mathInlineDelimiters: inlineDelimiters,
  } = notebook.config;
  if (
    (!blockDelimiters || blockDelimiters.length === 0) &&
    (!inlineDelimiters || inlineDelimiters.length === 0)
  ) {
    return html;
  }

  // Split the HTML into "scan" and "skip" segments.  Anything inside
  // `<code>`, `<pre>`, `<script>`, `<style>` (block or inline form)
  // is preserved verbatim; everything else is eligible for math
  // replacement.  The regex is non-greedy and case-insensitive.
  const protectedRe = /<(code|pre|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
  const segments: string[] = [];
  const protectedSegments: string[] = [];
  let lastIndex = 0;
  for (let m = protectedRe.exec(html); m !== null; m = protectedRe.exec(html)) {
    segments.push(html.slice(lastIndex, m.index));
    protectedSegments.push(m[0]);
    lastIndex = m.index + m[0].length;
  }
  segments.push(html.slice(lastIndex));

  const renderSegment = (segment: string): string => {
    let out = segment;
    // Block delimiters first — see comment above.
    for (const [openTag, closeTag] of blockDelimiters || []) {
      out = replaceDelimited(out, openTag, closeTag, true, notebook);
    }
    // After block-delimiter replacement the HTML may contain
    // MathJax placeholders whose inner text still holds `$$…$$`
    // (the original block delimiters).  Protect those placeholders
    // from the inline-delimiter pass so `$` scanning doesn't
    // consume the `$$` inside.
    const placeholderRe =
      /<(div|span)\b[^>]*class\s*=\s*"[^"]*\bmathjax-exps\b[^"]*"[^>]*>[\s\S]*?<\/\1>/gi;
    const segs: string[] = [];
    const prot: string[] = [];
    let last = 0;
    for (
      let m = placeholderRe.exec(out);
      m !== null;
      m = placeholderRe.exec(out)
    ) {
      segs.push(out.slice(last, m.index));
      prot.push(m[0]);
      last = m.index + m[0].length;
    }
    segs.push(out.slice(last));
    // Only scan the unprotected segments for inline delimiters.
    for (const [openTag, closeTag] of inlineDelimiters || []) {
      for (let i = 0; i < segs.length; i++) {
        segs[i] = replaceDelimited(segs[i], openTag, closeTag, false, notebook);
      }
    }
    out = segs[0];
    for (let i = 0; i < prot.length; i++) {
      out += prot[i] + segs[i + 1];
    }
    return out;
  };

  // Reassemble alternating scan/skip segments.
  let result = renderSegment(segments[0]);
  for (let i = 0; i < protectedSegments.length; i++) {
    result += protectedSegments[i] + renderSegment(segments[i + 1]);
  }
  return result;
}

/**
 * Replace every occurrence of `openTag…closeTag` in `html` with the
 * rendered math output.  Content inside the delimiters is treated
 * literally (no nested delimiter parsing) — same semantics the
 * inline rule applies.  Backslash escapes inside the content are
 * skipped over so `\$` doesn't terminate an `$…$` pair.
 */
function replaceDelimited(
  html: string,
  openTag: string,
  closeTag: string,
  displayMode: boolean,
  notebook: Notebook,
): string {
  if (!openTag || !closeTag) return html;
  let out = '';
  let i = 0;
  while (i < html.length) {
    if (!html.startsWith(openTag, i)) {
      out += html[i];
      i += 1;
      continue;
    }
    // Found an opening delimiter — scan for the closing one,
    // honouring `\` escapes inside the content.
    let j = i + openTag.length;
    let end = -1;
    while (j < html.length) {
      if (html.startsWith(closeTag, j)) {
        end = j;
        break;
      } else if (html[j] === '\\') {
        j += 1;
      }
      j += 1;
    }
    if (end < 0) {
      // Unmatched opener — emit literally and move on.
      out += html.slice(i, i + openTag.length);
      i += openTag.length;
      continue;
    }
    const content = html.slice(i + openTag.length, end).trim();
    out += parseMath({
      content,
      openTag,
      closeTag,
      renderingOption: notebook.config.mathRenderingOption,
      displayMode,
      katexConfig: notebook.config.katexConfig,
    });
    i = end + closeTag.length;
  }
  return out;
}
