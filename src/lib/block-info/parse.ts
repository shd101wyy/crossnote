import { BlockInfo } from ".";
import { parseAttributes } from "../attributes";

export default function(raw: string): BlockInfo {
  let language;
  let attributesAsString: string;
  let attributes: object;
  const supportedLanguages = ["plantuml", "puml"];
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
      attributes = parseAttributes(attributesAsString);
    } catch (e) {
      //
    }
  } else {
    attributes = {};
  }
  if (!language && attributes && attributes.hasOwnProperty("class")) {
    if (supportedLanguages.indexOf(attributes["class"]) !== -1) {
      language = attributes["class"];
    }
  }

  return { language, attributes };
}
