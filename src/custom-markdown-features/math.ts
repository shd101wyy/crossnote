import { MarkdownIt } from 'markdown-it'
import { MarkdownEngineConfig } from '../markdown-engine-config'
import parseMath from '../parse-math'

export default (md: MarkdownIt, config: MarkdownEngineConfig) => {
  // @ts-ignore
  md.inline.ruler.before('escape', 'math', (state, silent) => {
    if (config.mathRenderingOption === 'None')
      return false

    let openTag = null,
      closeTag = null,
      displayMode = true,
      inline = config.mathInlineDelimiters,
      block = config.mathBlockDelimiters

    for (let a = 0; a < block.length; a++) {
      const b = block[a]
      if (state.src.startsWith(b[0], state.pos)) {
        openTag = b[0]
        closeTag = b[1]
        displayMode = true
        break
      }
    }

    if (!openTag) {
      for (let a = 0; a < inline.length; a++) {
        const i = inline[a]
        if (state.src.startsWith(i[0], state.pos)) {
          openTag = i[0]
          closeTag = i[1]
          displayMode = false
          break
        }
      }
    }

    if (!openTag) return false // not math

    let content = null,
      end = -1

    let i = state.pos + openTag.length
    while (i < state.src.length) {
      if (state.src.startsWith(closeTag, i)) {
        end = i
        break
      } else if (state.src[i] === '\\') {
        i += 1
      }
      i += 1
    }

    if (end >= 0)
      content = state.src.slice(state.pos + openTag.length, end)
    else
      return false

    if (content && !silent) {
      const token = state.push('math')
      token.content = content.trim()
      token.openTag = openTag
      token.closeTag = closeTag
      token.displayMode = displayMode

      state.pos += (content.length + openTag.length + closeTag.length)
      return true
    } else {
      return false
    }
  })

  md.renderer.rules.math = (tokens, idx) => {
    const content: string = tokens[idx] ? tokens[idx].content : null
    return parseMath({ content, renderingOption: config.mathRenderingOption })
  }
}
