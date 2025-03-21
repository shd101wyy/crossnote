import { loader } from 'vega-loader';
import * as YAML from 'yaml';
import * as utility from '../utility';

async function renderVega(spec: object, baseURL): Promise<string> {
  const svgHeader =
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ' +
    '"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';

  if (baseURL && baseURL[baseURL.length - 1] !== '/') {
    baseURL += '/';
  }

  async function helper(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const vega = require('../../dependencies/vega/vega.min.js');

    const view = new vega.View(vega.parse(spec), {
      loader: loader({ baseURL }),
      // logLevel: vega.Warn, // <= this will cause Atom unsafe eval error.
      renderer: 'none',
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
  spec: string = '',
  baseURL: string = '',
): Promise<string> {
  spec = spec.trim();
  let d;
  if (spec[0] !== '{') {
    // yaml
    d = YAML.parse(spec);
  } else {
    // json
    d = JSON.parse(spec);
  }
  return renderVega(d, baseURL);
}
