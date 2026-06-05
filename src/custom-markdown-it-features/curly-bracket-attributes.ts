import MarkdownIt from 'markdown-it';
import Token from 'markdown-it/lib/token';
import { parseBlockAttributes } from '../lib/block-attributes';

export default (md: MarkdownIt) => {
  // Follow the same attributes syntax as pandoc & rmarkdown:
  // Parse the attribute {...} after:
  // - headings:          # This is heading {...}
  // - links and images:  [This is link](link){...}
  // For fenced code block, use the ./code-fences.ts
  md.core.ruler.push('curly_bracket_attributes', (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === 'heading_open') {
        // const headingOpen = tokens[i];
        const headingInline = tokens[i + 1];
        if (headingInline.type === 'inline') {
          processInlineToken(headingInline);
          if (!headingInline.children || headingInline.children.length === 0) {
            continue;
          }
          let matched = false;
          const lastChild =
            headingInline.children[headingInline.children.length - 1];
          if (lastChild.type === 'text') {
            const match = lastChild.content.match(/{([^}]+)}\s*$/);
            if (match) {
              const attributes = parseBlockAttributes(match[1]);
              lastChild.content = lastChild.content.replace(match[0], '');
              for (const key in attributes) {
                tokens[i].attrJoin(key, attributes[key]);
              }
              matched = true;
            }
          }

          // Defense-in-depth: if the {#...} block was split across tokens (e.g.,
          // underscores inside the block were interpreted as emphasis markers by
          // markdown-it), join all text children and find the pattern that way.
          if (!matched && headingInline.children) {
            let combinedText = '';
            for (let j = 0; j < headingInline.children.length; j++) {
              if (headingInline.children[j].type === 'text') {
                combinedText += headingInline.children[j].content;
              }
            }
            const combinedMatch = combinedText.match(/\{([^}]+)\}\s*$/);
            if (combinedMatch) {
              const patternStart = combinedText.length - combinedMatch[0].length;
              let offset = 0;
              let foundIdx = -1;
              let posInToken = -1;
              for (let j = 0; j < headingInline.children.length; j++) {
                const child = headingInline.children[j];
                if (child.type === 'text') {
                  if (patternStart >= offset && patternStart < offset + child.content.length) {
                    foundIdx = j;
                    posInToken = patternStart - offset;
                    break;
                  }
                  offset += child.content.length;
                }
              }
              if (foundIdx >= 0) {
                headingInline.children[foundIdx].content =
                  headingInline.children[foundIdx].content
                    .slice(0, posInToken)
                    .trimEnd();
                headingInline.children.length = foundIdx + 1;
                headingInline.children = headingInline.children.filter(
                  (c) => c.type !== 'text' || c.content.length > 0,
                );
                const attributes = parseBlockAttributes(combinedMatch[1]);
                for (const key in attributes) {
                  tokens[i].attrJoin(key, attributes[key]);
                }
              }
            }
          }
        }
      } else if (tokens[i].type === 'inline') {
        processInlineToken(tokens[i]);
      }

      // For inline code, use the ./code-fences.ts
    }
  });

  function processInlineToken(token: Token) {
    const children = token.children;
    if (!children || children.length === 0) {
      return;
    }
    for (let j = 0; j < children.length; j++) {
      const child = children[j];
      if (child.type === 'image' && children[j + 1]?.type === 'text') {
        const match = children[j + 1].content.match(/^{([^}]+)}/);
        if (match) {
          const attributes = parseBlockAttributes(match[1]);
          children[j + 1].content = children[j + 1].content.replace(
            match[0],
            '',
          );
          for (const key in attributes) {
            child.attrJoin(key, attributes[key]);
          }
        }
      } else if (child.type === 'link_open') {
        // Find the next link_close
        let k = j + 1;
        while (k < children.length && children[k].type !== 'link_close') {
          k++;
        }
        j = k;
        if (k < children.length - 1 && children[k + 1].type === 'text') {
          const match = children[k + 1].content.match(/^{([^}]+)}/);
          if (match) {
            const attributes = parseBlockAttributes(match[1]);
            children[k + 1].content = children[k + 1].content.replace(
              match[0],
              '',
            );
            for (const key in attributes) {
              child.attrJoin(key, attributes[key]);
            }
          }
        }
      }
    }
  }
};
