import * as path from "path";
import * as YAML from "yamljs";

import * as utility from "./utility";

let vega = null;

// Vega5 uses a dependency injection approach for fetch. Its pre-bundled version
// is targeting browsers, which assumes that fetch is globally available.
// @ts-ignore
// tslint:disable-next-line:no-var-requires
global.fetch = require("node-fetch");

async function renderVega(spec: object, baseURL): Promise<string> {
  const svgHeader =
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ' +
    '"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';

  if (baseURL && baseURL[baseURL.length - 1] !== "/") {
    baseURL += "/";
  }

  async function helper(): Promise<string> {
    const view = new vega.View(vega.parse(spec), {
      loader: vega.loader({ baseURL }),
      // logLevel: vega.Warn, // <= this will cause Atom unsafe eval error.
      renderer: "none",
    }).initialize();
    return svgHeader + (await view.toSVG());
  }

  return await utility.allowUnsafeEvalAndUnsafeNewFunctionAsync(helper);
}

/**
 * Modifed from the `vg2svg` file.
 * @param spec The vega code.
 */
export async function toSVG(
  spec: string = "",
  baseURL: string = "",
): Promise<string> {
  if (!vega) {
    // Because `vega.min.js` has `eval` and `new Function`.
    vega = utility.allowUnsafeEval(() =>
      utility.allowUnsafeNewFunction(() =>
        require(path.resolve(
          utility.extensionDirectoryPath,
          "./dependencies/vega/vega.min.js",
        )),
      ),
    );
  }

  spec = spec.trim();
  let d;
  if (spec[0] !== "{") {
    // yaml
    d = YAML.parse(spec);
  } else {
    // json
    d = JSON.parse(spec);
  }
  return renderVega(d, baseURL);
}
