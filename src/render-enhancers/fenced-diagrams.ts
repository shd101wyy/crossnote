// tslint:disable:ban-types no-var-requires
import { resolve } from "path";
import { render as renderDitaa } from "../ditaa";
import computeChecksum from '../lib/compute-checksum';
import { render as renderPlantuml } from "../puml";
import { extensionDirectoryPath, mkdirp, readFile } from "../utility";
import { toSVG as vegaToSvg } from "../vega";
import { toSVG as vegaLiteToSvg } from "../vega-lite";

const Viz = require(resolve(
  extensionDirectoryPath,
  "./dependencies/viz/viz.js",
));

import { Attributes, stringifyAttributes } from "../lib/attributes";
import { BlockInfo } from "../lib/block-info";

const ensureClassInAttributes = (attributes: Attributes, className: string) => {
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
  "wavedrom",
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
  $,
  graphsCache: { [key: string]: string },
  fileDirectoryPath: string,
  imageDirectoryPath: string,
): Promise<void> {
  const asyncFunctions = [];
  $('[data-role="codeBlock"]').each((i, container) => {
    const $container = $(container);
    if ($container.data("executor")) {
      return;
    }

    const normalizedInfo: BlockInfo = $container.data("normalizedInfo");
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
      ),
    );
  });
  await Promise.all(asyncFunctions);
}

async function renderDiagram(
  $container: Cheerio,
  normalizedInfo: BlockInfo,
  $: CheerioStatic,
  graphsCache: { [key: string]: string },
  fileDirectoryPath: string,
  imageDirectoryPath: string,
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
        $output = `<div ${stringifyAttributes(
          ensureClassInAttributes(
            normalizedInfo.attributes,
            normalizedInfo.language,
          ),
        )}>${code}</div>`;
        break;
      }
      case "wavedrom": {
        // wavedrom is also rendered on the client, but using <script>
        $output = `<div ${stringifyAttributes(
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
          svg = await renderPlantuml(code, fileDirectoryPath);
          graphsCache[checksum] = svg; // store to new cache
        }
        $output = `<p ${stringifyAttributes(
          normalizedInfo.attributes,
        )}>${svg}</p>`;
        break;
      }
      case "viz":
      case "dot": {
        let svg = diagramInCache;
        if (!svg) {
          const engine = normalizedInfo.attributes["engine"] || "dot";
          svg = Viz(code, { engine });
          graphsCache[checksum] = svg; // store to new cache
        }
        $output = `<p ${stringifyAttributes(
          normalizedInfo.attributes,
        )}>${svg}</p>`;
      }
      case "vega":
      case "vega-lite": {
        let svg = diagramInCache;
        if (!svg) {
          const vegaFunctionToCall =
            normalizedInfo.language === "vega" ? vegaToSvg : vegaLiteToSvg;
          svg = await vegaFunctionToCall(code, fileDirectoryPath);
          graphsCache[checksum] = svg; // store to new cache
        }
        $output = `<p ${stringifyAttributes(
          normalizedInfo.attributes,
        )}>${svg}</p>`;
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
        const filename =
          normalizedInfo.attributes["filename"] ||
          `${computeChecksum(`${JSON.stringify(args)} ${code}`)}.png`;
        await mkdirp(imageDirectoryPath);

        const pathToPng = await renderDitaa(
          code,
          args,
          resolve(imageDirectoryPath, filename),
        );
        const pathToPngWithoutVersion = pathToPng.replace(/\?[\d\.]+$/, "");
        const pngAsBase64 = await readFile(pathToPngWithoutVersion, "base64");
        $output = $("<img />").attr(
          "src",
          `data:image/png;charset=utf-8;base64,${pngAsBase64}`,
        );
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
