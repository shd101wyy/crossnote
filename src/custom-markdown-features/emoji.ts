import * as path from "path"
import { extensionDirectoryPath } from "../utility"
import { MarkdownIt } from 'markdown-it'
import { MarkdownEngineConfig } from '../markdown-engine-config'

export default (md: MarkdownIt, config: MarkdownEngineConfig) => {
  md.use(require(path.resolve(extensionDirectoryPath, './dependencies/markdown-it/extensions/markdown-it-emoji.min.js')))

  md.renderer.rules.emoji = (token, idx) => {
    if (config.enableEmojiSyntax) {
      const t = token[idx],
        markup = t['markup']
      if (markup.startsWith('fa-')) { // font-awesome
        return `<i class="fa ${markup}" aria-hidden="true"></i>`
      } else { // emoji
        return t['content']
      }
    } else {
      return ':' + token[idx]['markup'] + ':'
    }
  }

}
