/**
 * Convert vega-lite to vega first, then render to svg.
 */
import * as YAML from "yamljs";
import * as utility from "./utility";
import * as vega from "./vega";

let vl = null;

export async function toSVG(spec: string = "", baseURL: string = "") {
  if (!vl) {
    vl = utility.loadDependency("vega-lite/vega-lite.min.js");
  }

  spec = spec.trim();
  let d;
  if (spec[0] !== "{") {
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
