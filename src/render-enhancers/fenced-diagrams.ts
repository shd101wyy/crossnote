// tslint:disable:ban-types no-var-requires
import { Cheerio, CheerioAPI, Element } from "cheerio";
import * as YAML from "yamljs";

import { render as renderDitaa } from "../ditaa";
import computeChecksum from "../lib/compute-checksum";
import { render as renderPlantuml } from "../puml";
import { escapeString } from "../utility";
import { toSVG as vegaToSvg } from "../vega";
import { toSVG as vegaLiteToSvg } from "../vega-lite";
import { Viz } from "../viz";

import {
  BlockAttributes,
  stringifyBlockAttributes,
} from "../lib/block-attributes";
import { BlockInfo } from "../lib/block-info";

const ensureClassInAttributes = (
  attributes: BlockAttributes,
  className: string,
) => {
  const existingClassNames: string = attributes["class"] || "";
  if (existingClassNames.split(" ").indexOf(className) === -1) {
    return {
      ...attributes,
      ["class"]: `${existingClassNames} ${className}`.trim(),
    };
  }
};

// same order as in docs
const supportedLanguages = [
  "flow",
  "sequence",
  "mermaid",
  "puml",
  "plantuml",
  "zenuml",
  "seq",
  "sequence-diagram",
  "wavedrom",
  "graphviz",
  "viz",
  "dot",
  "vega",
  "vega-lite",
  "ditaa",
];

/**
 * This function resolves image paths and render code blocks
 * @param html the html string that we will analyze
 * @return html
 */
export default async function enhance(
  $: CheerioAPI,
  graphsCache: { [key: string]: string },
  fileDirectoryPath: string,
  imageDirectoryPath: string,
  plantumlServer: string,
): Promise<void> {
  const asyncFunctions = [];
  $('[data-role="codeBlock"]').each((i, container) => {
    const $container = $(container);
    if ($container.data("executor")) {
      return;
    }

    const normalizedInfo = $container.data("normalizedInfo") as BlockInfo;
    if (
      normalizedInfo.attributes["literate"] === false ||
      normalizedInfo.attributes["cmd"] === false ||
      supportedLanguages.indexOf(normalizedInfo.language) === -1
    ) {
      return;
    }

    $container.data("executor", "fenced-diagrams");

    if (normalizedInfo.attributes["literate"] === false) {
      return;
    }

    asyncFunctions.push(
      renderDiagram(
        $container,
        normalizedInfo,
        $,
        graphsCache,
        fileDirectoryPath,
        imageDirectoryPath,
        plantumlServer,
      ),
    );
  });
  await Promise.all(asyncFunctions);
}

async function renderDiagram(
  $container: Cheerio<Element>,
  normalizedInfo: BlockInfo,
  $: CheerioAPI,
  graphsCache: { [key: string]: string },
  fileDirectoryPath: string,
  imageDirectoryPath: string,
  plantumlServer: string,
): Promise<void> {
  let $output = null;

  const code = $container.text();
  const checksum = computeChecksum(JSON.stringify(normalizedInfo) + code);
  const diagramInCache: string = graphsCache[checksum];
  try {
    switch (normalizedInfo.language) {
      case "flow":
      case "sequence":
      case "mermaid": {
        // these diagrams are rendered on the client
        $output = `<div ${stringifyBlockAttributes(
          ensureClassInAttributes(
            normalizedInfo.attributes,
            normalizedInfo.language,
          ),
        )}>${escapeString(code)}</div>`;
        break;
      }
      case "zenuml":
      case "seq":
      case "sequence-diagram": {
        // sequence-diagram is a web-component, so we just need to add this tag
        $output = `<div ${stringifyBlockAttributes(
          ensureClassInAttributes(
            normalizedInfo.attributes,
            normalizedInfo.language,
          ),
        )}><sequence-diagram>${code}</sequence-diagram></div>`;
        break;
      }
      case "wavedrom": {
        // wavedrom is also rendered on the client, but using <script>
        $output = `<div ${stringifyBlockAttributes(
          ensureClassInAttributes(
            normalizedInfo.attributes,
            normalizedInfo.language,
          ),
        )}><script type="WaveDrom">${code}</script></div>`;
        break;
      }
      case "puml":
      case "plantuml": {
        let svg = diagramInCache;
        if (!svg) {
          svg = await renderPlantuml(code, fileDirectoryPath, plantumlServer);
          graphsCache[checksum] = svg; // store to new cache
        }
        $output = `<p ${stringifyBlockAttributes(
          normalizedInfo.attributes,
        )}>${svg}</p>`;
        break;
      }
      case "graphviz":
      case "viz":
      case "dot": {
        let svg = diagramInCache;
        if (!svg) {
          const engine = normalizedInfo.attributes["engine"] || "dot";
          svg = await Viz(code, { engine });
          graphsCache[checksum] = svg; // store to new cache
        }
        $output = `<p ${stringifyBlockAttributes(
          normalizedInfo.attributes,
        )}>${svg}</p>`;
        break;
      }
      case "vega":
      case "vega-lite": {
        if (normalizedInfo.attributes["interactive"] === true) {
          const rawSpec = code.trim();
          let spec;
          if (rawSpec[0] !== "{") {
            // yaml
            spec = YAML.parse(rawSpec);
          } else {
            // json
            spec = JSON.parse(rawSpec);
          }
          $output = hiddenCode(
            JSON.stringify(spec).replace("<", "&lt;"),
            normalizedInfo.attributes,
            normalizedInfo.language,
          );
        } else {
          let svg = diagramInCache;
          if (!svg) {
            const vegaFunctionToCall =
              normalizedInfo.language === "vega" ? vegaToSvg : vegaLiteToSvg;
            svg = await vegaFunctionToCall(code, fileDirectoryPath);
            graphsCache[checksum] = svg; // store to new cache
          }
          $output = `<p ${stringifyBlockAttributes(
            normalizedInfo.attributes,
          )}>${svg}</p>`;
        }
        break;
      }
      case "ditaa": {
        // historically, ditaa worked only when cmd=true.
        // Leaving this peculiarity till the next major version
        // for backwards-compatibility.
        if (!normalizedInfo.attributes["cmd"]) {
          break;
        }

        // ditaa diagram
        const args = normalizedInfo.attributes["args"] || [];

        const svg = await renderDitaa(code, args);
        $output = `<p ${stringifyBlockAttributes(
          normalizedInfo.attributes,
        )}>${svg}</p>`;
        break;
      }
    }
  } catch (error) {
    $output = $(`<pre class="language-text">${error.toString()}</pre>`);
  }

  normalizedInfo.attributes["output_first"] === true
    ? $container.before($output)
    : $container.after($output);

  if (
    normalizedInfo.attributes["hide"] !== false &&
    normalizedInfo.attributes["code_block"] !== true
  ) {
    $container.data("hiddenByEnhancer", true);
  }
}

const hiddenCode = (code, attributes, language) =>
  `<p ${stringifyBlockAttributes(
    ensureClassInAttributes(attributes, language),
  )}><span style="display: none">${code}</span></p>`;
