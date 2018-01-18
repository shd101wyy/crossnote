import * as path from "path"
import { extensionDirectoryPath, escapeString } from "./utility"
const katex = require(path.resolve(extensionDirectoryPath, './dependencies/katex/katex.min.js'))
import { MarkdownEngineConfig } from './markdown-engine-config'

type ParseMathArgs = {
  content?: string,
  openTag?: string,
  closeTag?: string,
  displayMode?: boolean,
  config: MarkdownEngineConfig
}

/**
 * 
 * @param content the math expression 
 * @param openTag the open tag, eg: '\('
 * @param closeTag the close tag, eg: '\)'
 * @param displayMode whether to be rendered in display mode
 * @param config 
 */
export default ({ content, openTag, closeTag, displayMode = false, config }: ParseMathArgs) => {
  if (!content) return ''
  if (config.mathRenderingOption === 'KaTeX') {
    try {
      return katex.renderToString(content, { displayMode })
    } catch (error) {
      return `<span style=\"color: #ee7f49; font-weight: 500;\">${error.toString()}</span>`
    }
  } else if (config.mathRenderingOption === 'MathJax') {
    const text = (openTag + content + closeTag).replace(/\n/g, '')
    const tag = displayMode ? 'div' : 'span'
    return `<${tag} class="mathjax-exps">${escapeString(text)}</${tag}>`
  } else {
    return ''
  }
}
