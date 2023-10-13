/**
 * Convert vega-lite to vega first, then render to svg.
 */
import * as YAML from 'yaml';
import * as vl from '../../dependencies/vega-lite/vega-lite.min.js';
import * as utility from '../utility';
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return vega.toSVG(JSON.stringify((vl as any).compile(d).spec), baseURL);
    });
  });
}
