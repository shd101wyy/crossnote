import { parseAttributes } from "./attributes";

const liveByDefaultLanguages = [
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
  "wavedrom"
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
  // imply "live" when cmd is defined
  if (info.cmd) {
    info.live = true;
  }

  // make language lowercase
  if (typeof info.lang === "string") {
    info.lang = info.lang.toLowerCase();
  }

  // default to "live" and "hide" for certain langauges (mostly diagrams)
  if (liveByDefaultLanguages.indexOf(info.lang) !== -1) {
    if (!("live" in info)) {
      info.live = true;
    }
    if (!("hide" in info)) {
      info.hide = true;
    }
  }

  return info;
}
