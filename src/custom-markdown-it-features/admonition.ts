// Modified from: https://github.com/qjebbs/vscode-markdown-extended/blob/master/src/plugin/markdownItAdmonition.ts
// tslint:disable-next-line no-implicit-dependencies
import { MarkdownIt, Renderer, Token } from "markdown-it";

export default (md: MarkdownIt) => {
  const _marker = 33; /* '!' */
  const _minMarkerLen = 3;
  const _types = [
    "note", // rgba(68,138,255,.1) "\E3C9"
    "summary",
    "abstract",
    "tldr", // rgba(0,176,255,.1) "\E8D2"
    "info",
    "todo", // rgba(0,184,212,.1) "\E88E"
    "tip",
    "hint", // rgba(0,191,165,.1) "\E80E"
    "success",
    "check",
    "done", // rgba(0,200,83,.1) "\E876"
    "question",
    "help",
    "faq", // rgba(100,221,23,.1) "\E887"
    "warning",
    "attention",
    "caution", // rgba(255,145,0,.1) "\E002""\E417"
    "failure",
    "fail",
    "missing", // rgba(255,82,82,.1) "\E14C"
    "danger",
    "error",
    "bug", // rgba(255,23,68,.1) "\E3E7""\E14C""\E868"
    "example",
    "snippet", // rgba(101,31,255,.1) "\E242"
    "quote",
    "cite", // rgba(158, 158, 158, .1) "\E244"
  ];

  function MarkdownItAdmonition() {
    md.block.ruler.after("fence", "admonition", admonition as any, {});
    md.renderer.rules["admonition_open"] = render;
    md.renderer.rules["admonition_title_open"] = render;
    md.renderer.rules["admonition_title_close"] = render;
    md.renderer.rules["admonition_close"] = render;
  }

  function render(
    tokens: Token[],
    idx: number,
    _options: any,
    env: any,
    self: Renderer,
  ) {
    const token = tokens[idx];
    if (token.type === "admonition_open") {
      tokens[idx].attrPush(["class", "admonition " + token.info]);
    } else if (token.type === "admonition_title_open") {
      tokens[idx].attrPush(["class", "admonition-title"]);
    }
    return self.renderToken(tokens, idx, _options);
  }

  function admonition(
    state: any,
    startLine: number,
    endLine: number,
    silent: boolean,
  ) {
    // if it's indented more than 3 spaces, it should be a code block
    if (state.tShift[startLine] - state.blkIndent >= 4) return false;
    let pos: number = state.bMarks[startLine] + state.tShift[startLine];
    let max: number = state.eMarks[startLine];
    const marker: number = state.src.charCodeAt(pos);
    if (marker !== _marker) return false;

    // scan marker length
    let mem = pos;
    pos = state.skipChars(pos, marker);
    const len = pos - mem;
    if (len < _minMarkerLen) return false;

    const markup: string = state.src.slice(mem, pos);
    let type = "";
    let title = "";
    const paramsr: string[] = state.src
      .slice(pos, max)
      .trim()
      .split(" ");
    type = paramsr.shift().toLowerCase();
    title = paramsr.join(" ");
    if (_types.indexOf(type) < 0) type = "note";
    if (!title)
      title = type.substr(0, 1).toUpperCase() + type.substr(1, type.length - 1);

    // Since start is found, we can report success here in validation mode
    if (silent) return true;

    const oldParent = state.parentType;
    const oldLineMax = state.lineMax;
    const oldIndent = state.blkIndent;

    state.blkIndent += 4;

    // search end of block
    let nextLine = startLine;
    for (;;) {
      nextLine++;
      if (nextLine >= endLine) {
        // unclosed block should be autoclosed by end of document.
        // also block seems to be autoclosed by end of parent
        break;
      }
      pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (pos < max && state.sCount[nextLine] < state.blkIndent) {
        // non-empty line with negative indent should stop the list:
        // - !!!
        //  test
        break;
      }
    }

    state.parentType = "admonition";
    // this will prevent lazy continuations from ever going past our end marker
    state.lineMax = nextLine;

    let token = state.push("admonition_open", "div", 1);
    token.markup = markup;
    token.block = true;
    token.info = type;
    token.map = [startLine, startLine + 1];

    if (title !== '""') {
      // admonition title
      token = state.push("admonition_title_open", "p", 1);
      token.markup = markup + " " + type;
      token.map = [startLine, startLine + 1];

      token = state.push("inline", "", 0);
      token.content = title;
      token.map = [startLine, startLine + 1];
      token.children = [];

      token = state.push("admonition_title_close", "p", -1);
      token.markup = markup + " " + type;
    }

    // parse admonition body
    state.md.block.tokenize(state, startLine + 1, nextLine);

    token = state.push("admonition_close", "div", -1);
    token.markup = markup;
    token.map = [startLine, nextLine];
    token.block = true;

    state.parentType = oldParent;
    state.lineMax = oldLineMax;
    state.line = nextLine;
    state.blkIndent = oldIndent;
    return true;
  }

  MarkdownItAdmonition();
};
