import { BlockInfo } from ".";
import { parseBlockAttributes } from "../block-attributes";

export default function(raw: string): BlockInfo {
  let language;
  let attributesAsString: string;
  let attributes: object;
  const trimmedParams = raw.trim();
  const match =
    trimmedParams.indexOf("{") !== -1
      ? trimmedParams.match(/^([^\s\{]*)\s*\{(.*?)\}/)
      : trimmedParams.match(/^([^\s]+)\s+(.+?)$/);

  if (match) {
    if (match[1].length) {
      language = match[1];
    }
    attributesAsString = match[2];
  } else {
    language = trimmedParams;
    attributesAsString = "";
  }

  if (attributesAsString) {
    try {
      attributes = parseBlockAttributes(attributesAsString);
    } catch (e) {
      //
    }
  } else {
    attributes = {};
  }

  return { language, attributes };
}
