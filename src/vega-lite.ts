/**
 * Convert vega-lite to vega first, then render to svg.
 */
import * as vl from 'vega-lite';
import * as YAML from 'yaml';
import * as utility from './utility';
import * as vega from './vega';

export async function toSVG(spec: string = '', baseURL: string = '') {
  spec = spec.trim();
  let d;
  if (spec[0] !== '{') {
    d = YAML.parse(spec);
  } else {
    // json
    d = JSON.parse(spec);
  }

  return utility.allowUnsafeEval(() => {
    return utility.allowUnsafeNewFunction(() => {
      return vega.toSVG(JSON.stringify(vl.compile(d).spec), baseURL);
    });
  });
}
