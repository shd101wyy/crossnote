/**
 * Convert vega-lite to vega first, then render to svg.
 */
import * as path from "path"
import * as vega from "./vega"
import * as utility from "./utility"

let vl = null

export async function toSVG(spec:string, baseURL:string='') {
  if (!vl) {
    vl = require(path.resolve(utility.extensionDirectoryPath, './dependencies/vega-lite/vega-lite.min.js'))
  }

  return vega.toSVG(JSON.stringify(vl.compile(JSON.parse(spec)).spec), baseURL)
}