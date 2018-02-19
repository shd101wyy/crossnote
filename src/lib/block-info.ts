import { parseAttributes } from "./attributes";

const literateByDefaultLanguages = [
  "dot",
  "flow",
  "math",
  "mermaid",
  "puml",
  "plantuml",
  "sequence",
  "vega",
  "vega-lite",
  "viz",
  "wavedrom",
];

export function parseBlockInfo(raw: string): { [key: string]: any } {
  let lang;
  let attributesAsStr: string;
  let attributes: object;
  const trimmedParams = raw.trim();
  const match =
    trimmedParams.indexOf("{") !== -1
      ? trimmedParams.match(/^([^\s\{]*)\s*\{(.*?)\}/)
      : trimmedParams.match(/^([^\s]+)\s+(.+?)$/);

  if (match) {
    if (match[1].length) {
      lang = match[1];
    }
    attributesAsStr = match[2];
  } else {
    lang = trimmedParams;
    attributesAsStr = "";
  }

  if (attributesAsStr) {
    try {
      attributes = parseAttributes(attributesAsStr);
    } catch (e) {
      //
    }
  } else {
    attributes = {};
  }

  const info = { lang, ...attributes };
  return info;
}

export function normalizeCodeBlockInfo({ ...info }): { [key: string]: any } {
  // imply "literate" when cmd is defined
  if (info.cmd) {
    info.literate = true;
  }

  // make language lowercase
  if (typeof info.lang === "string") {
    info.lang = info.lang.toLowerCase();
  }

  // default to "literate" and "hide" for certain langauges (mostly diagrams)
  if (literateByDefaultLanguages.indexOf(info.lang) !== -1) {
    if (!("literate" in info)) {
      info.literate = true;
    }
    if (!("hide" in info)) {
      info.hide = true;
    }
  }

  return info;
}
