/*
 * code fences 
 * modified to support math block
 * check https://github.com/jonschlinkert/remarkable/blob/875554aedb84c9dd190de8d0b86c65d2572eadd5/lib/rules.js
 */

import { MarkdownIt } from 'markdown-it'
import { unescapeString, escapeString } from "../utility"
import { MarkdownEngineConfig } from '../markdown-engine-config'
import parseMath from '../parse-math'

export default (md: MarkdownIt, config: MarkdownEngineConfig) => {
  md.renderer.rules.fence = (tokens, idx, options, env, instance) => {
    let token = tokens[idx],
      langName = escapeString(token.info.trim()),
      langClass = ' class="language-' + langName + '" '

    // get code content
    let content = escapeString(token.content)

    // copied from getBreak function.
    let break_ = '\n'
    if (idx < tokens.length && tokens[idx].type === 'list_item_close')
      break_ = ''

    if (langName === 'math') {
      const openTag = config.mathBlockDelimiters[0][0] || '$$'
      const closeTag = config.mathBlockDelimiters[0][1] || '$$'
      const mathExp = unescapeString(content).trim()
      if (!mathExp) return ''
      const mathHtml = parseMath({ openTag, closeTag, content: mathExp, displayMode: true, renderingOption: config.mathRenderingOption })
      return `<p>${mathHtml}</p>`
    }
    return '<pre><code' + langClass + '>' + content + '</code></pre>' + break_
  }
}
