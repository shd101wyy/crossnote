import * as path from "path"
import * as fs from "fs"
import * as cheerio from "cheerio"
import * as request from "request"
import {execFile} from "child_process"
import {EOL} from "os"

const matter = require('gray-matter')

import * as plantumlAPI from "./puml"
import * as vegaAPI from "./vega"
import * as vegaLiteAPI from "./vega-lite"
import * as ditaaAPI from "./ditaa"
import * as utility from "./utility"
import {scopeForLanguageName} from "./extension-helper"
import {transformMarkdown, HeadingData} from "./transformer"
import {toc} from "./toc"
import {CustomSubjects} from "./custom-subjects"
import {princeConvert} from "./prince-convert"
import {ebookConvert} from "./ebook-convert"
import {pandocConvert} from "./pandoc-convert"
import {markdownConvert} from "./markdown-convert"
import * as CodeChunkAPI from "./code-chunk"
import {CodeChunkData} from "./code-chunk-data"

const extensionDirectoryPath = utility.extensionDirectoryPath
const katex = require(path.resolve(extensionDirectoryPath, './dependencies/katex/katex.min.js'))
const MarkdownIt = require(path.resolve(extensionDirectoryPath, './dependencies/markdown-it/markdown-it.min.js'))
const md5 = require(path.resolve(extensionDirectoryPath, './dependencies/javascript-md5/md5.js'))
const CryptoJS = require(path.resolve(extensionDirectoryPath, './dependencies/crypto-js/crypto-js.js'))
const Viz = require(path.resolve(extensionDirectoryPath, './dependencies/viz/viz.js'))
const pdf = require(path.resolve(extensionDirectoryPath, './dependencies/node-html-pdf/index.js'))

// import * as Prism from "prismjs"
let Prism = null

// Puppeteer
let puppeteer = null

export interface MarkdownEngineRenderOption {
  useRelativeFilePath: boolean,
  isForPreview: boolean,
  hideFrontMatter: boolean,
  triggeredBySave?: boolean,
  runAllCodeChunks?: boolean
}

export interface MarkdownEngineOutput {
  html:string,
  markdown:string,
  tocHTML:string,
  yamlConfig: any,
  /**
   * imported javascript and css files
   * convert .js file to <script src='...'></script>
   * convert .css file to <link href='...'></link>
   */
  JSAndCssFiles: string[]
 // slideConfigs: Array<object>
}

export interface MarkdownEngineConfig {
  usePandocParser?: boolean
  breakOnSingleNewLine?: boolean
  enableTypographer?: boolean
  enableWikiLinkSyntax?: boolean
  wikiLinkFileExtension?: string
  enableExtendedTableSyntax?: boolean
  protocolsWhiteList?: string
  /**
   * "KaTeX", "MathJax", or "None"
   */
  mathRenderingOption?: string
  mathInlineDelimiters?: string[][]
  mathBlockDelimiters?: string[][]
  codeBlockTheme?: string
  previewTheme?: string
  revealjsTheme?: string
  mermaidTheme?: string
  frontMatterRenderingOption?: string
  imageFolderPath?: string
  printBackground?: boolean
  phantomPath?: string
  pandocPath?: string
  pandocMarkdownFlavor?: string
  pandocArguments?: string[]
  latexEngine?: string
  enableScriptExecution?: boolean
}

export interface HTMLTemplateOption {
  /**
   * whether is for print. 
   */
  isForPrint: boolean
  /**
   * whether is for prince export. 
   */
  isForPrince: boolean
  /**
   * if it's for phantomjs export, what is the export file type.
   * `pdf`, `jpeg`, and `png` are available.
   */
  phantomjsType?: string
  /**
   * whether for offline use
   */
  offline: boolean
  /**
   * whether to embed local images as base64
   */
  embedLocalImages: boolean
  /**
   * whether to embed svg images
   */
  embedSVG?: boolean
}

const defaults = {
  html:         true,        // Enable HTML tags in source
  xhtmlOut:     false,       // Use '/' to close single tags (<br />)
  breaks:       true,        // Convert '\n' in paragraphs into <br>
  langPrefix:   'language-', // CSS language prefix for fenced blocks
  linkify:      true,        // autoconvert URL-like texts to links
  linkTarget:   '',          // set target to open link in
  typographer:  true,        // Enable smartypants and other sweet transforms
}

const defaultMarkdownEngineConfig:MarkdownEngineConfig = {
  usePandocParser: false,
  breakOnSingleNewLine: true,
  enableTypographer: false,
  enableWikiLinkSyntax: true,
  enableExtendedTableSyntax: false, 
  wikiLinkFileExtension: '.md',
  protocolsWhiteList: 'http, https, atom, file',
  mathRenderingOption: 'KaTeX',
  mathInlineDelimiters: [["$", "$"], ["\\(", "\\)"]],
  mathBlockDelimiters: [["$$", "$$"], ["\\[", "\\]"]],
  codeBlockTheme: 'auto.css',
  previewTheme: 'github-light.css',
  revealjsTheme: 'white.css',
  mermaidTheme: 'mermaid.css',
  frontMatterRenderingOption: 'table',
  imageFolderPath: '/assets',
  printBackground: false,
  phantomPath: 'phantomjs',
  pandocPath: 'pandoc',
  pandocMarkdownFlavor: 'markdown-raw_tex+tex_math_single_backslash',
  pandocArguments: [],
  latexEngine: 'pdflatex',
  enableScriptExecution: true
}

let MODIFY_SOURCE:(codeChunkData:CodeChunkData, result:string, filePath:string)=>Promise<string> = null

/**
 * The markdown engine that can be used to parse markdown and export files
 */
export class MarkdownEngine {
  /**
   * Modify markdown source, append `result` after corresponding code chunk.
   * @param codeChunkData 
   * @param result 
   */
  public static async modifySource(codeChunkData:CodeChunkData, result:string, filePath:string) {
    if (MODIFY_SOURCE) {
      await MODIFY_SOURCE(codeChunkData, result, filePath)
    } else {
      // TODO: direcly modify the local file.
    }

    codeChunkData.running = false
    return result
  }

  /**
   * Bind cb to MODIFY_SOURCE
   * @param cb 
   */
  public static onModifySource(cb:(codeChunkData:CodeChunkData, result:string, filePath:string)=>Promise<string>) {
    MODIFY_SOURCE = cb
  }

  /**
   * markdown file path 
   */
  private readonly filePath: string 
  private readonly fileDirectoryPath: string
  private readonly projectDirectoryPath: string

  private _originalConfig: MarkdownEngineConfig
  private config: MarkdownEngineConfig

  private breakOnSingleNewLine: boolean
  private enableTypographer: boolean
  private protocolsWhiteListRegExp:RegExp

  private headings: Array<HeadingData>
  private tocHTML: string

  private md;

  // caches 
  private graphsCache:{[key:string]:string} = {}

  // code chunks 
  private codeChunksData:{[key:string]:CodeChunkData} = {}

  // files cache 
  private filesCache:{[key:string]:string} = {}

  /**
   * cachedHTML is the cache of html generated from the markdown file.  
   */
  // private cachedHTML:string = '';

  /**
   * Check whether the preview is in presentation mode.  
   */
  public isPreviewInPresentationMode:boolean = false

  constructor(args:{
    /**
     * The markdown file path.  
     */
    filePath: string,
    /**
     * The project directory path.  
     */
    projectDirectoryPath: string,
    /**
     * Markdown Engine configuration.
     */
    config ?: MarkdownEngineConfig
  }) {
    this.filePath = args.filePath
    this.fileDirectoryPath = path.dirname(this.filePath)
    this.projectDirectoryPath = args.projectDirectoryPath || this.fileDirectoryPath
    
    this._originalConfig = args.config
    this.resetConfig()

    this.headings = []
    this.tocHTML = ''

    this.md = new MarkdownIt(
      Object.assign({}, defaults, {typographer: this.enableTypographer, breaks: this.breakOnSingleNewLine}))
    
    // markdown-it extensions
    this.md.use(require(path.resolve(extensionDirectoryPath, './dependencies/markdown-it/extensions/markdown-it-footnote.min.js')))
    this.md.use(require(path.resolve(extensionDirectoryPath, './dependencies/markdown-it/extensions/markdown-it-sub.min.js')))
    this.md.use(require(path.resolve(extensionDirectoryPath, './dependencies/markdown-it/extensions/markdown-it-sup.min.js')))
    this.md.use(require(path.resolve(extensionDirectoryPath, './dependencies/markdown-it/extensions/markdown-it-deflist.min.js')))
    this.md.use(require(path.resolve(extensionDirectoryPath, './dependencies/markdown-it/extensions/markdown-it-abbr.min.js')))
    this.md.use(require(path.resolve(extensionDirectoryPath, './dependencies/markdown-it/extensions/markdown-it-mark.min.js')))

    this.configureMarkdownIt()
  }

  /**
   * Reset config
   */
  public resetConfig() {
    // Please notice that ~/.mume/config.json has the highest priority.
    this.config = Object.assign({}, defaultMarkdownEngineConfig, this._originalConfig || {}, utility.configs.config || {}) as MarkdownEngineConfig

    this.initConfig()
  }

  /**
   * Set default values 
   */
  private initConfig() {
    // break on single newline
    this.breakOnSingleNewLine = this.config.breakOnSingleNewLine

    // enable typographer
    this.enableTypographer = this.config.enableTypographer

    // protocal whitelist
    const protocolsWhiteList = this.config.protocolsWhiteList.split(',').map((x)=>x.trim()) || ['http', 'https', 'atom', 'file']
    this.protocolsWhiteListRegExp = new RegExp('^(' + protocolsWhiteList.join('|')+')\:\/\/')  // eg /^(http|https|atom|file)\:\/\//
  }

  public updateConfiguration(config) {
    this.config = Object.assign({}, this.config, config) 
    this.initConfig()

    this.md.set({breaks: this.breakOnSingleNewLine, typographer: this.enableTypographer})
  }

  /*
  public cacheSVG(code:string, svg:string) {
    svg = CryptoJS.AES.decrypt(svg, 'markdown-preview-enhanced').toString(CryptoJS.enc.Utf8)
    // const base64 = new Buffer(svg).toString('base64')
    // const img = `<img src="data:image/svg+xml;charset=utf-8;base64,${base64}">`
    this.graphsCache[md5(code)] = svg
  }
  */

  public cacheCodeChunkResult(id:string, result:string) {
    const codeChunkData = this.codeChunksData[id]
    if (!codeChunkData) return
    codeChunkData.result = CryptoJS.AES.decrypt(result, 'mume').toString(CryptoJS.enc.Utf8)
  }

  /**
   * 
   * @param content the math expression 
   * @param openTag the open tag, eg: '\('
   * @param closeTag the close tag, eg: '\)'
   * @param displayMode whether to be rendered in display mode
   */
  private parseMath({content, openTag, closeTag, displayMode}) {
    if (!content) return ''
    if (this.config.mathRenderingOption[0] === 'K') { // KaTeX
      try {
        return katex.renderToString(content, {displayMode})
      } catch(error) {
        return `<span style=\"color: #ee7f49; font-weight: 500;\">${error.toString()}</span>`
      }
    } else if (this.config.mathRenderingOption[0] === 'M') { // MathJax
      const text = (openTag + content + closeTag).replace(/\n/g, '')
      const tag = displayMode ? 'div' : 'span'
      return `<${tag} class="mathjax-exps">${utility.escapeString(text)}</${tag}>`
    } else {
      return ''
    }
  }

  private configureMarkdownIt() {

    /**
     * math rule
     */
    this.md.inline.ruler.before('escape', 'math', (state, silent)=> {
      if (this.config.mathRenderingOption[0] === 'N')
        return false

      let openTag = null,
          closeTag = null,
          displayMode = true,
          inline = this.config.mathInlineDelimiters,
          block = this.config.mathBlockDelimiters

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

    /**
     * math renderer 
     */
    this.md.renderer.rules.math = (tokens, idx)=> {
      return this.parseMath(tokens[idx] || {})
    }

    /**
     * wikilink rule
     * inline [[]] 
     * [[...]]
     */
    this.md.inline.ruler.before('autolink', 'wikilink',
    (state, silent)=> {
      if (!this.config.enableWikiLinkSyntax || !state.src.startsWith('[[', state.pos))
        return false

      let content = null,
          tag = ']]',
          end = -1

      let i = state.pos + tag.length
      while (i < state.src.length) {
        if (state.src[i] === '\\') {
          i += 1
        } else if (state.src.startsWith(tag, i)) {
          end = i
          break
        }
        i += 1
      }

      if (end >= 0) // found ]]
        content = state.src.slice(state.pos + tag.length, end)
      else
        return false

      if (content && !silent) {
        const token = state.push('wikilink')
        token.content = content 

        state.pos += content.length + 2 * tag.length
        return true
      } else {
        return false
      }
    })

    this.md.renderer.rules.wikilink = (tokens, idx)=> {
      let {content} = tokens[idx]
      if (!content) return

      let splits = content.split('|')
      let linkText = splits[0].trim()
      let wikiLink = splits.length === 2 ? `${splits[1].trim()}${this.config.wikiLinkFileExtension}` : `${linkText.replace(/\s/g, '_')}${this.config.wikiLinkFileExtension}`

      return `<a href="${wikiLink}">${linkText}</a>`
    }

    // code fences 
    // modified to support math block
    // check https://github.com/jonschlinkert/remarkable/blob/875554aedb84c9dd190de8d0b86c65d2572eadd5/lib/rules.js
    this.md.renderer.rules.fence = (tokens, idx, options, env, instance)=> {
      let token = tokens[idx],
          langName = utility.escapeString(token.info.trim()),
          langClass = ' class="language-' + langName + '" '

      // get code content
      let content = utility.escapeString(token.content)

      // copied from getBreak function.
      let break_ = '\n'
      if (idx < tokens.length && tokens[idx].type === 'list_item_close')
        break_ = ''

      if (langName === 'math') {
        const openTag = this.config.mathBlockDelimiters[0][0] || '$$'
        const closeTag = this.config.mathBlockDelimiters[0][1] || '$$'
        const mathExp = utility.unescapeString(content).trim()
        if (!mathExp) return ''
        const mathHtml = this.parseMath({openTag, closeTag, content: mathExp, displayMode: true})
        return `<p>${mathHtml}</p>`
      }
      return '<pre><code' + langClass + '>' + content + '</code></pre>' + break_
    }
  }

  /**
   * Embed local images. Load the image file and display it in base64 format
   */
  private async embedLocalImages($) {
    const asyncFunctions = [] 

    $('img').each((i, img)=> {
      const $img = $(img)
      let src = this.resolveFilePath($img.attr('src'), false)

      let fileProtocalMatch
      if (fileProtocalMatch = src.match(/^file:\/\/+/)) {
        src = utility.removeFileProtocol(src)
        src = src.replace(/\?(\.|\d)+$/, '') // remove cache
        const imageType = path.extname(src).slice(1)
        if (imageType === 'svg') return 
        asyncFunctions.push(new Promise((resolve, reject)=> {
          fs.readFile(decodeURI(src), (error, data)=> {
            if (error) return resolve(null)
            const base64 = new Buffer(data).toString('base64')
            $img.attr('src', `data:image/${imageType};charset=utf-8;base64,${base64}`)
            return resolve(base64)
          })
        }))
      }
    })
    await Promise.all(asyncFunctions)

    return $
  }

  /**
   * Load local svg files and embed them into html directly.  
   * @param $ 
   */
  private async embedSVG($) {
    const asyncFunctions = []
    $('img').each((i, img)=> {
      const $img = $(img)
      let src = this.resolveFilePath($img.attr('src'), false)

      let fileProtocalMatch
      if (fileProtocalMatch = src.match(/^file:\/\/+/)) {
        src = utility.removeFileProtocol(src)
        src = src.replace(/\?(\.|\d)+$/, '') // remove cache
        const imageType = path.extname(src).slice(1)
        if (imageType !== 'svg') return 
          asyncFunctions.push(new Promise((resolve, reject)=> {
            fs.readFile(decodeURI(src), (error, data)=> {
              if (error) return resolve(null)
              const base64 = new Buffer(data).toString('base64')
              $img.attr('src', `data:image/svg+xml;charset=utf-8;base64,${base64}`)
              return resolve(base64)
            })
        }))
      }
    })

    await Promise.all(asyncFunctions)

    return $
  }

  /**
   * Generate scripts string for preview usage.
   */
  public generateScriptsForPreview(isForPresentation=false, yamlConfig={}) {
    let scripts = ""

    // jquery 
    scripts += `<script type="text/javascript" src="file:///${path.resolve(utility.extensionDirectoryPath, './dependencies/jquery/jquery.js')}"></script>`
  
    // jquery contextmenu
    scripts += `<script type="text/javascript" src="file:///${path.resolve(utility.extensionDirectoryPath, './dependencies/jquery-contextmenu/jquery.ui.position.min.js')}"></script>`
    scripts += `<script type="text/javascript" src="file:///${path.resolve(utility.extensionDirectoryPath, './dependencies/jquery-contextmenu/jquery.contextMenu.min.js')}"></script>`

    // jquery modal 
    scripts += `<script type="text/javascript" src="file:///${path.resolve(utility.extensionDirectoryPath, './dependencies/jquery-modal/jquery.modal.min.js')}"></script>`

    // crpto-js
    scripts += `<script type="text/javascript" src="file:///${path.resolve(utility.extensionDirectoryPath, './dependencies/crypto-js/crypto-js.js')}"></script>`

    // mermaid
    scripts += `<script type="text/javascript" src="file:///${path.resolve(utility.extensionDirectoryPath, `./dependencies/mermaid/mermaid.min.js`)}"></script>`

    // wavedrome
    scripts += `<script type="text/javascript" src="file:///${path.resolve(utility.extensionDirectoryPath, './dependencies/wavedrom/default.js')}"></script>`
    scripts += `<script type="text/javascript" src="file:///${path.resolve(utility.extensionDirectoryPath, './dependencies/wavedrom/wavedrom.min.js')}"></script>`

    // math 
    if (this.config.mathRenderingOption === 'MathJax' || this.config.usePandocParser) {
      const mathJaxConfig = utility.configs.mathjaxConfig
      mathJaxConfig['tex2jax'] = mathJaxConfig['tex2jax'] || {}
      mathJaxConfig['tex2jax']['inlineMath'] = this.config.mathInlineDelimiters
      mathJaxConfig['tex2jax']['displayMath'] = this.config.mathBlockDelimiters

      scripts += `<script type="text/javascript" async src="file:///${path.resolve(utility.extensionDirectoryPath, './dependencies/mathjax/MathJax.js')}"></script>`
      scripts += `<script type="text/x-mathjax-config"> MathJax.Hub.Config(${JSON.stringify(mathJaxConfig)}); </script>`
    }

    // reveal.js
    if (isForPresentation) {
      scripts += `<script src='file:///${path.resolve(utility.extensionDirectoryPath, './dependencies/reveal/lib/js/head.min.js')}'></script>`
      scripts += `<script src='file:///${path.resolve(utility.extensionDirectoryPath, './dependencies/reveal/js/reveal.js')}'></script>`
  
      let presentationConfig = yamlConfig['presentation'] || {}
      let dependencies = presentationConfig['dependencies'] || []
      presentationConfig['dependencies'] = dependencies

      scripts += `
      <script>
        Reveal.initialize(${JSON.stringify(Object.assign({margin: 0.1}, presentationConfig))})
      </script>
      `
    }

    // mermaid init 
    scripts += `<script>
${utility.configs.mermaidConfig}
if (window['MERMAID_CONFIG']) {
  window['MERMAID_CONFIG'].startOnLoad = false
  window['MERMAID_CONFIG'].cloneCssStyles = false 
}
mermaidAPI.initialize(window['MERMAID_CONFIG'] || {})

if (typeof(window['Reveal']) !== 'undefined') {
  function mermaidRevealHelper(event) {
    var currentSlide = event.currentSlide
    var diagrams = currentSlide.querySelectorAll('.mermaid')
    for (var i = 0; i < diagrams.length; i++) {
      var diagram = diagrams[i]
      if (!diagram.hasAttribute('data-processed')) {
        mermaid.init(null, diagram, ()=> {
          Reveal.slide(event.indexh, event.indexv)
        })
      }
    }
  }

  Reveal.addEventListener('slidechanged', mermaidRevealHelper)
  Reveal.addEventListener('ready', mermaidRevealHelper)
} else {
  mermaid.init(null, document.getElementsByClassName('mermaid'))
}
</script>`

    // wavedrom init script
    if (isForPresentation) {
      scripts += `<script>
  WaveDrom.ProcessAll()
      </script>`
    }
    
    return scripts
  }

  /**
   * Map preview theme to prism theme.  
   */
  static AutoPrismThemeMap = {
    'atom-dark.css': 'atom-dark.css',
    'atom-light.css': 'atom-light.css',
    'atom-material.css': 'atom-material.css',
    'github-dark.css': 'atom-dark.css',
    'github-light.css': 'github.css',
    'gothic.css': 'github.css',
    'medium.css': 'github.css',
    'monokai.css': 'monokai.css',
    'newsprint.css': 'pen-paper-coffee.css',  // <= this is bad
    'night.css': 'darcula.css', // <= this is bad
    'one-dark.css': 'one-dark.css',
    'one-light.css': 'one-light.css',
    'solarized-light.css': 'solarized-light.css',
    'solarized-dark.css': 'solarized-dark.css'
  }

  static AutoPrismThemeMapForPresentation = {
    'beige.css': 'pen-paper-coffee.css',
    'black.css': 'one-dark.css',
    'blood.css': 'monokai.css',
    'league.css': 'okaidia.css',
    'moon.css': 'funky.css',
    'night.css': 'atom-dark.css',
    'serif.css': 'github.css',
    'simple.css': 'github.css',
    'sky.css': 'default.css',
    'solarized.css': 'solarized-light.css',
    'white.css': 'default.css'
  }

  /**
   * Automatically pick code block theme for preview.  
   */
  private getPrismTheme(isPresentationMode=false) {
    if (this.config.codeBlockTheme === 'auto.css') {
      /**
       * Automatically pick code block theme for preview.  
       */
      if (isPresentationMode) {
        return MarkdownEngine.AutoPrismThemeMapForPresentation[this.config.revealjsTheme] || 'default.css'
      } else {
        return MarkdownEngine.AutoPrismThemeMap[this.config.previewTheme] || 'default.css'
      }
    } else {
      return this.config.codeBlockTheme
    }
  }

  /**
   * Generate styles string for preview usage.
   */
  public generateStylesForPreview(isPresentationMode=false) {
    let styles = ''

    // loading.css 
    styles += `<link rel="stylesheet" href="file:///${path.resolve(utility.extensionDirectoryPath, './styles/loading.css')}">`
  
    // jquery-contextmenu
    styles += `<link rel="stylesheet" href="file:///${path.resolve(utility.extensionDirectoryPath, `./dependencies/jquery-contextmenu/jquery.contextMenu.min.css`)}">`
  
    // jquery-modal 
    styles += `<link rel="stylesheet" href="file:///${path.resolve(utility.extensionDirectoryPath, `./dependencies/jquery-modal/jquery.modal.min.css`)}">`

    // check math 
    if (this.config.mathRenderingOption === "KaTeX" && !this.config.usePandocParser) {
      styles += `<link rel="stylesheet" href="file:///${path.resolve(utility.extensionDirectoryPath, './dependencies/katex/katex.min.css')}">`
    }

    // check mermaid 
    styles += `<link rel="stylesheet" href="file:///${path.resolve(utility.extensionDirectoryPath, `./dependencies/mermaid/${this.config.mermaidTheme}`)}">`

    // check preview theme and revealjs theme
    if (!isPresentationMode) {
      styles += `<link rel="stylesheet" href="file:///${path.resolve(utility.extensionDirectoryPath, `./styles/preview_theme/${this.config.previewTheme}`)}">`
    } else {
      styles += `<link rel="stylesheet" href="file:///${path.resolve(extensionDirectoryPath, './dependencies/reveal/reveal.css')}" >`
      styles += `<link rel="stylesheet" href="file:///${path.resolve(extensionDirectoryPath, `./styles/revealjs_theme/${this.config.revealjsTheme}`)}" >`
    }

    // check prism 
    styles += `<link rel="stylesheet" href="file:///${path.resolve(utility.extensionDirectoryPath, `./styles/prism_theme/${this.getPrismTheme(isPresentationMode)}`)}">`

    // style template
    styles += `<link rel="stylesheet" media="screen" href="${path.resolve(utility.extensionDirectoryPath, './styles/style-template.css')}">`

    // global styles
    styles += `<style>${utility.configs.globalStyle}</style>`

    return styles  
  }

  /**
   * Generate <style> and <link> string from an array of file paths.
   * @param JSAndCssFiles 
   */
  private generateJSAndCssFilesForPreview(JSAndCssFiles=[]) {
    let output = ''
    JSAndCssFiles.forEach((sourcePath)=> {
      let absoluteFilePath = sourcePath
      if (sourcePath[0] === '/') {
        absoluteFilePath = 'file:///' + path.resolve(this.projectDirectoryPath, '.' + sourcePath)
      } else if (sourcePath.match(/^file:\/\//) || sourcePath.match(/^https?\:\/\//)) {
        // do nothing 
      } else {
        absoluteFilePath = 'file:///' + path.resolve(this.fileDirectoryPath, sourcePath)
      }

      if (absoluteFilePath.endsWith('.js')) {
        output += `<script type="text/javascript" src="${absoluteFilePath}"></script>`
      } else { // css
        output += `<link rel="stylesheet" href="${absoluteFilePath}">`
      }
    })
    return output
  }

  /**
   * Generate html template for preview.
   */
  public async generateHTMLTemplateForPreview({inputString="", body='', webviewScript='', scripts="", styles="", head=`<base href="${this.filePath}">`, config={}}):Promise<string> {
    if (!inputString)  
      inputString = fs.readFileSync(this.filePath, {encoding:'utf-8'})
    if (!webviewScript) 
      webviewScript = path.resolve(utility.extensionDirectoryPath, './out/src/webview.js')
    if (!body) // default body
      body = `
        <div class="refreshing-icon"></div>

        <div id="md-toolbar">
          <div class="back-to-top-btn btn"><span>⬆︎</span></div>
          <div class="refresh-btn btn"><span>⟳︎</span></div>
          <div class="sidebar-toc-btn btn"><span>§</span></div>
        </div>

        <div id="image-helper-view">
          <h4>Image Helper</h4>
          <div class="upload-div">
            <label>Link</label>
            <input type="text" class="url-editor" placeholder="enter image URL here, then press \'Enter\' to insert.">

            <div class="splitter"></div>

            <label class="copy-label">Copy image to root /assets folder</label>
            <div class="drop-area paster">
              <p class="paster"> Click me to browse image file </p>
              <input class="file-uploader paster" type="file" style="display:none;" multiple="multiple" >
            </div>

            <div class="splitter"></div>

            <label>Upload</label>
            <div class="drop-area uploader">
              <p class="uploader">Click me to browse image file</p>
              <input class="file-uploader uploader" type="file" style="display:none;" multiple="multiple" >
            </div>
            <div class="uploader-choice">
              <span>use</span>
              <select class="uploader-select">
                <option>imgur</option>
                <option>sm.ms</option>
              </select>
              <span> to upload images</span>
            </div>
            <a href="#" id="show-uploaded-image-history">Show history</a>
          </div>
        </div>

        <!-- <div class="markdown-spinner"> Loading Markdown\u2026 </div> -->
    `

    const {yamlConfig, JSAndCssFiles, html} = await this.parseMD(inputString, {isForPreview: true, useRelativeFilePath: false, hideFrontMatter: false})
    const isPresentationMode = yamlConfig['isPresentationMode']

    const htmlTemplate = `<!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="Content-type" content="text/html;charset=UTF-8">
        <meta id="mume-data" data-config="${utility.escapeString(JSON.stringify(Object.assign({}, this.config, config)))}" data-time="${Date.now()}">
        <meta charset="UTF-8">

        ${this.generateStylesForPreview(isPresentationMode)}
        ${styles}
        <link rel="stylesheet" href="file:///${path.resolve(utility.extensionDirectoryPath , './styles/preview.css')}">

        ${this.generateJSAndCssFilesForPreview(JSAndCssFiles)}
        ${head}        
      </head>
      <body class="preview-container">
        <div class="mume markdown-preview" for="preview" ${isPresentationMode ? 'data-presentation-mode' : ''}>
          ${html}
        </div>
        ${body}
      </body>
      ${this.generateScriptsForPreview(isPresentationMode, yamlConfig)}
      ${scripts}
      <script src="${webviewScript}"></script>
      </html>`
    
      return htmlTemplate
  }

  /**
   * Generate HTML content
   * @param html: this is the final content you want to put. 
   * @param yamlConfig: this is the front matter.
   * @param option: HTMLTemplateOption
   */
  public async generateHTMLTemplateForExport(html:string, yamlConfig={}, options:HTMLTemplateOption):Promise<string> {
    // get `id` and `class`
    const elementId = yamlConfig['id'] || ''
    let elementClass = yamlConfig['class'] || []
    if (typeof(elementClass) === 'string')
      elementClass = [elementClass]
    elementClass = elementClass.join(' ')

    // math style and script
    let mathStyle = ''
    if (this.config.mathRenderingOption === 'MathJax' || this.config.usePandocParser) {
      const inline = this.config.mathInlineDelimiters
      const block = this.config.mathBlockDelimiters

      // TODO
      const mathJaxConfig = await utility.getMathJaxConfig()
      mathJaxConfig['tex2jax']['inlineMath'] = this.config.mathInlineDelimiters
      mathJaxConfig['tex2jax']['displayMath'] = this.config.mathBlockDelimiters

      if (options.offline) {
        mathStyle = `
        <script type="text/x-mathjax-config">
          MathJax.Hub.Config(${JSON.stringify(mathJaxConfig)});
        </script>
        <script type="text/javascript" async src="file:///${path.resolve(extensionDirectoryPath, './dependencies/mathjax/MathJax.js')}"></script>
        `
      } else {
        mathStyle = `
        <script type="text/x-mathjax-config">
          MathJax.Hub.Config(${JSON.stringify(mathJaxConfig)});
        </script>
        <script type="text/javascript" async src="https://cdn.rawgit.com/mathjax/MathJax/2.7.1/MathJax.js"></script>
        `
      }
    } else if (this.config.mathRenderingOption === 'KaTeX') {
      if (options.offline) {
        mathStyle = `<link rel="stylesheet" href="file:///${path.resolve(extensionDirectoryPath, './dependencies/katex/katex.min.css')}">`
      } else {
        mathStyle = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.8.2/katex.min.css">`
      }
    } else {
      mathStyle = ''
    }

    // mermaid 
    let mermaidScript = ''
    let mermaidStyle = ''
    let mermaidInitScript = ''
    if (html.indexOf('<div class="mermaid">') >= 0) {
      if (options.offline) {
        mermaidScript = `<script type="text/javascript" src="file:///${path.resolve(extensionDirectoryPath, './dependencies/mermaid/mermaid.min.js')}"></script>`
        mermaidStyle = `<link rel="stylesheet" href="file:///${path.resolve(extensionDirectoryPath, `./dependencies/mermaid/${this.config.mermaidTheme}`)}">`
      } else {
        mermaidScript = `<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/7.0.0/mermaid.min.js"></script>`
        mermaidStyle = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mermaid/7.0.0/${this.config.mermaidTheme.replace('.css', '.min.css')}">`
      }
      let mermaidConfig:string = await utility.getMermaidConfig()
      mermaidInitScript += `<script>
${mermaidConfig}
if (window['MERMAID_CONFIG']) {
  window['MERMAID_CONFIG'].startOnLoad = false
  window['MERMAID_CONFIG'].cloneCssStyles = false 
}
mermaidAPI.initialize(window['MERMAID_CONFIG'] || {})

if (typeof(window['Reveal']) !== 'undefined') {
  function mermaidRevealHelper(event) {
    var currentSlide = event.currentSlide
    var diagrams = currentSlide.querySelectorAll('.mermaid')
    for (var i = 0; i < diagrams.length; i++) {
      var diagram = diagrams[i]
      if (!diagram.hasAttribute('data-processed')) {
        mermaid.init(null, diagram, ()=> {
          Reveal.slide(event.indexh, event.indexv)
        })
      }
    }
  }

  Reveal.addEventListener('slidechanged', mermaidRevealHelper)
  Reveal.addEventListener('ready', mermaidRevealHelper)
} else {
  mermaid.init(null, document.getElementsByClassName('mermaid'))
}
</script>`
    }
    // wavedrom 
    let wavedromScript = ``,
        wavedromInitScript = ``
    if (html.indexOf('<div class="wavedrom">') >= 0) {
      if (options.offline) {
        wavedromScript += `<script type="text/javascript" src="file:///${path.resolve(utility.extensionDirectoryPath, './dependencies/wavedrom/default.js')}"></script>`
        wavedromScript += `<script type="text/javascript" src="file:///${path.resolve(utility.extensionDirectoryPath, './dependencies/wavedrom/wavedrom.min.js')}"></script>`
      } else {
        wavedromScript += `<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/wavedrom/1.4.1/skins/default.js"></script>`
        wavedromScript += `<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/wavedrom/1.4.1/wavedrom.min.js"></script>`
      }
      wavedromInitScript = `<script>WaveDrom.ProcessAll()</script>`
    }


    // presentation
    let presentationScript = '',
        presentationStyle = '',
        presentationInitScript = ''
    if (yamlConfig["isPresentationMode"]) {
      if (options.offline) {
        presentationScript = `
        <script src='file:///${path.resolve(extensionDirectoryPath, './dependencies/reveal/lib/js/head.min.js')}'></script>
        <script src='file:///${path.resolve(extensionDirectoryPath, './dependencies/reveal/js/reveal.js')}'></script>`
      } else {
        presentationScript = `
        <script src='https://cdnjs.cloudflare.com/ajax/libs/reveal.js/3.4.1/lib/js/head.min.js'></script>
        <script src='https://cdnjs.cloudflare.com/ajax/libs/reveal.js/3.4.1/js/reveal.min.js'></script>`
      }

      let presentationConfig = yamlConfig['presentation'] || {}
      let dependencies = presentationConfig['dependencies'] || []
      if (presentationConfig['enableSpeakerNotes']) {
        if (options.offline)
          dependencies.push({src: path.resolve(extensionDirectoryPath, './dependencies/reveal/plugin/notes/notes.js'), async: true})
        else
          dependencies.push({src: 'revealjs_deps/notes.js', async: true}) // TODO: copy notes.js file to corresponding folder
      }
      presentationConfig['dependencies'] = dependencies

      presentationStyle = `
      <style>
      ${fs.readFileSync(path.resolve(extensionDirectoryPath, './dependencies/reveal/reveal.css'))}
      ${options.isForPrint ? fs.readFileSync(path.resolve(extensionDirectoryPath, './dependencies/reveal/pdf.css')) : ''}
      </style>
      `
      presentationInitScript = `
      <script>
        Reveal.initialize(${JSON.stringify(Object.assign({margin: 0.1}, presentationConfig))})
      </script>
      `
    }

    // prince 
    let princeClass = ""
    if (options.isForPrince) {
      princeClass = "prince"
    }

    // phantomjs 
    let phantomjsClass = ""
    if (options.phantomjsType) {
      if (options.phantomjsType === 'pdf') {
        phantomjsClass = 'phantomjs-pdf'
      } else {
        phantomjsClass = 'phantomjs-image'
      }
    }

    let title = path.basename(this.filePath)
    title = title.slice(0, title.length - path.extname(title).length) // remove '.md'

    // prism and preview theme 
    let styleCSS = ""
    try{
      // prism *.css
      styleCSS += (!this.config.printBackground && !yamlConfig['print_background'] && !yamlConfig["isPresentationMode"]) ?
      await utility.readFile(path.resolve(extensionDirectoryPath, `./styles/prism_theme/github.css`), {encoding:'utf-8'}) :
      await utility.readFile(path.resolve(extensionDirectoryPath, `./styles/prism_theme/${this.getPrismTheme(yamlConfig["isPresentationMode"])}`), {encoding:'utf-8'})
      
      if (yamlConfig["isPresentationMode"]) {
        styleCSS += await utility.readFile(path.resolve(extensionDirectoryPath, `./styles/revealjs_theme/${this.config.revealjsTheme}`), {encoding:'utf-8'})
      } else {
        // preview theme
        styleCSS += (!this.config.printBackground && !yamlConfig['print_background']) ? 
          await utility.readFile(path.resolve(extensionDirectoryPath, `./styles/preview_theme/github-light.css`), {encoding:'utf-8'}) :
          await utility.readFile(path.resolve(extensionDirectoryPath, `./styles/preview_theme/${this.config.previewTheme}`), {encoding:'utf-8'})
      }
      
      // style template
      styleCSS += await utility.readFile(path.resolve(extensionDirectoryPath, './styles/style-template.css'), {encoding:'utf-8'})
    } catch(e) {
      styleCSS = ''
    }

    // global styles 
    let globalStyles = ""
    try {
      globalStyles = await utility.getGlobalStyles()
    } catch(error) {
      // ignore it 
    }

    // sidebar toc
    let sidebarTOC = '',
        sidebarTOCScript = '',
        sidebarTOCBtn = ''
    if (!yamlConfig["isPresentationMode"] && !options.isForPrint && ( 
      (!('html' in yamlConfig)) || 
      (yamlConfig['html'] && yamlConfig['html']['toc'] !== false))) { // enable sidebar toc by default
      sidebarTOC = `<div class="md-sidebar-toc">${this.tocHTML}</div>`
      sidebarTOCBtn = '<a id="sidebar-toc-btn">≡</a>'
      // toggle sidebar toc
      // If yamlConfig['html']['toc'], then display sidebar TOC on startup.
      sidebarTOCScript = `
<script>
${(yamlConfig['html'] && yamlConfig['html']['toc']) ? `document.body.setAttribute('html-show-sidebar-toc', true)` : ''}
var sidebarTOCBtn = document.getElementById('sidebar-toc-btn')
sidebarTOCBtn.addEventListener('click', function(event) {
  event.stopPropagation()
  if (document.body.hasAttribute('html-show-sidebar-toc')) {
    document.body.removeAttribute('html-show-sidebar-toc')
  } else {
    document.body.setAttribute('html-show-sidebar-toc', true)
  }
})
</script>
      `
    }

    // task list script
    // has to use `var` instead of `let` because `phantomjs` might cause issue.  
    const taskListScript = `<script>
(function bindTaskListEvent() {
  var taskListItemCheckboxes = document.body.getElementsByClassName('task-list-item-checkbox')
  for (var i = 0; i < taskListItemCheckboxes.length; i++) {
    var checkbox = taskListItemCheckboxes[i]
    var li = checkbox.parentElement
    if (li.tagName !== 'LI') li = li.parentElement
    if (li.tagName === 'LI') {
      li.classList.add('task-list-item')
    }
  }
}())    
</script>`

    html = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${presentationStyle}
      ${mathStyle}
      ${mermaidStyle}

      ${presentationScript}
      ${mermaidScript}
      ${wavedromScript}

      <style> 
      ${styleCSS} 
      ${globalStyles} 
      </style>
    </head>
    <body ${options.isForPrint ? '' : 'for="html-export"'} ${yamlConfig["isPresentationMode"] ? 'data-presentation-mode' : ''}>
      <div class="mume markdown-preview ${princeClass} ${phantomjsClass} ${elementClass}" ${yamlConfig["isPresentationMode"] ? 'data-presentation-mode' : ''} ${elementId ? `id="${elementId}"` : ''}>
      ${html}
      </div>
      ${sidebarTOC}
      ${sidebarTOCBtn}
    </body>
    ${presentationInitScript}
    ${mermaidInitScript}
    ${wavedromInitScript}
    ${taskListScript}
    ${sidebarTOCScript}
  </html>
    `

    if (options.embedLocalImages) { // embed local images as Data URI
      let $ = cheerio.load(html, {xmlMode: true})
      $ = await this.embedLocalImages($)
      html = $.html()
    }

    if (options.embedSVG) { // embed svg 
      let $ = cheerio.load(html, {xmlMode: true})
      $ = await this.embedSVG($)
      html = $.html()
    }
    
    return html.trim()
  }

  /**
   * generate HTML file and open it in browser
   */
  public async openInBrowser({runAllCodeChunks=false}):Promise<void> {
    const inputString = await utility.readFile(this.filePath, {encoding:'utf-8'})
    let {html, yamlConfig} = await this.parseMD(inputString, {useRelativeFilePath: false, hideFrontMatter: true, isForPreview: false, runAllCodeChunks})
    html = await this.generateHTMLTemplateForExport(html, yamlConfig, 
                                    {isForPrint: false, isForPrince: false, offline: true, embedLocalImages: false} )   
    // create temp file
    const info = await utility.tempOpen({
      prefix: 'mume',
      suffix: '.html'
    })

    await utility.write(info.fd, html)
    
    // open in browser
    utility.openFile(info.path)
    return 
  }

  /**
   * 
   * @param filePath 
   * @return dest if success, error if failure
   */
  public async htmlExport({offline=false, runAllCodeChunks=false}):Promise<string> {
    const inputString = await utility.readFile(this.filePath, {encoding:'utf-8'})
    let {html, yamlConfig} = await this.parseMD(inputString, {useRelativeFilePath:true, hideFrontMatter:true, isForPreview: false, runAllCodeChunks})
    const htmlConfig = yamlConfig['html'] || {}
    if ('offline' in htmlConfig) {
        offline = htmlConfig['offline']
    }
    let embedLocalImages = htmlConfig['embed_local_images'] // <= embedLocalImages is disabled by default.

    let embedSVG = true // <= embedSvg is enabled by default.
    if ('embed_svg' in htmlConfig) {
      embedSVG = htmlConfig['embed_svg']
    } 
    
    let dest = this.filePath
    let extname = path.extname(dest) 
    dest = dest.replace(new RegExp(extname+'$'), '.html')

    html = await this.generateHTMLTemplateForExport(html, yamlConfig, {
        isForPrint: false, 
        isForPrince: false,
        embedLocalImages: embedLocalImages,
        offline: offline,
        embedSVG: embedSVG
    })

    const htmlFileName = path.basename(dest)

    // presentation speaker notes
    // copy dependency files
    if (!offline && html.indexOf('[{"src":"revealjs_deps/notes.js","async":true}]') >= 0) {
      const depsDirName = path.resolve(path.dirname(dest), 'revealjs_deps')
      if (!fs.existsSync(depsDirName)) {
        fs.mkdirSync(depsDirName)
      }
      fs.createReadStream(path.resolve(extensionDirectoryPath, './dependencies/reveal/plugin/notes/notes.js')).pipe(fs.createWriteStream(path.resolve(depsDirName, 'notes.js')))
      fs.createReadStream(path.resolve(extensionDirectoryPath, './dependencies/reveal/plugin/notes/notes.html')).pipe(fs.createWriteStream(path.resolve(depsDirName, 'notes.html')))
    }

    await utility.writeFile(dest, html)
    return dest
  }

  /**
   * Chrome (puppeteer) file export
   */
  public async chromeExport({fileType="pdf", runAllCodeChunks=false, openFileAfterGeneration=false}):Promise<string> {
    const inputString = await utility.readFile(this.filePath, {encoding:'utf-8'})
    let {html, yamlConfig} = await this.parseMD(inputString, {useRelativeFilePath:false, hideFrontMatter:true, isForPreview: false, runAllCodeChunks})
    let dest = this.filePath
    let extname = path.extname(dest)
    dest = dest.replace(new RegExp(extname + '$'), '.' + fileType)

    html = await this.generateHTMLTemplateForExport(html, yamlConfig, {
      isForPrint: true,
      isForPrince: false,
      embedLocalImages: false,
      offline: true
    })

    if (!puppeteer) {
      try {
        // const requireg = require('requireg')
        // console.log(requireg)
        const globalNodeModules = require('global-node-modules')
        const nodeModulePath = await globalNodeModules()
        puppeteer = require(path.resolve(nodeModulePath, './puppeteer'))
      } catch(error) {
        throw "Puppeteer (Headless Chrome) is required to be installed globally.\nPlease run `npm install -g puppeteer` in your terminal.  \n"
      }
    }

    const info = await utility.tempOpen({prefix: 'mume', suffix: '.html'})
    await utility.writeFile(info.fd, html)

    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    let loadPath = 'file:///' + info.path + (yamlConfig['isPresentationMode'] ? '?print-pdf' : '')
    await page.goto(loadPath)

    const puppeteerConfig = Object.assign(
      { 
        path: dest
      }, 
      yamlConfig['isPresentationMode'] ? {} : {
        margin: {
          top: '1cm',
          bottom: '1cm',
          left: '1cm',
          right: '1cm'
        }
      },
      yamlConfig['chrome'] || {})

    if (fileType === 'pdf') {
      await page.pdf(puppeteerConfig)
    } else {
      puppeteerConfig['fullPage'] = true // <= set to fullPage by default
      await page.screenshot(puppeteerConfig)      
    }
    browser.close()

    if (openFileAfterGeneration) utility.openFile(dest)      
    return dest
  }

  /**
   * Phantomjs file export
   * The config could be set by front-matter. 
   * Check https://github.com/marcbachmann/node-html-pdf website.  
   * @param fileType the export file type 
   */
  public async phantomjsExport({fileType="pdf", runAllCodeChunks=false, openFileAfterGeneration=false}):Promise<string> {
    const inputString = await utility.readFile(this.filePath, {encoding:'utf-8'})
    let {html, yamlConfig} = await this.parseMD(inputString, {useRelativeFilePath:false, hideFrontMatter:true, isForPreview: false, runAllCodeChunks})
    let dest = this.filePath
    let extname = path.extname(dest)
    dest = dest.replace(new RegExp(extname + '$'), '.' + fileType)

    html = await this.generateHTMLTemplateForExport(html, yamlConfig, {
      isForPrint: true,
      isForPrince: false,
      embedLocalImages: false,
      offline: true,
      phantomjsType: fileType
    })

    // TODO: phantomjs reveal.js export directly.
    if (yamlConfig['isPresentationMode']) { // reveal.js presentation
      const info = await utility.tempOpen({prefix: 'mume', suffix: '.html'})
      await utility.writeFile(info.fd, html)
      const url = 'file:///' + info.path + '?print-pdf'
      return url
    }

    const phantomjsConfig = Object.assign({
      type: fileType,
      border: '1cm',
      quality: '75',
      script: path.join(extensionDirectoryPath, './dependencies/phantomjs/pdf_a4_portrait.js')
    }, await utility.getPhantomjsConfig(), yamlConfig['phantomjs'] || yamlConfig['phantom'] || {})
    if (!phantomjsConfig['phantomPath']) {
      phantomjsConfig['phantomPath'] = this.config.phantomPath
    }

    return await new Promise<string>((resolve, reject)=> {
      try {
        pdf.create(html, phantomjsConfig)
        .toFile(dest, (error, res)=> {
          if (error) {
            return reject(error)
          } else {
            if (openFileAfterGeneration) utility.openFile(dest)
            return resolve(dest)
          }
        })
      } catch(error) {
        let errorMessage = error.toString()
        if (errorMessage.indexOf("Error: write EPIPE") >= 0) {
          errorMessage = `"phantomjs" is required to be installed.`
        }
        return reject(errorMessage)
      }
    })
  }

  /**
   * prince pdf file export
   * @return dest if success, error if failure
   */
  public async princeExport({runAllCodeChunks=false, openFileAfterGeneration=false}):Promise<string> {
    const inputString = await utility.readFile(this.filePath, {encoding:'utf-8'})
    let {html, yamlConfig} = await this.parseMD(inputString, {useRelativeFilePath:false, hideFrontMatter:true, isForPreview: false, runAllCodeChunks})
    let dest = this.filePath
    let extname = path.extname(dest) 
    dest = dest.replace(new RegExp(extname+'$'), '.pdf')

    html = await this.generateHTMLTemplateForExport(html, yamlConfig, {
        isForPrint: true, 
        isForPrince: true,
        embedLocalImages: false, 
        offline: true
    })

    const info = await utility.tempOpen({prefix: 'mume', suffix: '.html'})
    await utility.writeFile(info.fd, html)

    if (yamlConfig['isPresentationMode']) {
      const url = 'file:///' + info.path + '?print-pdf'
      return url
    } else {
      await princeConvert(info.path, dest)
      
      //  open pdf
      if (openFileAfterGeneration)
        utility.openFile(dest)
      return dest
    }
  }

  private async eBookDownloadImages($, dest):Promise<Array<string>> {
    const imagesToDownload = []
    if (path.extname(dest) === '.epub' || path.extname('dest') === '.mobi') {
      $('img').each((offset, img)=> {
        const $img = $(img)
        const src = $img.attr('src') || ''
        if (src.match(/^https?\:\/\//)) 
          imagesToDownload.push($img)
      })
    }

    const asyncFunctions = imagesToDownload.map(($img)=> {
      return new Promise<string>((resolve, reject)=> {
        const httpSrc = $img.attr('src')
        let savePath = Math.random().toString(36).substr(2, 9) + '_' + path.basename(httpSrc)
        savePath = path.resolve(this.fileDirectoryPath, savePath)

        const stream = request(httpSrc).pipe(fs.createWriteStream(savePath))

        stream.on('finish', ()=> {
          $img.attr('src', 'file:///' + savePath) 
          return resolve(savePath)
        })
      })
    })

    return await Promise.all(asyncFunctions)
  }

  /**
   * 
   * 
   * @return dest if success, error if failure
   */
  public async eBookExport({fileType='epub', runAllCodeChunks=false}:{
    /**
     * fileType: 'epub', 'pdf', 'mobi' or 'html'
     */
    fileType:string,
    runAllCodeChunks?:boolean
  }):Promise<string> {
    const inputString = await utility.readFile(this.filePath, {encoding:'utf-8'})
    let {html, yamlConfig} = await this.parseMD(inputString, {useRelativeFilePath:false, hideFrontMatter:true, isForPreview: false, runAllCodeChunks})

    let dest = this.filePath
    let extname = path.extname(dest) 
    dest = dest.replace(new RegExp(extname+'$'), '.'+fileType.toLowerCase())

    let ebookConfig = yamlConfig['ebook']
    if (!ebookConfig) throw 'eBook config not found. Please insert ebook front-matter to your markdown file.'

    if (ebookConfig['cover']) { // change cover to absolute path if necessary
      const cover = ebookConfig['cover']
      ebookConfig['cover'] = this.resolveFilePath(cover, false).replace(/^file\:\/\/+/, '/')
    }

    let $ = cheerio.load(`<div>${html}</div>`, {xmlMode: true})

    const tocStructure:Array<{level:number, filePath:string, heading:string, id:string}> = []
    let headingOffset = 0

    const $toc = $(':root > ul').last()
    if ($toc.length) {
      if (ebookConfig['include_toc'] === false) { // remove itself and the heading ahead
        const $prev = $toc.prev()
        if ($prev.length && $prev[0].name.match(/^h\d$/i)) {
          $prev.remove()
        }
      }

      $('h1, h2, h3, h4, h5, h6').each((offset, h)=> {
        const $h = $(h)
        const level = parseInt($h[0].name.slice(1)) - 1

        // $h.attr('id', id)
        $h.attr('ebook-toc-level-'+(level+1), '')
        $h.attr('heading', $h.html())
      })

      getStructure($toc, 0) // analyze TOC

      if (ebookConfig['include_toc'] === false) { // remove itself and the heading ahead
        $toc.remove()
      }
    }

    // load the last ul as TOC, analyze toc links 
    function getStructure($ul, level) {
      $ul.children('li').each((offset, li)=> {
        const $li = $(li)
        const $a = $li.children('a').first()
        if (!$a.length) return 

        const filePath = $a.attr('href') // markdown file path 
        const heading = $a.html()
        const id = 'ebook-heading-id-' + headingOffset

        tocStructure.push({level, filePath, heading, id})
        headingOffset += 1

        $a.attr('href', '#'+id) // change id 
        if ($li.children().length > 1) {
          getStructure($li.children().last(), level+1)
        }
      })
    }

    // load each markdown files according to `tocStructure`
    const asyncFunctions = tocStructure.map(({heading, id, level, filePath}, offset)=> {
      return new Promise((resolve, reject)=> {
        let fileProtocalMatch
        if (fileProtocalMatch = filePath.match(/^file:\/\/+/)) 
          filePath = filePath.replace(fileProtocalMatch[0], '/')
        
        fs.readFile(filePath, {encoding: 'utf-8'}, (error, text)=> {
          if (error) return reject(error.toString())
          this.parseMD(text, {useRelativeFilePath: false, isForPreview: false, hideFrontMatter:true})
          .then(({html})=> {
            return resolve({heading, id, level, filePath, html, offset})
          })
        })
      })
    })

    let outputHTML = $.html().replace(/^<div>(.+)<\/div>$/, '$1')
    let results = await Promise.all(asyncFunctions)
    results = results.sort((a, b)=> a['offset'] - b['offset'])

    results.forEach(({heading, id, level, filePath, html})=> {
      const $ = cheerio.load(`<div>${html}</div>`, {xmlMode: true})
      const $firstChild = $(':root').children().first()
      if ($firstChild.length) {
        $firstChild.attr('id', id)
        $firstChild.attr('ebook-toc-level-'+(level+1), '')
        $firstChild.attr('heading', heading)
      }

      outputHTML += $.html().replace(/^<div>(.+)<\/div>$/, '$1') // append new content
    })

    $ = cheerio.load(outputHTML, {xmlMode: true})
    const downloadedImagePaths = await this.eBookDownloadImages($, dest)

    // convert image to base64 if output html 
    if (path.extname(dest) === '.html') {
      // check cover 
      let coverImage = ''
      if (ebookConfig['cover']) {
        const cover = ebookConfig['cover'][0] === '/' ? ('file:///' + ebookConfig['cover']) : ebookConfig['cover']
        $(':root').children().first().prepend(`<img style="display:block; margin-bottom: 24px;" src="${cover}">`)
      }

      $ = await this.embedLocalImages($)
    }

    // retrieve html 
    outputHTML = $.html()
    const title = ebookConfig['title'] || 'no title'

    // math
    let mathStyle = ''
    if (outputHTML.indexOf('class="katex"') > 0) {
      if (path.extname(dest) === '.html' && ebookConfig['html'] && ebookConfig['html'].cdn){
        mathStyle = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.8.2/katex.min.css">`
      } else {
        mathStyle = `<link rel="stylesheet" href="file:///${path.resolve(extensionDirectoryPath, './dependencies/katex/katex.min.css')}">`
      }
    }
    
    // prism and preview theme 
    let styleCSS = ""
    try{
      const styles = await Promise.all([
        // style template
        utility.readFile(path.resolve(extensionDirectoryPath, './styles/style-template.css'), {encoding:'utf-8'}),
        // prism *.css
        utility.readFile(path.resolve(extensionDirectoryPath, `./styles/prism_theme/${this.getPrismTheme(false)}`), {encoding:'utf-8'}),
        // preview theme
        utility.readFile(path.resolve(extensionDirectoryPath, `./styles/preview_theme/${this.config.previewTheme}`), {encoding:'utf-8'})
      ])
      styleCSS = styles.join('')
    } catch(e) {
      styleCSS = ''
    }

    // global styles 
    let globalStyles = ""
    try {
      globalStyles = await utility.getGlobalStyles()
    } catch(error) {
      // ignore it 
    }

    // only use github-light style for ebook
    html = `
<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta charset=\"utf-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <style> 
    ${styleCSS} 
    ${globalStyles} 
    </style>
    ${mathStyle}
  </head>
  <body>
    <div class="mume markdown-preview">
    ${outputHTML}
    </div>
  </body>
</html>            
`
    const fileName = path.basename(dest)

    // save as html 
    if (path.extname(dest) === '.html') {
      await utility.writeFile(dest, html)
      return dest
    }

    // this function will be called later 
    function deleteDownloadedImages() {
      downloadedImagePaths.forEach((imagePath)=> {
        fs.unlink(imagePath, (error)=> {})
      })
    }

    try {
      const info = await utility.tempOpen({prefix: 'mume', suffix: '.html'})

      await utility.write(info.fd, html)
      await ebookConvert(info.path, dest, ebookConfig)
      deleteDownloadedImages()
      return dest 
    } catch(error) {
      deleteDownloadedImages()
      throw error
    }
  }

  /**
   * pandoc export
   */
  public async pandocExport({runAllCodeChunks=false, openFileAfterGeneration=false}):Promise<string> {
    const inputString = await utility.readFile(this.filePath, {encoding: 'utf-8'})

    if (runAllCodeChunks) { // this line of code is only used to get this.codeChunksData
      await this.parseMD(inputString, { useRelativeFilePath:true, isForPreview:false, hideFrontMatter:false, runAllCodeChunks})
    }

    const {data:config} = this.processFrontMatter(inputString, false)
    const outputFilePath = await pandocConvert(inputString, {
      fileDirectoryPath: this.fileDirectoryPath,
      projectDirectoryPath: this.projectDirectoryPath,
      sourceFilePath: this.filePath,
      protocolsWhiteListRegExp: this.protocolsWhiteListRegExp,
      // deleteImages: true,
      filesCache: this.filesCache,
      codeChunksData: this.codeChunksData,
      graphsCache: this.graphsCache,
      imageDirectoryPath: this.config.imageFolderPath,
      pandocMarkdownFlavor: this.config.pandocMarkdownFlavor,
      pandocPath: this.config.pandocPath,
      latexEngine: this.config.latexEngine
    }, config)

    if (openFileAfterGeneration)
      utility.openFile(outputFilePath)
    return outputFilePath
  }

  /**
   * markdown(gfm) export 
   */
  public async markdownExport({runAllCodeChunks=false}):Promise<string> {
    let inputString = await utility.readFile(this.filePath, {encoding: 'utf-8'})
    
    if (runAllCodeChunks) { // this line of code is only used to get this.codeChunksData
      await this.parseMD(inputString, { useRelativeFilePath:true, isForPreview:false, hideFrontMatter:false, runAllCodeChunks})
    }

    let config = {}
    let frontMatterMatch = null
    if (frontMatterMatch = inputString.match(new RegExp(`^---\s*${EOL}([\\s\\S]+?)${EOL}---\s*${EOL}`))) {
      let frontMatterString = frontMatterMatch[0]
      inputString = inputString.replace(frontMatterString, '') // remove front matter
      config = this.processFrontMatter(frontMatterString, false).data
    } 

    /**
     * markdownConfig has the following properties:
     *     path:                        destination of the output file
     *     image_dir:                   where to save the image file
     *     use_abolute_image_path:      as the name shows.  
     *     ignore_from_front_matter:    default is true.  
     */
    let markdownConfig = {}
    if (config['markdown'])
       markdownConfig = Object.assign({}, config['markdown'])

    if (!markdownConfig['image_dir']) {
      markdownConfig['image_dir'] = this.config.imageFolderPath
    }

    if (!markdownConfig['path']) {
      if (this.filePath.match(/\.src\./)) {
        markdownConfig['path'] = this.filePath.replace(/\.src\./, '.')
      } else {
        markdownConfig['path'] = this.filePath.replace(new RegExp(path.extname(this.filePath)), '_'+path.extname(this.filePath))
      }
      markdownConfig['path']  = path.basename(markdownConfig['path'])
    }

    // ignore_from_front_matter is `true` by default
    if (markdownConfig['ignore_from_front_matter'] || !('ignore_from_front_matter' in markdownConfig)) { // delete markdown config front-matter from the top front matter
      delete config['markdown']
    } 
    if (config['export_on_save']) {
      delete config['export_on_save']
    }

    // put front-matter back
    if (Object.keys(config).length)
      inputString = matter.stringify(inputString, config)

    return await markdownConvert(inputString, {
      projectDirectoryPath: this.projectDirectoryPath,
      fileDirectoryPath: this.fileDirectoryPath,
      protocolsWhiteListRegExp: this.protocolsWhiteListRegExp,
      filesCache: this.filesCache,
      mathInlineDelimiters: this.config.mathInlineDelimiters,
      mathBlockDelimiters: this.config.mathBlockDelimiters,
      codeChunksData: this.codeChunksData,
      graphsCache: this.graphsCache,
      usePandocParser: this.config.usePandocParser
    }, markdownConfig)
  }

  /**
   * Eg
   * ---
   * export_on_save:
   *    html: true
   *    prince: true   
   *    phantomjs|chrome: true  // or pdf | jpeg | png
   *    pandoc: true
   *    ebook: true      // or epub | pdf | html | mobi
   *    markdown: true
   * ---
   * @param data 
   */
  private exportOnSave(data:object) {
    for (let exporter in data) {
      if (exporter === 'markdown') {
        this.markdownExport({})
      } else if (exporter === 'html') {
        this.htmlExport({})
      } else if (exporter === 'prince') {
        this.princeExport({openFileAfterGeneration: false})
      } else if (exporter === 'phantomjs' || exporter === 'chrome') {
        const fileTypes = data[exporter]
        let func = (exporter === 'phantomjs' ? this.phantomjsExport : this.chromeExport)
        func = func.bind(this)

        if (fileTypes === true) {
          func({fileType: 'pdf', openFileAfterGeneration: false})
        } else if (typeof(fileTypes) === 'string') {
          func({fileType: fileTypes, openFileAfterGeneration: false})
        } else if (fileTypes instanceof Array) {
          fileTypes.forEach((fileType)=> {
            func({fileType, openFileAfterGeneration: false})
          })
        }
      } else if (exporter === 'pandoc') {
        this.pandocExport({openFileAfterGeneration: false})
      } else if (exporter === 'ebook') {
        const fileTypes = data[exporter]
        if (fileTypes === true) {
          this.eBookExport({fileType: 'epub'})
        } else if (typeof(fileTypes) === 'string') {
          this.eBookExport({fileType: fileTypes})
        } else if (fileTypes instanceof Array) {
          fileTypes.forEach((fileType)=> {
            this.eBookExport({fileType})
          })
        } 
      }
    }
  }

  /**
   * 
   * @param filePath 
   * @param relative: whether to use the path relative to filePath or not.  
   */
  private resolveFilePath(filePath:string='', relative:boolean) {
    if (  filePath.match(this.protocolsWhiteListRegExp) ||
          filePath.startsWith('data:image/') ||
          filePath[0] === '#') {
      return filePath
    } else if (filePath[0] === '/') {
      if (relative)
        return path.relative(this.fileDirectoryPath, path.resolve(this.projectDirectoryPath, '.'+filePath))
      else
        return 'file:///' + path.resolve(this.projectDirectoryPath, '.'+filePath)
    } else {
      if (relative)
        return filePath
      else
        return 'file:///' + path.resolve(this.fileDirectoryPath, filePath)
    }
  }

  /**
   * Run code chunk of `id`
   * @param id 
   */
  public async runCodeChunk(id):Promise<String> {
    let codeChunkData = this.codeChunksData[id]
    if (!codeChunkData) return ''
    if (codeChunkData.running) return ''

    let code = codeChunkData.code
    let cc = codeChunkData
    while (cc.options['continue']) {
      let id = cc.options['continue']
      if (id === true) {
        id = cc.prev
      }
      cc = this.codeChunksData[id]
      if (!cc) break 
      code = cc.code + code
    }

    codeChunkData.running = true
    let result
    try {
      const options = codeChunkData.options
      if (options['cmd'] === 'toc') { // toc code chunk. <= this is a special code chunk.  
        const tocObject = toc(this.headings, {ordered: options['orderedList'], depthFrom: options['depthFrom'], depthTo: options['depthTo'], tab: options['tab'] || '\t'})
        result = tocObject.content
      } else if (options['cmd'] === 'ditaa') { // ditaa diagram
        const filename = options['filename'] || `${md5(this.filePath + options['id'])}.png`
        let imageFolder = utility.removeFileProtocol(this.resolveFilePath(this.config.imageFolderPath, false))
        await utility.mkdirp(imageFolder)

        codeChunkData.options['output'] = 'markdown'
        const dest = await ditaaAPI.render(code, options['args'] || [], path.resolve(imageFolder, filename))
        result = `  \n![](${path.relative(this.fileDirectoryPath, dest).replace(/\\/g, '/')})  \n` // <= fix windows path issue.
      } else { // common code chunk
        // I put this line here because some code chunks like `toc` still need to be run.  
        if (!this.config.enableScriptExecution) return '' // code chunk is disabled.

        result = await CodeChunkAPI.run(code, this.fileDirectoryPath, codeChunkData.options, this.config.latexEngine)
      }
      codeChunkData.plainResult = result

      if (codeChunkData.options['modify_source'] && ('code_chunk_offset' in codeChunkData.options)) {
        codeChunkData.result = ''
        return MarkdownEngine.modifySource(codeChunkData, result, this.filePath)
      } 
      
      const outputFormat = codeChunkData.options['output'] || 'text'
      if (!result) { // do nothing
        result = ''
      } else if (outputFormat === 'html') {
        result = result 
      } else if (outputFormat === 'png') {
        const base64 = new Buffer(result).toString('base64')
        result = `<img src="data:image/png;charset=utf-8;base64,${base64}">`
      } else if (outputFormat === 'markdown') {
        const {html} = await this.parseMD(result, {useRelativeFilePath:true, isForPreview:false, hideFrontMatter: true} )
        result = html 
      } else if (outputFormat === 'none') {
        result = ''
      } else {
        result = `<pre class="language-text">${result}</pre>`
      }
    } catch(error) {
      result = `<pre class="language-text">${error}</pre>`
    }

    codeChunkData.result = result // save result.
    codeChunkData.running = false 
    return result
  }

  public async runAllCodeChunks() {
    const asyncFunctions = []
    for (let id in this.codeChunksData) {
      asyncFunctions.push(this.runCodeChunk(id))
    }
    return await Promise.all(asyncFunctions)
  }
  /**
   * Add line numbers to code block <pre> element
   * @param  
   * @param code 
   */  
  private addLineNumbersIfNecessary($preElement, code:string):void {
    if ($preElement.hasClass('line-numbers')) {
      if (!code.trim().length) return
      const match = code.match(/\n(?!$)/g)
      const linesNum = match ? (match.length + 1) : 1
      let lines = ''
      for (let i = 0; i < linesNum; i++) {
        lines += '<span></span>'
      }
      $preElement.append(`<span aria-hidden="true" class="line-numbers-rows">${lines}</span>`)
    }
  }
  
  /**
   * 
   * @param preElement the cheerio element
   * @param parameters is in the format of `lang {opt1:val1, opt2:val2}` or just `lang`       
   * @param text 
   */
  private async renderCodeBlock($, $preElement, code, parameters, 
  { graphsCache, 
    codeChunksArray, 
    isForPreview,
    triggeredBySave }:{graphsCache:object, codeChunksArray:CodeChunkData[], isForPreview:boolean, triggeredBySave:boolean}) {
    
    let match, lang, optionsStr:string, options:object 
    if (match = parameters.match(/\s*([^\s]+)\s+\{(.+?)\}/)) {
      lang = match[1]
      optionsStr = match[2]
    } else {
      lang = parameters
      optionsStr = ''
    }

    if (optionsStr) {
      try {
        options = utility.parseAttributes(optionsStr)
      } catch (e) {
        return $preElement.replaceWith(`<pre class="language-text">OptionsError: ${'{'+optionsStr+'}'}<br>${e.toString()}</pre>`)
      }
    } else {
      options = {}
    }

    const renderPlainCodeBlock = ()=> {
      try {
        if (!Prism) {
          Prism = require(path.resolve(extensionDirectoryPath, './dependencies/prism/prism.js'))
        }
        const html = Prism.highlight(code, Prism.languages[scopeForLanguageName(lang)])
        $preElement.html(html)  
      } catch(error) {
        // regarded as plain text
        $preElement.text(code)
      }
      if (options['class']) {
        $preElement.addClass(options['class'])
        this.addLineNumbersIfNecessary($preElement, code)
      }
    }

    const codeBlockOnly = options['code_block']
    if (codeBlockOnly) {
      renderPlainCodeBlock()
    } else if (lang.match(/^(puml|plantuml)$/)) { // PlantUML 
      const checksum = md5(optionsStr + code)
      let svg:string = this.graphsCache[checksum] 
      if (!svg) {
        svg = await plantumlAPI.render(code, this.fileDirectoryPath)
      }
      $preElement.replaceWith(`<p ${optionsStr ? utility.stringifyAttributes(options, false) : '' }>${svg}</p>`)
      graphsCache[checksum] = svg // store to new cache 
      
    } else if (lang.match(/^mermaid$/)) { // mermaid 
      /*
      // it doesn't work well...
      // the cache doesn't work well.
      const checksum = md5(optionsStr + code)
      let svg:string = this.graphsCache[checksum]
      if (!svg) {
        $preElement.replaceWith(`<div class="mermaid">${code}</div>`)
      } else {
        $preElement.replaceWith(svg)
        graphsCache[checksum] = svg // store to new cache 
      }
      */
      if (options['class']) {
        options['class'] += ' mermaid'
      } else {
        options['class'] = 'mermaid'
      }
      $preElement.replaceWith(`<div ${utility.stringifyAttributes(options, false)}>${code}</div>`)
    } else if (lang === 'wavedrom') {
      if (options['class']) {
        options['class'] += ' wavedrom'
      } else {
        options['class'] = 'wavedrom'
      }
      $preElement.replaceWith(`<div ${utility.stringifyAttributes(options, false)}><script type="WaveDrom">${code}</script></div>`)
    } else if (lang.match(/^(dot|viz)$/)) { // GraphViz
      const checksum = md5(optionsStr + code)
      let svg = this.graphsCache[checksum]
      if (!svg) {        
        try {
          let engine = options['engine'] || "dot"
          svg = Viz(code, {engine})
          
          $preElement.replaceWith(`<p ${optionsStr ? utility.stringifyAttributes(options, false) : '' }>${svg}</p>`)
          graphsCache[checksum] = svg // store to new cache
        } catch(e) {
          $preElement.replaceWith(`<pre class="language-text">${e.toString()}</pre>`)
        }
      } else {
        $preElement.replaceWith(`<p ${optionsStr ? utility.stringifyAttributes(options, false) : '' }>${svg}</p>`)
        graphsCache[checksum] = svg // store to new cache
      }
    } else if (lang.match(/^vega$/)) { // vega
      const checksum = md5(optionsStr + code)
      let svg:string = this.graphsCache[checksum] 
      if (!svg) {
        try {
          svg = await vegaAPI.toSVG(code, this.fileDirectoryPath)

          $preElement.replaceWith(`<p ${optionsStr ? utility.stringifyAttributes(options, false) : '' }>${svg}</p>`)
          graphsCache[checksum] = svg // store to new cache 
        } catch(error) {
          $preElement.replaceWith(`<pre class="language-text">${error.toString()}</pre>`)
        }
      } else {
        $preElement.replaceWith(`<p ${optionsStr ? utility.stringifyAttributes(options, false) : '' }>${svg}</p>`)
        graphsCache[checksum] = svg // store to new cache
      }
    } else if (lang === 'vega-lite') { // vega-lite
      const checksum = md5(optionsStr + code)
      let svg:string = this.graphsCache[checksum] 
      if (!svg) {
        try {
          svg = await vegaLiteAPI.toSVG(code, this.fileDirectoryPath)

          $preElement.replaceWith(`<p ${optionsStr ? utility.stringifyAttributes(options, false) : '' }>${svg}</p>`)
          graphsCache[checksum] = svg // store to new cache 
        } catch(error) {
          $preElement.replaceWith(`<pre class="language-text">${error.toString()}</pre>`)
        }
      } else {
        $preElement.replaceWith(`<p ${optionsStr ? utility.stringifyAttributes(options, false) : '' }>${svg}</p>`)
        graphsCache[checksum] = svg // store to new cache
      }
    } else if (options['cmd']) {
      const $el = $("<div class=\"code-chunk\"></div>") // create code chunk
      if (!options['id']) {
        options['id'] = 'code-chunk-id-' + codeChunksArray.length
      }

      if (options['cmd'] === true) {
        options['cmd'] = lang
      }

      $el.attr({
        'data-id': options['id'],
        'data-cmd': options['cmd'],
        'data-code': options['cmd'] === 'javascript' ? code : '' 
      })

      let highlightedBlock = ''
      if (!options['hide']) {
        try {
          if (!Prism) {
            Prism = require(path.resolve(extensionDirectoryPath, './dependencies/prism/prism.js'))
          }
          highlightedBlock = `<pre class="language-${lang} ${options['class'] || ''}">${Prism.highlight(code, Prism.languages[scopeForLanguageName(lang)])}</pre>`
        } catch(e) {
          // do nothing
          highlightedBlock = `<pre class="language-text ${options['class'] || ''}">${code}</pre>`
        }

        const $highlightedBlock = $(highlightedBlock)
        this.addLineNumbersIfNecessary($highlightedBlock, code)
        highlightedBlock = $.html($highlightedBlock)
      }

      /*
      if (!options['id']) { // id is required for code chunk
        highlightedBlock = `<pre class="language-text">'id' is required for code chunk</pre>`
      }*/

      let codeChunkData:CodeChunkData = this.codeChunksData[options['id']]
      let previousCodeChunkDataId = codeChunksArray.length ? codeChunksArray[codeChunksArray.length - 1].id : ''
      if (!codeChunkData) {
        codeChunkData = {
          id: options['id'],
          code,
          options: options,
          result: '',
          plainResult: '',
          running: false,
          prev: previousCodeChunkDataId,
          next: null
        }
        this.codeChunksData[options['id']] = codeChunkData
      } else {
        codeChunkData.code = code 
        codeChunkData.options = options
        codeChunkData.prev = previousCodeChunkDataId
      }
      if (previousCodeChunkDataId && this.codeChunksData[previousCodeChunkDataId]) 
        this.codeChunksData[previousCodeChunkDataId].next = options['id']

      codeChunksArray.push(codeChunkData) // this line has to be put above the `if` statement.

      if (triggeredBySave && options['run_on_save']) {
        await this.runCodeChunk(options['id'])
      }

      let result = codeChunkData.result
      // element option 
      if (!result && codeChunkData.options['element']) {
        result = codeChunkData.options['element']
        codeChunkData.result = result 
      }

      if (codeChunkData.running) {
        $el.addClass('running')
      }
      const statusDiv = `<div class="status">running...</div>`
      const buttonGroup = '<div class="btn-group"><div class="run-btn btn"><span>▶︎</span></div><div class=\"run-all-btn btn\">all</div></div>'
      let outputDiv = `<div class="output-div">${result}</div>`

      // check javascript code chunk
      if (!isForPreview && options['cmd'] === 'javascript') {
        outputDiv += `<script>${code}</script>`
        result = codeChunkData.options['element'] || ''
      }

      $el.append(highlightedBlock)
      $el.append(buttonGroup)
      $el.append(statusDiv)
      $el.append(outputDiv)
      $preElement.replaceWith($el)
    } else { // normal code block  // TODO: code chunk
      renderPlainCodeBlock()
    }
  }

  /**
   * Extend table syntax to support colspan and rowspan for merging cells
   * @param $ 
   */
  private extendTableSyntax($) {
    const rowspans:Array<[object, object]> = [], // ^ 
          colspans:Array<[object, object]> = [], // >
          colspans2:Array<[object, object]> = []  // empty
    $('table').each((i, table)=> {
      const $table = $(table)
      const $thead = $table.children().first()
      let $prevRow = null
      $table.children().each((a, head_body)=> {
        const $head_body = $(head_body)
        $head_body.children().each((i, row)=> {
          const $row = $(row)
          $row.children().each((j, col)=> {
            const $col = $(col)
            const text = $col.text()
            if (!text.length) { // merge to left
              const $prev = $col.prev()
              if ($prev.length) {
                colspans2.push([$prev, $col])
                // const colspan = parseInt($prev.attr('colspan')) || 1
                // $prev.attr('colspan', colspan+1)
                // $col.remove()
              }
            } else if (text.trim() === '^' && $prevRow) { // merge to top
              const $prev = $($prevRow.children()[j])
              if ($prev.length) {
                rowspans.push([$prev, $col])
                // const rowspan = parseInt($prev.attr('rowspan')) || 1
                // $prev.attr('rowspan', rowspan+1)
                // $col.remove()
              }

            } else if (text.trim() === '>') { // merge to right 
              const $next = $col.next()
              if ($next.length) {
                // const colspan = parseInt($next.attr('colspan')) || 1
                // $next.attr('colspan', colspan+1)
                // $col.remove()
                colspans.push([$col, $next])
              }
            }
          })
          $prevRow = $row
        })
      })
    })

    for (let i = rowspans.length - 1; i >= 0; i--) {
      const [$prev, $col] = rowspans[i]
      const rowspan = (parseInt($prev['attr']('rowspan')) || 1) + (parseInt($col['attr']('rowspan')) || 1)
      $prev['attr']('rowspan', rowspan)
      $col['remove']()
    }
    for (let i = 0; i < colspans.length; i++) {
      const [$prev, $col] = colspans[i]
      const colspan = (parseInt($prev['attr']('colspan')) || 1) + (parseInt($col['attr']('colspan')) || 1)
      $col['attr']('colspan', colspan)
      $prev['remove']()
    }
    for (let i = colspans2.length - 1; i >= 0; i--) {
      const [$prev, $col] = colspans2[i]
      const colspan = (parseInt($prev['attr']('colspan')) || 1) + (parseInt($col['attr']('colspan')) || 1)
      $prev['attr']('colspan', colspan)
      $col['remove']()
    }
  }

  /**
   * This function resovle image paths and render code blocks
   * @param html the html string that we will analyze 
   * @return html 
   */
  private async resolveImagePathAndCodeBlock(html, options:MarkdownEngineRenderOption) {
    let $ = cheerio.load(html, {xmlMode:true})
    
    // new caches
    // which will be set when this.renderCodeBlocks is called
    const newGraphsCache:{[key:string]:string} = {}
    const codeChunksArray:CodeChunkData[] = []

    const asyncFunctions = []
    $('pre').each((i, preElement)=> {
      let codeBlock, lang, code 
      const $preElement = $(preElement)
      if (preElement.children[0] && preElement.children[0].name === 'code') {
        codeBlock = $preElement.children().first()
        lang = 'text'
        let classes = codeBlock.attr('class')
        if (!classes) classes = 'language-text'
        lang = classes.replace(/^language-/, '')
        if (!lang) lang = 'text'
        code = codeBlock.text()
        $preElement.attr('class', classes)
        $preElement.children().first().addClass(classes)
      } else {
        lang = 'text'
        if (preElement.children[0])
          code = preElement.children[0].data
        else
          code = ''
        $preElement.attr('class', 'language-text')
      }
      
      asyncFunctions.push(this.renderCodeBlock($, $preElement, code, lang, 
        {graphsCache: newGraphsCache, codeChunksArray, isForPreview:options.isForPreview, triggeredBySave: options.triggeredBySave}))
    })

    await Promise.all(asyncFunctions)


    // resolve image paths
    $('img, a').each((i, imgElement)=> {
      let srcTag = 'src'
      if (imgElement.name === 'a')
        srcTag = 'href'

      const img = $(imgElement)
      const src = img.attr(srcTag)

      // insert anchor for scroll sync.  
      if (options.isForPreview && img.parent().prev().hasClass('sync-line')) { 
        const lineNo = parseInt(img.parent().prev().attr('data-line'))
        if (lineNo)
          img.parent().after(`<p data-line="${lineNo + 1}" class="sync-line" style="margin:0;"></p>`)
      }

      img.attr(srcTag, this.resolveFilePath(src, options.useRelativeFilePath))
    })

    // reset caches 
    // the line below actually has problem.
    if (options.isForPreview) {
      this.graphsCache = newGraphsCache
      // console.log(this.graphsCache)
    } 

    if (!this.config.usePandocParser) { // check .mume-header in order to add id and class to headers.  
      $('.mume-header').each((i, e)=> {
        const classes = e.attribs.class,
              id = e.attribs.id
        const $e = $(e),
              $h = $e.prev()
        $h.addClass(classes)
        $h.attr('id', id)
        $e.remove()
      })
    }

    if (this.config.enableExtendedTableSyntax) { // extend table
      this.extendTableSyntax($)
    }

    return $.html()
  }

  /**
   * return this.cachedHTML
   */
  /*
  public getCachedHTML() {
    return this.cachedHTML
  }
  */

  /**
   * clearCaches will clear filesCache, codeChunksData, graphsCache
   */
  public clearCaches() {
    this.filesCache = {}
    this.codeChunksData = {}
    this.graphsCache = {}
  }

  private frontMatterToTable(arg) {
    if (arg instanceof Array) {
      let tbody = "<tbody><tr>"
      arg.forEach((item)=> tbody += `<td>${this.frontMatterToTable(item)}</td>` )
      tbody += "</tr></tbody>"
      return `<table>${tbody}</table>`
    } else if (typeof(arg) === 'object') {
      let thead = "<thead><tr>"
      let tbody = "<tbody><tr>"
      for (let key in arg) {
        thead += `<th>${key}</th>`
        tbody += `<td>${this.frontMatterToTable(arg[key])}</td>`
      }
      thead += "</tr></thead>"
      tbody += "</tr></tbody>"

      return `<table>${thead}${tbody}</table>`
    } else {
      return arg
    }
  }

  /**
   * process input string, skip front-matter
   * if usePandocParser. return {
   *      content: frontMatterString
   * }
   * else if display table. return {
   *      table: string of <table>...</table> generated from data
   *      content: ''
   * }
   * else return {
   *      content: replace ---\n with ```yaml
   * }
   * 
   */
  private processFrontMatter(frontMatterString:string, hideFrontMatter=false) {
    if (frontMatterString) {
      let data:any = matter(frontMatterString).data

      if (this.config.usePandocParser) { // use pandoc parser, so don't change inputString
        return {content: frontMatterString, table: '', data: data || {}}
      } else if (hideFrontMatter || this.config.frontMatterRenderingOption[0] === 'n') { // hide
        return {content:'', table: '', data}
      } else if (this.config.frontMatterRenderingOption[0] === 't') { // table
        // to table
        let table 
        if (typeof(data) === 'object')
          table = this.frontMatterToTable(data)
        else
          table = "<pre>Failed to parse YAML.</pre>"

        return {content:'', table, data}
      } else { // # if frontMatterRenderingOption[0] == 'c' # code block
        const content = frontMatterString.replace(/^---/, '```yaml').replace(/---\n$/, '```\n')
        return {content, table: '', data}
      }
    } else {
      return {content: frontMatterString, table: '', data:{}}
    }
  }

  /**
   * Parse `html` to generate slides
   */
  private parseSlides(html:string, slideConfigs:Array<object>, useRelativeFilePath:boolean) {
    let slides = html.split('<p>[MUMESLIDE]</p>')
    let before = slides[0]
    slides = slides.slice(1)

    let output = ''

    /*
    const parseAttrString = (slideConfig)=> {
      let attrString = ''

      // let attrString = utility.stringifyAttributes(slideConfig, false)

      if (slideConfig['data-background-image'])
        attrString += ` data-background-image='${this.resolveFilePath(slideConfig['data-background-image'], useRelativeFilePath)}'`

      if (slideConfig['data-background-size'])
        attrString += ` data-background-size='${slideConfig['data-background-size']}'`

      if (slideConfig['data-background-position'])
        attrString += ` data-background-position='${slideConfig['data-background-position']}'`

      if (slideConfig['data-background-repeat'])
        attrString += ` data-background-repeat='${slideConfig['data-background-repeat']}'`

      if (slideConfig['data-background-color'])
        attrString += ` data-background-color='${slideConfig['data-background-color']}'`

      if (slideConfig['data-notes'])
        attrString += ` data-notes='${slideConfig['data-notes']}'`

      if (slideConfig['data-background-video'])
        attrString += ` data-background-video='${this.resolveFilePath(slideConfig['data-background-video'], useRelativeFilePath)}'`

      if (slideConfig['data-background-video-loop'])
        attrString += ` data-background-video-loop`

      if (slideConfig['data-background-video-muted'])
        attrString += ` data-background-video-muted`

      if (slideConfig['data-transition'])
        attrString += ` data-transition='${slideConfig['data-transition']}'`

      if (slideConfig['data-background-iframe'])
        attrString += ` data-background-iframe='${this.resolveFilePath(slideConfig['data-background-iframe'], useRelativeFilePath)}'`

      return attrString
    }
    */

    let i = 0,
        h = -1, // horizontal
        v = 0  // vertical
    while (i < slides.length) { 
      const slide = slides[i] 
      const slideConfig = slideConfigs[i]

      // resolve paths in slideConfig
      if ('data-background-image' in slideConfig) {
        slideConfig['data-background-image'] = this.resolveFilePath(slideConfig['data-background-image'], useRelativeFilePath)
      }
      if ('data-background-video' in slideConfig) {
        slideConfig['data-background-video'] = this.resolveFilePath(slideConfig['data-background-video'], useRelativeFilePath)
      }
      if ('data-background-iframe' in slideConfig) {
        slideConfig['data-background-iframe'] = this.resolveFilePath(slideConfig['data-background-iframe'], useRelativeFilePath)
      }


      const attrString = utility.stringifyAttributes(slideConfig, false) // parseAttrString(slideConfig)
      const classString = slideConfig['class'] || ''
      const idString = slideConfig['id'] ? `id="${slideConfig['id']}"` : ''

      if (!slideConfig['vertical']) {
        h += 1
        if (i > 0 && slideConfigs[i-1]['vertical']) { // end of vertical slides
          output += '</section>'
          v = 0
        }
        if (i < slides.length - 1 && slideConfigs[i+1]['vertical']) { // start of vertical slides
          output += "<section>"
        }
      } else { // vertical slide
        v += 1
      }

      output += `<section ${attrString} ${idString}  class=\"slide ${classString}\" data-line="${slideConfig['lineNo']}" data-h=\"${h}\" data-v="${v}">${slide}</section>`
      i += 1
    }
    if (i > 0 && slideConfigs[i-1]['vertical']) // end of vertical slides
      output += "</section>"

    return `
    <div style="display:none;">${before}</div>
    <div class="reveal">
      <div class="slides">
        ${output}
      </div>
    </div>
    `
  }

  public async pandocRender(text:string='', args:string[]):Promise<string> {
    args = args || []
    args = ['-f', this.config.pandocMarkdownFlavor, // -tex_math_dollars doesn't work properly
            '-t', 'html',
            '--mathjax']
            .concat(args).filter((arg)=>arg.length)

    /*
    convert code block
    ```python {id:"haha"}
    to
    ```{.python data-code-block:"{id: haha}"}
    */

    let outputString = ""
    let lines = text.split('\n')
    let i = 0
    let inCodeBlock = false
    while (i < lines.length) {
      let line = lines[i]
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock

        if (inCodeBlock) {
          let lang = utility.escapeString(line.slice(3)).trim()
          if (!lang) lang = 'text'
          outputString += `<pre><code class="language-${lang}" >`
        } else {
          outputString += '</code></pre>\n'
        }

        i += 1
        continue
      }

      if (line.match(/^\[toc\]/i) && !inCodeBlock) {
        line = '[MUMETOC]'
      }

      outputString += line + '\n'
      i += 1
    }

    const pandocPath = this.config.pandocPath
    return await new Promise<string>((resolve, reject)=> {
      try {
        const program = execFile(pandocPath, args, {cwd: this.fileDirectoryPath}, (error, stdout, stderr)=> {
          if (error) return reject(error)
          if (stderr) return reject(stderr)
          return resolve(stdout)
        })
        program.stdin.end(outputString, 'utf-8')
      } catch(error) {
        let errorMessage = error.toString()
        if (errorMessage.indexOf("Error: write EPIPE") >= 0) {
          errorMessage = `"pandoc" is required to be installed.\nCheck "http://pandoc.org/installing.html" website.`
        }
        return reject(errorMessage)
      }
    })
  }

  public async parseMD(inputString:string, options:MarkdownEngineRenderOption):Promise<MarkdownEngineOutput> {
    if (!inputString) inputString = await utility.readFile(this.filePath, {encoding:'utf-8'})

    if (utility.configs.parserConfig['onWillParseMarkdown']) {
      inputString = await utility.configs.parserConfig['onWillParseMarkdown'](inputString)
    }

    // import external files and insert anchors if necessary 
    let {outputString, slideConfigs, tocBracketEnabled, JSAndCssFiles, headings, frontMatterString} = await transformMarkdown(inputString, 
    {
      fileDirectoryPath: this.fileDirectoryPath, 
      projectDirectoryPath: this.projectDirectoryPath,
      forPreview: options.isForPreview,
      protocolsWhiteListRegExp: this.protocolsWhiteListRegExp,
      useRelativeFilePath: options.useRelativeFilePath,
      filesCache: this.filesCache,
      usePandocParser: this.config.usePandocParser
    })

    // process front-matter
    const fm = this.processFrontMatter(frontMatterString, options.hideFrontMatter)
    const frontMatterTable = fm.table,
          yamlConfig = fm.data || {} 
    outputString = fm.content + outputString

    /**
     * render markdown to html
     */
    let html
    if (this.config.usePandocParser) { // pandoc
      try {
        let args = yamlConfig['pandoc_args'] || []
        if (!(args instanceof Array)) args = []

        // check bibliography
        if (yamlConfig['bibliography'] || yamlConfig['references'])
          args.push('--filter', 'pandoc-citeproc')
        
        args = this.config.pandocArguments.concat(args)

        html = await this.pandocRender(outputString, args)
      } catch(error) {
        html = `<pre>${error}</pre>`
      }
    } else { // markdown-it
      html = this.md.render(outputString)
    }

    /**
     * render tocHTML
     */
    if (!utility.isArrayEqual(headings, this.headings)) {
      const tocObject = toc(headings, {ordered: false, depthFrom: 1, depthTo: 6, tab: '\t'})
      this.tocHTML = this.md.render(tocObject.content)
    }
    this.headings = headings // reset headings information

    if (tocBracketEnabled) { // [TOC]
      html = html.replace(/^\s*<p>\[MUMETOC\]<\/p>\s*/gm, this.tocHTML)
    }

    /**
     * resolve image paths and render code block.
     */
    html = frontMatterTable + await this.resolveImagePathAndCodeBlock(html, options)

    /**
     * check slides
     */
    if (slideConfigs.length) {
      html = this.parseSlides(html, slideConfigs, options.useRelativeFilePath)
      if (yamlConfig) yamlConfig['isPresentationMode'] = true // mark as presentation mode
    }

    if (utility.configs.parserConfig['onDidParseMarkdown']) {
      html = await utility.configs.parserConfig['onDidParseMarkdown'](html, {cheerio})
    }

    if (options.runAllCodeChunks) {
      await this.runAllCodeChunks()
      options.runAllCodeChunks = false
      return this.parseMD(inputString, options)
    }

    if (options.isForPreview) {
      // this.cachedHTML = html // save to cache
      this.isPreviewInPresentationMode = !!(slideConfigs.length) // check presentation mode
    }

    if (options.triggeredBySave && yamlConfig['export_on_save']) { // export files
      this.exportOnSave(yamlConfig['export_on_save'])
    }

    if (!this.config.enableScriptExecution) { // disable importing js and css files.  
      JSAndCssFiles = []
    }

    return {html, markdown:inputString, tocHTML: this.tocHTML, yamlConfig, JSAndCssFiles}
  }
}