/**
 * Convert vega-lite to vega first, then render to svg.
 */
import * as path from "path"
import * as YAML from "yamljs"
import * as vega from "./vega"
import * as utility from "./utility"

let vl = null

export async function toSVG(spec:string, baseURL:string='', options={}) {
  if (!vl) {
    vl = require(path.resolve(utility.extensionDirectoryPath, './dependencies/vega-lite/vega-lite.min.js'))
  }

  let d
  if (options['type'] === 'yaml') {    
    d = YAML.parse(spec)
  } else { // json
    d = JSON.parse(spec)
  }

  return vega.toSVG(JSON.stringify(vl.compile(d).spec), baseURL)
}