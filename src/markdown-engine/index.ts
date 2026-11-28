// tslint:disable no-var-requires member-ordering

import type { Cheerio, CheerioAPI } from 'cheerio';
import * as cheerio from 'cheerio';
import { execFile } from 'child_process';
import { copy } from 'copy-anything';
import CryptoJS from 'crypto-js';
import type { AnyNode, Element } from 'domhandler';
import * as fs from 'fs';
import { escape } from 'html-escaper';
import * as path from 'path';
import { JsonObject } from 'type-fest';
import * as vscode from 'vscode';
import { URI } from 'vscode-uri';
import * as YAML from 'yaml';
import { CodeChunkData } from '../code-chunk/code-chunk-data';
import { ebookConvert } from '../converters/ebook-convert';
import { markdownConvert } from '../converters/markdown-convert';
import { pandocConvert } from '../converters/pandoc-convert';
import { princeConvert } from '../converters/prince-convert';
import { parseBlockAttributes } from '../lib/block-attributes/parseBlockAttributes';
import { normalizeBlockInfo } from '../lib/block-info/normalize-block-info';
import { parseBlockInfo } from '../lib/block-info/parse-block-info';
import { mapAbsoluteCssUrls } from '../lib/css-urls';
import { jsonForScript } from '../lib/json-for-script';
import {
  FileSystemApi,
  Notebook,
  WebviewConfig,
  getDefaultNotebookConfig,
} from '../notebook';
import enhanceWithCodeBlockStyling from '../render-enhancers/code-block-styling';
import enhanceWithEmbeddedLocalImages from '../render-enhancers/embedded-local-images';
import enhanceWithEmbeddedSvgs from '../render-enhancers/embedded-svgs';
import enhanceWithEmbeddedWikilinks from '../render-enhancers/embedded-wikilinks';
import enhanceWithExtendedTableSyntax from '../render-enhancers/extended-table-syntax';
import enhanceWithFencedCodeChunks, {
  RunCodeChunkOptions,
  runCodeChunk,
  runCodeChunks,
} from '../render-enhancers/fenced-code-chunks';
import enhanceWithFencedDiagrams from '../render-enhancers/fenced-diagrams';
import enhanceWithFencedMath from '../render-enhancers/fenced-math';
import enhanceWithResolvedImagePaths from '../render-enhancers/resolved-image-paths';
import * as utility from '../utility';
import { removeFileProtocol } from '../utility';
import HeadingIdGenerator from './heading-id-generator';
import { readOfflineCss, readOfflineJs } from './inline-offline-assets';
import { buildMathJaxConfigScript, mathJaxConfigOf } from './mathjax-config';
import { buildMermaidExportScript } from './mermaid-export';
import { MERMAID_LEGACY_WEBVIEW_POLYFILL } from './mermaid-polyfill';
import {
  newSlideMarkerToken,
  slideMarkerRegExp,
  tocMarkerRegExp,
} from './page-markers';
import { buildPeleExportScript } from './pele-export';
import {
  buildPresentationInitScript,
  presentationPrintStyle,
} from './presentation-export';
import {
  sanitizeRenderedHTML,
  sanitizeStableHTML,
  settledHTML,
} from './sanitize';
import { HeadingData, generateSidebarToCHTML } from './toc';
import { SLIDE_MARKER_NUMBER, transformMarkdown } from './transformer';

interface MarkdownEngineConstructorArgs {
  /**
   * The notebook
   */
  notebook: Notebook;
  /**
   * The note file path. It needs to be absolute path.
   */
  filePath: string;
}

export interface MarkdownEngineRenderOption {
  useRelativeFilePath: boolean;
  isForPreview: boolean;
  hideFrontMatter: boolean;
  triggeredBySave?: boolean;
  runAllCodeChunks?: boolean;
  emojiToSvg?: boolean;
  vscodePreviewPanel?: vscode.WebviewPanel | null;
  fileDirectoryPath?: string;
}

export interface MarkdownEngineOutput {
  html: string;
  markdown: string;
  tocHTML: string;
  yamlConfig: JsonObject;
  /**
   * imported javascript and css files
   * convert .js file to <script src='...'></script>
   * convert .css file to <link href='...'></link>
   */
  JSAndCssFiles: string[];
  // slideConfigs: Array<object>
}

type MermaidExportWindow = Window & {
  __crossnoteMermaidExport?: {
    status: 'pending' | 'complete' | 'error';
    message?: string;
  };
};

type PeleExportWindow = Window & {
  __crossnotePeleExport?: {
    status: 'pending' | 'complete' | 'error';
    message?: string;
  };
};

type PrintLayoutWindow = Window & {
  __crossnotePrintLayoutReady?: boolean;
};

export interface HTMLTemplateOption {
  /**
   * whether is for print.
   */
  isForPrint: boolean;
  /**
   * whether is for prince export.
   */
  isForPrince: boolean;
  /**
   * whether for offline use
   */
  offline: boolean;
  /**
   * Whether to inline local JS/CSS (and CSS `url()` fonts) into the
   * HTML instead of emitting `file://` links. Used by HTML (offline)
   * export so the file is portable, and by Open in Browser, whose temp
   * document sits outside the build directory's tree — Safari and
   * Firefox refuse to load cross-tree `file://` subresources, which
   * left the page unstyled and made KaTeX render twice (the MathML
   * copy and the unstyled HTML copy both visible). PDF keeps
   * `file://` links (Chromium loads them, and print docs stay small).
   */
  embedOfflineAssets?: boolean;
  /**
   * whether to embed local images as base64
   */
  embedLocalImages: boolean;
  /**
   * whether to embed svg images
   */
  embedSVG?: boolean;
  /**
   * Whether the HTML will be opened in a browser (e.g. "Open in Browser").
   * When true under WSL, file:// URLs are translated so Windows browsers
   * can reach WSL filesystem paths.  Export tools (puppeteer, prince,
   * ebook-convert) run inside WSL and must NOT use translated URLs.
   */
  isForBrowser?: boolean;
}

/**
 * Normalize code blocks produced by markdown-yo to the data-role="codeBlock"
 * format expected by all render enhancers (code-block-styling, fenced-diagrams,
 * fenced-math, fenced-code-chunks).
 *
 * markdown-yo outputs: <pre><code class="language-xxx">code</code></pre>
 * Enhancers expect:    <pre data-role="codeBlock" data-info="xxx"
 *                           data-parsed-info="..." data-normalized-info="...">
 *                        code
 *                      </pre>
 */
function normalizeMarkdownYoCodeBlocks($: CheerioAPI): void {
  $('pre:not([data-role="codeBlock"])').each((_i, pre) => {
    const $pre = $(pre);
    const $code = $pre.children('code').first();
    if (!$code.length) return;

    // Extract language from class="language-xxx" or "lang-xxx"
    const classes = ($code.attr('class') ?? '').split(/\s+/);
    let language = '';
    for (const cls of classes) {
      const m = cls.match(/^(?:language|lang)-(.+)$/);
      if (m) {
        language = m[1];
        break;
      }
    }

    const code = $code.text(); // decoded text
    const parsedInfo = parseBlockInfo(language);
    const normalizedInfo = normalizeBlockInfo(parsedInfo);

    // NOTE: .attr() adds to existing attributes; .html() only replaces inner
    // content. Any data-source-line set by markdown-yo's native sourceMap
    // feature is preserved on the <pre> element.
    $pre
      .attr('data-role', 'codeBlock')
      .attr('data-info', language)
      .attr('data-parsed-info', JSON.stringify(parsedInfo))
      .attr('data-normalized-info', JSON.stringify(normalizedInfo))
      .html(escape(code));
  });
}

/**
 * Normalize headings produced by markdown-yo.
 *
 * The transformer appends `{#id .class data-source-line="N"}` to headings for
 * markdown-it's attrs plugin. markdown-yo does not understand this syntax and
 * renders it as literal text. Strip the trailing `{...}` block and apply the
 * encoded attributes to the heading element instead.
 */
function normalizeMarkdownYoHeadings($: CheerioAPI): void {
  $('h1, h2, h3, h4, h5, h6').each((_i, heading) => {
    const $h = $(heading);
    const rawHtml = $h.html() ?? '';
    // Match a trailing {…} block at end of heading content
    const match = rawHtml.match(/^([\s\S]*?)\s*(\{[^{}]+\})\s*$/);
    if (!match) return;

    try {
      const attrs = parseBlockAttributes(match[2]);
      // Restore heading content without the {…} block
      $h.html(match[1]);

      if (attrs['id']) {
        $h.attr('id', String(attrs['id']));
      }
      if (attrs['class']) {
        $h.addClass(String(attrs['class']));
      }
      // Apply all remaining attributes (e.g. data-source-line)
      for (const [key, val] of Object.entries(attrs)) {
        if (key !== 'id' && key !== 'class' && key !== 'ignore') {
          $h.attr(key, String(val));
        }
      }
    } catch {
      // Leave heading as-is if attribute parsing fails
    }
  });
}

/**
 * Whether a `pandoc --version` output names a pandoc that understands
 * `--math-method`, which pandoc 3.11 introduced to replace the — now
 * deprecated, but still functional — `--mathjax` and `--katex` flags.
 * Older pandoc errors out on the new flag ("Unknown option"), so the
 * flags must be chosen per binary (#529).
 */
export function pandocVersionSupportsMathMethod(
  versionOutput: string,
): boolean {
  const match = versionOutput.match(/pandoc(?:\.exe)?\s+(\d+)\.(\d+)/i);
  if (!match) {
    return false;
  }
  const [major, minor] = [Number(match[1]), Number(match[2])];
  return major > 3 || (major === 3 && minor >= 11);
}

/**
 * Detected `--math-method` support per pandoc binary, so the version probe
 * (`pandoc --version`) runs once per pandocPath instead of once per render —
 * `pandocRender` executes on every parse when `markdownParser` is `pandoc`.
 * The promise is cached (not the boolean) so concurrent parses share one
 * probe. Any probe failure means "not supported": the deprecated flags work
 * on every pandoc, so falling back to them can never break a working setup.
 */
const PANDOC_MATH_METHOD_SUPPORT = new Map<string, Promise<boolean>>();

function pandocSupportsMathMethod(pandocPath: string): Promise<boolean> {
  let support = PANDOC_MATH_METHOD_SUPPORT.get(pandocPath);
  if (!support) {
    support = new Promise<boolean>((resolve) => {
      execFile(
        pandocPath,
        ['--version'],
        { timeout: 10_000, windowsHide: true },
        (error, stdout) => {
          resolve(!error && pandocVersionSupportsMathMethod(String(stdout)));
        },
      );
    });
    PANDOC_MATH_METHOD_SUPPORT.set(pandocPath, support);
  }
  return support;
}

/**
 * Whether an absolute filesystem path stays inside `parentDirectoryPath`.
 * Symlinks are resolved on both sides, so a link inside a directory
 * cannot pull in a file from outside it. The parent directory itself
 * doesn't count — it is a directory, not a loadable file.
 */
function isPathInsideDirectory(
  parentDirectoryPath: string,
  filePath: string,
): boolean {
  const realpath = (p: string) => {
    try {
      return fs.realpathSync(p);
    } catch {
      return p;
    }
  };
  const relative = path.relative(
    realpath(parentDirectoryPath),
    realpath(filePath),
  );
  return (
    relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
  );
}

/**
 * Whether `filePath` is an existing regular file. Used to gate script src
 * resolution: a candidate that isn't a readable file is dropped instead of
 * being emitted as a broken (or directory) URL.
 */
function isExistingFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * The values of attributes as a browser reads them where they are written as
 * the values of attributes: a character reference in one, such as `&amp;`,
 * is decoded — as it was while the attributes of a slide were written into
 * the page as text.
 */
function readAttributeValues(attributes: Record<string, string>) {
  const tag = cheerio.load(
    `<p ${Object.entries(attributes)
      .map(([name, value]) => `${name}="${value.replace(/"/g, '&quot;')}"`)
      .join(' ')}></p>`,
  );
  return tag('p').attr() ?? {};
}

// NOTE: The order of the following matters.
const dependentLibraryMaterials = [
  { key: 'vega', version: '5.25.0' },
  { key: 'vega-lite', version: '5.16.1' },
  { key: 'vega-embed', version: '6.23.0' },
];

/**
 * Whether a rendered document holds a pele diagram: the `div` of class `pele`
 * that a `pele` code block becomes (src/render-enhancers/fenced-diagrams.ts),
 * wherever the class stands among the block's attributes.
 */
const PELE_DIAGRAM = /<div\b[^>]*\sclass="[^"]*\bpele\b[^"]*"/;

/**
 * The attributes of a slide that are the address of its background. reveal.js
 * loads each in an element of its own, an iframe for the last.
 */
const SLIDE_BACKGROUNDS = [
  'data-background-image',
  'data-background-video',
  'data-background-iframe',
];

/**
 * The keys of a slide configuration that are not written as they are: the
 * number of the marker and the line of the slide are not attributes of the
 * slide, and the place of the slide in the deck and its source line are
 * written by crossnote. Spelled in lower case.
 */
const NOT_SLIDE_ATTRIBUTES = new Set([
  SLIDE_MARKER_NUMBER.toLowerCase(),
  'lineno',
  'class',
  'id',
  'data-h',
  'data-v',
  'data-source-line',
]);

/**
 * The name an attribute can have. Any other key of block attributes is left
 * out: written into the tag of its element, it would end the tag there.
 */
const ATTRIBUTE_NAME = /^[a-z_:][a-z0-9:._-]*$/i;

/**
 * The markdown engine that can be used to parse markdown and export files
 */
export class MarkdownEngine {
  /**
   * markdown file absolute path
   */
  private readonly filePath: string;
  private readonly fileDirectoryPath: string;
  private readonly projectDirectoryPath: URI;
  private readonly notebook: Notebook;
  private readonly fs: FileSystemApi;

  private headings: HeadingData[];
  private tocHTML: string;

  /**
   * Dirty variable just made for VSCode preview.
   */
  private vscodePreviewPanel: vscode.WebviewPanel | null | undefined;

  // caches
  private graphsCache: { [key: string]: string } = {};

  // code chunks
  private codeChunksData: { [key: string]: CodeChunkData } = {};

  // files cache
  private filesCache: { [key: string]: string } = {};

  /**
   * cachedHTML is the cache of html generated from the markdown file.
   */
  // private cachedHTML:string = '';

  /**
   * Check whether the preview is in presentation mode.
   */
  public isPreviewInPresentationMode: boolean = false;

  constructor({ filePath, notebook }: MarkdownEngineConstructorArgs) {
    this.filePath = filePath;
    this.notebook = notebook;
    this.fileDirectoryPath = path.dirname(this.filePath);
    this.projectDirectoryPath =
      this.notebook.notebookPath || this.fileDirectoryPath;
    this.fs = this.notebook.fs;

    this.headings = [];
    this.tocHTML = '';
  }

  /**
   * The configuration MathJax is given for a page: a copy, for what a page
   * sets on it stays out of the notebook's configuration.
   */
  private mathJaxConfig(): Record<string, unknown> {
    const config = this.notebook.config;
    return mathJaxConfigOf(copy({ ...config.mathjaxConfig }), config);
  }

  private get protocolsWhiteListRegExp() {
    // protocal whitelist
    const protocolsWhiteList = (
      this.notebook.config.protocolsWhiteList ??
      getDefaultNotebookConfig().protocolsWhiteList ??
      ''
    )
      .split(',')
      .map((x) => x.trim());
    return new RegExp('^(' + protocolsWhiteList.join('|') + ')'); // eg /^(http:\/\/|https:\/\/|atom:\/\/|file:\/\/|mailto:|tel:)/
  }

  public cacheCodeChunkResult(id: string, result: string) {
    const codeChunkData = this.codeChunksData[id];
    if (!codeChunkData) {
      return;
    }
    codeChunkData.result = CryptoJS.AES.decrypt(result, 'crossnote').toString(
      CryptoJS.enc.Utf8,
    );
  }

  /**
   * Generate scripts string for preview usage.
   */
  private generateScriptsForPreview(
    isForPresentation: boolean = false,
    yamlConfig: Record<string, unknown> = {},
    vscodePreviewPanel: vscode.WebviewPanel | null = null,
  ) {
    let scripts = '';

    // prevent `id="exports"` element from linked to `window` object.
    scripts += `<script>var exports = undefined</script>`;

    // mermaid
    // The shim must precede the bundle: mermaid calls globals that the
    // oldest supported webview lacks (see ./mermaid-polyfill.ts).
    scripts += MERMAID_LEGACY_WEBVIEW_POLYFILL;
    scripts += `<script type="text/javascript" src="${utility.addFileProtocol(
      path.resolve(
        utility.getCrossnoteBuildDirectory(),
        `./dependencies/mermaid/mermaid.min.js`,
      ),
      vscodePreviewPanel,
    )}" charset="UTF-8"></script>`;
    // TODO: If ZenUML gets integrated into mermaid in the future,
    //      we can remove the following lines.
    scripts += `<script type="module">
    import zenuml from 'https://cdn.jsdelivr.net/npm/@mermaid-js/mermaid-zenuml@0.1.0/dist/mermaid-zenuml.esm.min.mjs';
    await mermaid.registerExternalDiagrams([zenuml]);
  </script>`;

    // pele
    // `pele` code blocks hold Mermaid syntax that pele draws
    // (src/webview/lib/pele.ts). Like mermaid, its bundle is loaded for every
    // preview: the document can gain a diagram with the next keystroke.
    scripts += `<script type="text/javascript" src="${utility.addFileProtocol(
      path.resolve(
        utility.getCrossnoteBuildDirectory(),
        './dependencies/pele/pele.global.js',
      ),
      vscodePreviewPanel,
    )}" charset="UTF-8"></script>`;

    // wavedrome
    scripts += `<script type="text/javascript" src="${utility.addFileProtocol(
      path.resolve(
        utility.getCrossnoteBuildDirectory(),
        './dependencies/wavedrom/skins/default.js',
      ),
      vscodePreviewPanel,
    )}" charset="UTF-8"></script>`;
    scripts += `<script type="text/javascript" src="${utility.addFileProtocol(
      path.resolve(
        utility.getCrossnoteBuildDirectory(),
        './dependencies/wavedrom/skins/narrow.js',
      ),
      vscodePreviewPanel,
    )}" charset="UTF-8"></script>`;
    scripts += `<script type="text/javascript" src="${utility.addFileProtocol(
      path.resolve(
        utility.getCrossnoteBuildDirectory(),
        './dependencies/wavedrom/wavedrom.min.js',
      ),
      vscodePreviewPanel,
    )}" charset="UTF-8"></script>`;

    // tikzjax (for client-side TikZ rendering in web extension)
    if (utility.isVSCodeWebExtension()) {
      scripts += `<link rel="stylesheet" type="text/css" href="https://tikzjax.com/v1/fonts.css">`;
      scripts += `<script src="https://tikzjax.com/v1/tikzjax.js"></script>`;
      // Expose tikzjax's window.onload handler as window.tikzjaxRender so the
      // webview can re-trigger it after dynamically inserting markdown content.
      // tikzjax sets window.onload synchronously, so this script (which follows
      // in document order) runs after that assignment.
      scripts += `<script>window.tikzjaxRender = function() { return typeof window.onload === 'function' ? window.onload.call(window) : Promise.resolve(); };</script>`;
    }

    // math
    if (
      this.notebook.config.mathRenderingOption === 'MathJax' ||
      this.notebook.config.markdownParser === 'pandoc'
    ) {
      const mathJaxConfig = this.mathJaxConfig();

      // https://docs.mathjax.org/en/latest/options/startup/startup.html#the-configuration-block
      // Disable typesetting on startup
      const startupConfig = (mathJaxConfig['startup'] || {}) as Record<
        string,
        unknown
      >;
      mathJaxConfig['startup'] = startupConfig;
      if (!isForPresentation) {
        startupConfig['typeset'] = false;
        startupConfig['elements'] = ['.hidden-preview']; // Only render on this element
      }

      scripts += `<script type="text/javascript"> ${buildMathJaxConfigScript(
        mathJaxConfig,
      )} </script>`;
      scripts += `<script type="text/javascript" defer src="${this.notebook.config.mathjaxScriptSrc}" charset="UTF-8"></script>`;
    }

    // reveal.js
    let presentationInitScript = '';
    if (isForPresentation) {
      scripts += `<script src='${utility.addFileProtocol(
        path.resolve(
          utility.getCrossnoteBuildDirectory(),
          './dependencies/reveal/js/reveal.js',
        ),
        vscodePreviewPanel,
      )}'></script>`;

      let presentationConfig: Record<string, unknown> = {};
      const presentationValue = yamlConfig['presentation'];
      if (
        typeof presentationValue === 'object' &&
        presentationValue !== null &&
        !Array.isArray(presentationValue)
      ) {
        presentationConfig = presentationValue as Record<string, unknown>;
      }
      if (typeof presentationConfig !== 'object') {
        presentationConfig = {};
      }
      let dependencies = presentationConfig['dependencies'] || [];
      if (!(dependencies instanceof Array)) {
        dependencies = [];
      }
      presentationConfig['dependencies'] = dependencies;

      presentationInitScript += `
        await Reveal.initialize(${jsonForScript({
          margin: 0.1,
          // reveal.js 5+ switches narrow decks to its scroll view; keep the
          // paginated layout of earlier versions when the preview pane is
          // narrow (`view: 'scroll'` still opts in explicitly).
          scrollActivationWidth: null,
          ...presentationConfig,
        })})
        // NOTE: We have to add the promise below otherwise
        // initPresentationEvents in preview.ts will have problem slide to the correct slide.
        await new Promise((resolve)=> setTimeout(resolve, 200))
      `;
    }

    // mermaid init
    scripts += `<script>
var MERMAID_CONFIG = (${JSON.stringify(this.notebook.config.mermaidConfig)});
if (typeof MERMAID_CONFIG !== 'undefined') {
  MERMAID_CONFIG.startOnLoad = false
  MERMAID_CONFIG.cloneCssStyles = false
  MERMAID_CONFIG.theme = MERMAID_CONFIG.theme || "${this.notebook.config.mermaidTheme}"
}
mermaid.initialize(MERMAID_CONFIG || {})
// The diagrams of a presentation are rendered by the preview, slide by slide
// (initPresentationEvent in src/webview/containers/preview.ts).
</script>`;

    // wavedrom init script
    if (isForPresentation) {
      presentationInitScript += `
  WaveDrom.ProcessAll()
    `;
    }

    // vega
    dependentLibraryMaterials.forEach(({ key }) => {
      scripts += `<script src="${utility.addFileProtocol(
        path.resolve(
          utility.getCrossnoteBuildDirectory(),
          `./dependencies/${key}/${key}.min.js`,
        ),
        vscodePreviewPanel,
      )}" charset="UTF-8"></script>`;
    });

    if (isForPresentation) {
      presentationInitScript += `
      var vegaEls = document.querySelectorAll('.vega, .vega-lite');
      function reportVegaError(el, error) {
        el.innerHTML = '<pre class="language-text"><code>' + error.toString() + '</code></pre>'
      }
      for (var i = 0; i < vegaEls.length; i++) {
        const vegaEl = vegaEls[i]
        if (vegaEl.hasAttribute("data-processed")) {
          continue;
        }
        try {
          var spec = JSON.parse(vegaEl.textContent);
          vegaEmbed(vegaEl, spec, { actions: false, renderer: 'svg' })
          .catch(function(error) {
            reportVegaError(vegaEl, error);
          })
        } catch (error) {
          reportVegaError(vegaEl, error);
        }
      }`;
    }

    presentationInitScript = `<script>
window["initRevealPresentation"] = async function() {
  ${presentationInitScript}
}
</script>`;

    return scripts + presentationInitScript;
  }

  /**
   * Map preview theme to prism theme.
   */
  static AutoPrismThemeMap = {
    'atom-dark.css': 'atom-dark.css',
    'atom-light.css': 'atom-light.css',
    'atom-material.css': 'atom-material.css',
    'github-dark.css': 'github-dark.css',
    'github-light.css': 'github.css',
    'gothic.css': 'github.css',
    'medium.css': 'github.css',
    'monokai.css': 'monokai.css',
    'newsprint.css': 'pen-paper-coffee.css', // <= this is bad
    'night.css': 'darcula.css', // <= this is bad
    'one-dark.css': 'one-dark.css',
    'one-light.css': 'one-light.css',
    'solarized-light.css': 'solarized-light.css',
    'solarized-dark.css': 'solarized-dark.css',
    'vue.css': 'vue.css',
    'vscode.css': 'vscode.css',
  };

  static AutoPrismThemeMapForPresentation = {
    'beige.css': 'pen-paper-coffee.css',
    'black.css': 'one-dark.css',
    'black-contrast.css': 'one-dark.css',
    'blood.css': 'monokai.css',
    'dracula.css': 'one-dark.css',
    'league.css': 'okaidia.css',
    'moon.css': 'funky.css',
    'night.css': 'atom-dark.css',
    'serif.css': 'github.css',
    'simple.css': 'github.css',
    'sky.css': 'default.css',
    'solarized.css': 'solarized-light.css',
    'white.css': 'default.css',
    'white-contrast.css': 'default.css',
    'vscode.css': 'vscode.css',
  };

  /**
   * Resolve VS Code-only themes to standard fallbacks for export contexts
   * where VS Code CSS variables are not available.
   */
  private static resolveThemeForExport(
    theme: string,
    type: 'preview' | 'codeBlock' | 'revealjs',
  ): string {
    if (theme !== 'vscode.css') {
      return theme;
    }
    switch (type) {
      case 'preview':
        return 'github-light.css';
      case 'codeBlock':
        return 'default.css';
      case 'revealjs':
        return 'white.css';
    }
  }

  /**
   * Preview themes that ship in light/dark pairs (atom, github, one,
   * solarized). Screen exports with `exportColorScheme: 'auto'` embed
   * both variants so the exported document follows the reader's system
   * color scheme. Maps each theme file to its counterpart; themes
   * without an entry have no pair.
   */
  private static PreviewThemeColorCounterparts: Record<string, string> = {
    'atom-light.css': 'atom-dark.css',
    'atom-dark.css': 'atom-light.css',
    'github-light.css': 'github-dark.css',
    'github-dark.css': 'github-light.css',
    'one-light.css': 'one-dark.css',
    'one-dark.css': 'one-light.css',
    'solarized-light.css': 'solarized-dark.css',
    'solarized-dark.css': 'solarized-light.css',
  };

  /**
   * Same idea for code block (prism) themes. Note the github pair is
   * `github.css` (light) / `github-dark.css`, unlike the preview themes.
   */
  private static PrismThemeColorCounterparts: Record<string, string> = {
    'atom-light.css': 'atom-dark.css',
    'atom-dark.css': 'atom-light.css',
    'github.css': 'github-dark.css',
    'github-dark.css': 'github.css',
    'one-light.css': 'one-dark.css',
    'one-dark.css': 'one-light.css',
    'solarized-light.css': 'solarized-dark.css',
    'solarized-dark.css': 'solarized-light.css',
  };

  /**
   * A theme name that is safe to interpolate into an asset path. The theme
   * of a presentation and of an eBook comes from front matter, and offline
   * exports read the resolved file and inline it into the output — only a
   * bare `<name>.css` basename is ever allowed through.
   */
  private static readonly safeThemeFilename = /^[A-Za-z0-9_-]+\.css$/;

  /**
   * The file of a theme named by a note — a presentation's or an eBook's:
   * its name where it is a string that is a bare `<name>.css`, and
   * `fallback` otherwise.
   */
  private static themeFileOf(theme: unknown, fallback: string): string {
    return typeof theme === 'string' &&
      MarkdownEngine.safeThemeFilename.test(theme)
      ? theme
      : fallback;
  }

  /**
   * The dark variant of a paired theme, for screen exports with
   * `exportColorScheme: 'auto'`: the light variant applies by default
   * and the dark variant is embedded under
   * `@media (prefers-color-scheme: dark)` — so the exported document and
   * GitHub-style `<picture>` images follow the reader's system color
   * scheme. `counterparts` is one of the maps above; returns null when
   * the theme has no light/dark pair.
   */
  private static darkVariantOf(
    theme: string,
    counterparts: Record<string, string>,
  ): string | null {
    const counterpart = counterparts[theme];
    if (!counterpart) {
      return null;
    }
    return theme.endsWith('-dark.css') ? theme : counterpart;
  }

  /**
   * Automatically pick code block theme for preview.
   */
  private getPrismTheme(
    isPresentationMode: boolean = false,
    yamlConfig: Record<string, unknown> = {},
  ) {
    if (this.notebook.config.codeBlockTheme === 'auto.css') {
      /**
       * Automatically pick code block theme for preview.
       */
      if (isPresentationMode) {
        const presentationObj =
          typeof yamlConfig['presentation'] === 'object' &&
          yamlConfig['presentation'] !== null &&
          !Array.isArray(yamlConfig['presentation'])
            ? (yamlConfig['presentation'] as Record<string, unknown>)
            : null;
        const presentationTheme =
          (presentationObj?.['theme'] as string | undefined) ??
          this.notebook.config.revealjsTheme;
        return (
          (
            MarkdownEngine.AutoPrismThemeMapForPresentation as Record<
              string,
              string
            >
          )[presentationTheme] ?? 'default.css'
        );
      } else {
        return (
          (MarkdownEngine.AutoPrismThemeMap as Record<string, string>)[
            this.notebook.config.previewTheme as string
          ] ?? 'default.css'
        );
      }
    } else {
      return this.notebook.config.codeBlockTheme;
    }
  }

  /**
   * Generate styles string for preview usage.
   */
  private generateStylesForPreview(
    isPresentationMode: boolean = false,
    yamlConfig: Record<string, unknown> = {},
    vscodePreviewPanel: vscode.WebviewPanel | null = null,
  ) {
    let styles = '';

    // check math
    if (
      this.notebook.config.mathRenderingOption === 'KaTeX' &&
      this.notebook.config.markdownParser !== 'pandoc'
    ) {
      styles += `<link rel="stylesheet" href="${utility.addFileProtocol(
        path.resolve(
          utility.getCrossnoteBuildDirectory(),
          './dependencies/katex/katex.min.css',
        ),
        vscodePreviewPanel,
      )}">`;
    }

    // check font-awesome
    styles += `<link rel="stylesheet" href="${utility.addFileProtocol(
      path.resolve(
        utility.getCrossnoteBuildDirectory(),
        `./dependencies/font-awesome/css/all.min.css`,
      ),
      vscodePreviewPanel,
    )}">`;

    // check preview theme and revealjs theme
    if (!isPresentationMode) {
      styles += `<link rel="stylesheet" href="${utility.addFileProtocol(
        path.resolve(
          utility.getCrossnoteBuildDirectory(),
          `./styles/preview_theme/${this.notebook.config.previewTheme}`,
        ),
        vscodePreviewPanel,
      )}">`;
    } else {
      styles += `<link rel="stylesheet" href="${utility.addFileProtocol(
        path.resolve(
          utility.getCrossnoteBuildDirectory(),
          './dependencies/reveal/css/reveal.css',
        ),
        vscodePreviewPanel,
      )}" >`;
      styles += `<link rel="stylesheet" href="${utility.addFileProtocol(
        path.resolve(
          utility.getCrossnoteBuildDirectory(),
          `./dependencies/reveal/css/theme/${(() => {
            const presObj =
              typeof yamlConfig['presentation'] === 'object' &&
              yamlConfig['presentation'] !== null &&
              !Array.isArray(yamlConfig['presentation'])
                ? (yamlConfig['presentation'] as Record<string, unknown>)
                : null;
            return (
              (presObj?.['theme'] as string | undefined) ??
              this.notebook.config.revealjsTheme
            );
          })()}`,
        ),
        vscodePreviewPanel,
      )}" >`;
    }

    // check prism
    styles += `<link rel="stylesheet" href="${utility.addFileProtocol(
      path.resolve(
        utility.getCrossnoteBuildDirectory(),
        `./styles/prism_theme/${this.getPrismTheme(
          isPresentationMode,
          yamlConfig,
        )}`,
      ),
      vscodePreviewPanel,
    )}">`;

    // style template
    styles += `<link rel="stylesheet" media="screen" href="${utility.addFileProtocol(
      path.resolve(
        utility.getCrossnoteBuildDirectory(),
        './styles/style-template.css',
      ),
      vscodePreviewPanel,
    )}">`;

    // style markdown-it-admonition
    styles += `<link rel="stylesheet" media="screen" href="${utility.addFileProtocol(
      path.resolve(
        utility.getCrossnoteBuildDirectory(),
        './styles/markdown-it-admonition.css',
      ),
      vscodePreviewPanel,
    )}">`;

    // style markdown-it-callout
    styles += `<link rel="stylesheet" media="screen" href="${utility.addFileProtocol(
      path.resolve(
        utility.getCrossnoteBuildDirectory(),
        './styles/markdown-it-callout.css',
      ),
      vscodePreviewPanel,
    )}">`;

    // global styles
    styles += `<style>${this.resolvePathsInStyles(
      this.notebook.config.globalCss,
      vscodePreviewPanel,
    )}</style>`;

    return styles;
  }

  /**
   * Generate <style> and <link> string from an array of file paths.
   * @param JSAndCssFiles
   */
  private generateJSAndCssFilesForPreview(
    JSAndCssFiles: string[] = [],
    vscodePreviewPanel: vscode.WebviewPanel | null = null,
  ) {
    let output = '';
    JSAndCssFiles.forEach((sourcePath) => {
      // `@import "*.js"` in a note is untrusted content and used to load
      // arbitrary scripts — including remote https:// URLs — into the
      // preview webview, where they run before the React app and any
      // CSP/DOMPurify defenses. Scripts are only emitted when the host
      // application opted in via `notebook.previewScriptsEnabled`, and
      // only for files that resolve inside the notebook directory.
      // Stylesheets keep their original behavior.
      if (sourcePath.endsWith('.js')) {
        if (
          !this.notebook.previewScriptsEnabled ||
          sourcePath.startsWith('//') ||
          /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(sourcePath)
        ) {
          return;
        }
        const resolvedPath =
          sourcePath[0] === '/'
            ? path.resolve(this.projectDirectoryPath.fsPath, '.' + sourcePath)
            : path.resolve(this.fileDirectoryPath, sourcePath);
        if (!this.isPathInsideProjectDirectory(resolvedPath)) {
          return;
        }
        output += `<script type="text/javascript" src="${utility.addFileProtocol(
          resolvedPath,
          vscodePreviewPanel,
        )}"></script>`;
        return;
      }

      // css
      let absoluteFilePath = sourcePath;
      if (sourcePath[0] === '/') {
        absoluteFilePath = utility.addFileProtocol(
          path.resolve(this.projectDirectoryPath.fsPath, '.' + sourcePath),
          vscodePreviewPanel,
        );
      } else if (
        sourcePath.match(/^file:\/\//) ||
        sourcePath.match(/^https?:\/\//)
      ) {
        // do nothing
      } else {
        absoluteFilePath = utility.addFileProtocol(
          path.resolve(this.fileDirectoryPath, sourcePath),
          vscodePreviewPanel,
        );
      }
      output += `<link rel="stylesheet" href="${absoluteFilePath}">`;
    });
    return output;
  }

  /**
   * Whether an absolute filesystem path stays inside the notebook
   * directory. Used to constrain user-provided preview scripts to
   * workspace-local files — symlinks are resolved so a link inside the
   * workspace cannot pull in a script from outside it.
   */
  private isPathInsideProjectDirectory(filePath: string): boolean {
    return isPathInsideDirectory(this.projectDirectoryPath.fsPath, filePath);
  }

  /**
   * Generate html template for preview.
   */
  public async generateHTMLTemplateForPreview({
    inputString = '',
    body = '',
    webviewScript = '',
    scripts = '',
    styles = '',
    head = `<base href="${escape(this.filePath)}">`,
    config,
    vscodePreviewPanel = null,
    contentSecurityPolicy = '',
    isVSCodeWebExtension,
    parsedOutput,
  }: {
    inputString?: string;
    body?: string;
    webviewScript?: string;
    scripts?: string;
    styles?: string;
    head?: string;
    config: WebviewConfig;
    vscodePreviewPanel: vscode.WebviewPanel | null | undefined;
    contentSecurityPolicy?: string;
    isVSCodeWebExtension?: boolean;
    /**
     * Reuse an existing `parseMD` result (rendered with the same preview
     * options this template would use) instead of parsing `inputString`
     * again. Callers that need the parsed output anyway — e.g. the wiki
     * builder, which also ships it as the `updateHtml` payload — avoid the
     * double render this way.
     */
    parsedOutput?: MarkdownEngineOutput;
  }): Promise<string> {
    if (!inputString && !parsedOutput) {
      inputString = await this.fs.readFile(this.filePath);
    }
    let webviewCss = '';
    if (!webviewScript) {
      webviewScript = utility.addFileProtocol(
        path.resolve(
          utility.getCrossnoteBuildDirectory(),
          './webview/preview.js',
        ),
        vscodePreviewPanel,
      );
      webviewCss = utility.addFileProtocol(
        path.resolve(
          utility.getCrossnoteBuildDirectory(),
          './webview/preview.css',
        ),
        vscodePreviewPanel,
      );
    }
    if (!body) {
      // default body
      body = ``;
    }

    const { yamlConfig, JSAndCssFiles, html } =
      parsedOutput ??
      (await this.parseMD(inputString, {
        isForPreview: true,
        useRelativeFilePath: false,
        hideFrontMatter: false,
        vscodePreviewPanel,
      }));
    const isPresentationMode = yamlConfig['isPresentationMode'] as boolean;

    const htmlTemplate = `<!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="Content-type" content="text/html;charset=UTF-8">
        <meta id="crossnote-data" data-config="${escape(
          JSON.stringify({ ...this.notebook.config, ...config }),
        )}" data-time="${Date.now()}">
        <meta charset="UTF-8">
        ${
          contentSecurityPolicy
            ? `<meta
          http-equiv="Content-Security-Policy"
          content="${contentSecurityPolicy}"
        />`
            : ''
        }
        ${this.generateStylesForPreview(
          isPresentationMode,
          yamlConfig,
          vscodePreviewPanel,
        )}
        <link rel="stylesheet" href="${webviewCss}">
        ${styles}
        ${
          // NOTE: This is none.css and we are in vscode preview.
          // We need to set the background color and foreground color.
          this.notebook.config.previewTheme === 'none.css' && vscodePreviewPanel
            ? `<style>
  html, body {
    background-color: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
  }

  pre code {
    color: var(--vscode-editor-foreground);
    tab-size: 4;
  }
  </style>
`
            : ''
        }
        <link rel="stylesheet" href="${utility.addFileProtocol(
          path.resolve(
            utility.getCrossnoteBuildDirectory(),
            './styles/preview.css',
          ),
          vscodePreviewPanel,
        )}">
        ${this.generateJSAndCssFilesForPreview(
          JSAndCssFiles,
          vscodePreviewPanel,
        )}
        ${await this.resolvePathsInHeader(
          this.notebook.config.includeInHeader,
          {
            allowScripts: this.notebook.previewScriptsEnabled,
            vscodePreviewPanel,
          },
        )}
        ${head}
      </head>
      <body class="preview-container ${
        isVSCodeWebExtension ? 'vscode-web-extension' : ''
      } ${config.isWiki ? 'wiki-readonly' : ''}" data-html="${escape(html)}" ${
        isPresentationMode ? 'data-presentation-mode' : ''
      }>
        ${body}
      </body>
      ${this.generateScriptsForPreview(
        isPresentationMode,
        yamlConfig,
        vscodePreviewPanel,
      )}
      ${scripts}
      <script src="${webviewScript}"></script>
      </html>`;

    return htmlTemplate;
  }

  /**
   * Generate a minimal HTML template for the graph view webview.
   * Unlike generateHTMLTemplateForPreview, this does not parse any markdown —
   * it just creates a shell that loads graph-view.js.
   */
  public generateHTMLTemplateForGraphView({
    vscodePreviewPanel,
    contentSecurityPolicy = '',
  }: {
    vscodePreviewPanel: vscode.WebviewPanel | null | undefined;
    contentSecurityPolicy?: string;
  }): string {
    const webviewScript = utility.addFileProtocol(
      path.resolve(
        utility.getCrossnoteBuildDirectory(),
        './webview/graph-view.js',
      ),
      vscodePreviewPanel,
    );
    const webviewCss = utility.addFileProtocol(
      path.resolve(
        utility.getCrossnoteBuildDirectory(),
        './webview/graph-view.css',
      ),
      vscodePreviewPanel,
    );

    return `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-type" content="text/html;charset=UTF-8">
  <meta charset="UTF-8">
  ${
    contentSecurityPolicy
      ? `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}" />`
      : ''
  }
  <link rel="stylesheet" href="${webviewCss}">
  <style>
    html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <script src="${webviewScript}"></script>
</body>
</html>`;
  }

  /**
   * Generate HTML content
   * @param html: this is the final content you want to put.
   * @param yamlConfig: this is the front matter.
   * @param option: HTMLTemplateOption
   */
  public async generateHTMLTemplateForExport(
    html: string,
    yamlConfig: Record<string, unknown> = {},
    options: HTMLTemplateOption,
  ): Promise<string> {
    // Build file:// URLs.  Only translate for WSL when opening in a browser.
    const fileURL = (p: string) =>
      utility.toFileURL(p, { useWSL: !!options.isForBrowser });
    const embedAssets = !!(options.offline && options.embedOfflineAssets);
    const depPath = (...parts: string[]) =>
      path.resolve(utility.getCrossnoteBuildDirectory(), ...parts);
    const offlineStyle = async (rel: string): Promise<string> => {
      const abs = depPath(rel);
      if (embedAssets) {
        try {
          return await readOfflineCss(abs);
        } catch {
          // Unreadable asset (e.g. a stale or partial build directory) —
          // fall back to the file:// link instead of failing the export.
        }
      }
      return `<link rel="stylesheet" href="${fileURL(abs)}">`;
    };
    const offlineScript = async (rel: string): Promise<string> => {
      const abs = depPath(rel);
      if (embedAssets) {
        try {
          return await readOfflineJs(abs);
        } catch {
          // Same fallback as offlineStyle.
        }
      }
      return `<script type="text/javascript" src="${fileURL(
        abs,
      )}" charset="UTF-8"></script>`;
    };

    // get `id` and `class`: a class of the front matter is a name or a list
    // of them; anything else that is not nothing is written as its text.
    const elementId = (yamlConfig['id'] as string) || '';
    const classes = yamlConfig['class'] as string | string[] | undefined;
    const elementClass = Array.isArray(classes)
      ? classes.join(' ')
      : String(classes || '');

    // math style and script
    let mathStyle: string;
    if (
      this.notebook.config.mathRenderingOption === 'MathJax' ||
      this.notebook.config.markdownParser === 'pandoc'
    ) {
      const mathJaxConfig = this.mathJaxConfig();

      if (options.offline) {
        mathStyle = `
        <script type="text/javascript">
          ${buildMathJaxConfigScript(mathJaxConfig)}
        </script>
        <script type="text/javascript" defer src="${
          this.notebook.config.mathjaxScriptSrc
        }" charset="UTF-8"></script>
        `;
      } else {
        mathStyle = `
        <script type="text/javascript">
          ${buildMathJaxConfigScript(mathJaxConfig)}
        </script>
        <script type="text/javascript" defer src="${
          this.notebook.config.mathjaxScriptSrc
        }"></script>
        `;
      }
    } else if (this.notebook.config.mathRenderingOption === 'KaTeX') {
      if (options.offline) {
        mathStyle = await offlineStyle('./dependencies/katex/katex.min.css');
      } else {
        mathStyle = `<link rel="stylesheet" href="https://${this.notebook.config.jsdelivrCdnHost}/npm/katex@0.19.1/dist/katex.min.css">`;
      }
    } else {
      mathStyle = '';
    }

    // font-awesome
    let fontAwesomeStyle = '';
    if (html.indexOf('<i class="fa') >= 0) {
      if (options.offline) {
        fontAwesomeStyle = await offlineStyle(
          './dependencies/font-awesome/css/all.min.css',
        );
      } else {
        fontAwesomeStyle = `<link rel="stylesheet" href="https://${this.notebook.config.jsdelivrCdnHost}/npm/@fortawesome/fontawesome-free@6.4.2/css/all.min.css">`;
      }
    }

    // mermaid
    let mermaidScript = '';
    let mermaidInitScript = '';
    if (html.indexOf(' class="mermaid') >= 0) {
      // The shim must precede the bundle in both offline and CDN modes:
      // mermaid calls globals that the oldest supported webview lacks
      // (see ./mermaid-polyfill.ts).
      mermaidScript = MERMAID_LEGACY_WEBVIEW_POLYFILL;
      if (options.offline) {
        mermaidScript += await offlineScript(
          './dependencies/mermaid/mermaid.min.js',
        );
      } else {
        mermaidScript += `<script src="https://${this.notebook.config.jsdelivrCdnHost}/npm/mermaid@12.4.0/dist/mermaid.min.js"></script>`;
      }

      mermaidInitScript = `<script type="module">${buildMermaidExportScript(
        this.notebook.config,
        /zenuml/i.test(html),
      )}</script>`;
    }

    // pele
    // (a `pele` code block: Mermaid syntax drawn by the pele bundle)
    let peleScript = '';
    let peleInitScript = '';
    if (PELE_DIAGRAM.test(html)) {
      if (options.offline) {
        peleScript = await offlineScript('./dependencies/pele/pele.global.js');
      } else {
        peleScript = `<script src="https://${this.notebook.config.jsdelivrCdnHost}/npm/pele@1.13.0/dist/pele.global.js"></script>`;
      }
      // A classic script: pele draws synchronously, so the diagrams are in
      // place as soon as the script has run.
      peleInitScript = `<script>${buildPeleExportScript()}</script>`;
    }

    // wavedrom
    let wavedromScript = ``;
    let wavedromInitScript = ``;
    if (html.indexOf(' class="wavedrom') >= 0) {
      if (options.offline) {
        wavedromScript += await offlineScript(
          './dependencies/wavedrom/skins/default.js',
        );
        wavedromScript += await offlineScript(
          './dependencies/wavedrom/skins/narrow.js',
        );
        wavedromScript += await offlineScript(
          './dependencies/wavedrom/wavedrom.min.js',
        );
      } else {
        wavedromScript += `<script type="text/javascript" src="https://${this.notebook.config.jsdelivrCdnHost}/npm/wavedrom@3.3.0/skins/default.js"></script>`;
        wavedromScript += `<script type="text/javascript" src="https://${this.notebook.config.jsdelivrCdnHost}/npm/wavedrom@3.3.0/skins/narrow.js"></script>`;
        wavedromScript += `<script type="text/javascript" src="https://${this.notebook.config.jsdelivrCdnHost}/npm/wavedrom@3.3.0/wavedrom.min.js"></script>`;
      }
      wavedromInitScript = `<script>WaveDrom.ProcessAll()</script>`;
    }

    // tikzjax (client-side fallback for <script type="text/tikz"> blocks)
    let tikzjaxScript = '';
    let tikzjaxStyle = '';
    if (html.indexOf('type="text/tikz"') >= 0) {
      tikzjaxScript = `<script src="https://tikzjax.com/v1/tikzjax.js"></script>`;
      tikzjaxStyle = `<link rel="stylesheet" type="text/css" href="https://tikzjax.com/v1/fonts.css">`;
    }

    // vega and vega-lite with vega-embed
    // https://vega.github.io/vega/usage/#embed
    let vegaScript = ``;
    let vegaInitScript = ``;
    if (
      html.indexOf(' class="vega') >= 0 ||
      html.indexOf(' class="vega-lite') >= 0
    ) {
      for (const { key, version } of dependentLibraryMaterials) {
        vegaScript += options.offline
          ? await offlineScript(`./dependencies/${key}/${key}.min.js`)
          : `<script type="text/javascript" src="https://${this.notebook.config.jsdelivrCdnHost}/npm/${key}@${version}/build/${key}.js"></script>`;
      }

      vegaInitScript += `<script>
      var vegaEls = document.querySelectorAll('.vega, .vega-lite');
      function reportVegaError(el, error) {
        el.innerHTML = '<pre class="language-text"><code>' + error.toString() + '</code></pre>'
      }
      for (var i = 0; i < vegaEls.length; i++) {
        const vegaEl = vegaEls[i]
        if (vegaEl.hasAttribute("data-processed")) {
          continue;
        }
        try {
          var spec = JSON.parse(vegaEl.textContent);
          vegaEmbed(vegaEl, spec, { actions: false, renderer: 'svg' })
          .catch(function(error) {
            reportVegaError(vegaEl, error);
          })
        } catch (error) {
          reportVegaError(vegaEl, error);
        }
      }
      </script>`;
    }

    // presentation
    let presentationScript = '';
    let presentationStyle = '';
    let presentationInitScript = '';
    if (yamlConfig['isPresentationMode']) {
      if (options.offline) {
        presentationScript = await offlineScript(
          './dependencies/reveal/js/reveal.js',
        );
      } else {
        presentationScript = `
        <script src='https://${this.notebook.config.jsdelivrCdnHost}/npm/reveal.js@6.0.2/dist/reveal.js'></script>`;
      }

      const presentationConfigRaw = yamlConfig['presentation'];
      const presentationConfig: Record<string, unknown> =
        typeof presentationConfigRaw === 'object' &&
        presentationConfigRaw !== null &&
        !Array.isArray(presentationConfigRaw)
          ? { ...(presentationConfigRaw as Record<string, unknown>) }
          : {};
      const dependencies =
        (presentationConfig['dependencies'] as unknown[] | undefined) || [];

      // The speaker notes plugin. reveal.js 5+ has no plugin auto-loading:
      // the plugin script has to run before initialization and the plugin
      // (its `RevealNotes` global) has to be passed via `plugins`.
      let notesPlugin: [script: string, definition: string] | null = null;
      if (presentationConfig['enableSpeakerNotes']) {
        if (options.offline) {
          notesPlugin = [
            await offlineScript('./dependencies/reveal/plugin/notes/notes.js'),
            'window.RevealNotes',
          ];
        } else {
          notesPlugin = [
            `<script src="revealjs_deps/notes.js"></script>`, // copied next to the document by `htmlExport`
            'window.RevealNotes',
          ];
        }
      }
      presentationConfig['dependencies'] = dependencies;

      presentationStyle = `
      <style>
      ${await this.fs.readFile(
        path.resolve(
          utility.getCrossnoteBuildDirectory(),
          './dependencies/reveal/css/reveal.css',
        ),
      )}
      </style>
      ${presentationPrintStyle}
      `;
      presentationInitScript = `${notesPlugin?.[0] ?? ''}
      ${buildPresentationInitScript({
        presentationConfig,
        notesPlugin: notesPlugin?.[1],
        hasMermaid: !!mermaidInitScript,
      })}
      `;
    }

    // prince
    let princeClass = '';
    if (options.isForPrince) {
      princeClass = 'prince';
    }

    let title = path.basename(this.filePath);
    title = title.slice(0, title.length - path.extname(title).length); // remove '.md'
    if (yamlConfig['title']) {
      title = yamlConfig['title'] as string;
    }

    // prism and preview theme
    let styleCSS = '';
    // Set for screen exports with `exportColorScheme: 'auto'` and a
    // paired light/dark theme so the document (and <picture> elements)
    // follows the reader's system color scheme.
    let colorSchemeMeta = '';
    // Paper output (PDF via Chrome / Prince) keeps the intentional
    // forced-light page when printBackground is off; screen output
    // (browser / HTML export) instead respects the configured themes.
    const forceLightTheme =
      (options.isForPrint || options.isForPrince) &&
      !this.notebook.config.printBackground &&
      !yamlConfig['print_background'];
    // Screen exports render in the configured themes by default, so the
    // output looks the same on every machine. Following the reader's
    // system color scheme is opt-in — via the `exportColorScheme`
    // notebook config or front matter `html.export_color_scheme` — and
    // never applies to paper output.
    const htmlYamlConfig =
      typeof yamlConfig['html'] === 'object' &&
      yamlConfig['html'] !== null &&
      !Array.isArray(yamlConfig['html'])
        ? (yamlConfig['html'] as Record<string, unknown>)
        : null;
    const exportColorScheme =
      (htmlYamlConfig?.['export_color_scheme'] as string | undefined) ??
      this.notebook.config.exportColorScheme;
    const followSystemColorScheme =
      exportColorScheme === 'auto' && !forceLightTheme;
    try {
      // prism *.css
      if (forceLightTheme && !yamlConfig['isPresentationMode']) {
        styleCSS += await this.fs.readFile(
          path.resolve(
            utility.getCrossnoteBuildDirectory(),
            `./styles/prism_theme/github.css`,
          ),
        );
      } else {
        const prismTheme = MarkdownEngine.resolveThemeForExport(
          this.getPrismTheme(
            yamlConfig['isPresentationMode'] as boolean | undefined,
            yamlConfig,
          ),
          'codeBlock',
        );
        const darkPrismTheme = followSystemColorScheme
          ? MarkdownEngine.darkVariantOf(
              prismTheme,
              MarkdownEngine.PrismThemeColorCounterparts,
            )
          : null;
        if (darkPrismTheme) {
          colorSchemeMeta = '<meta name="color-scheme" content="light dark">';
          styleCSS += await this.fs.readFile(
            path.resolve(
              utility.getCrossnoteBuildDirectory(),
              `./styles/prism_theme/${prismTheme}`,
            ),
          );
          styleCSS += `@media (prefers-color-scheme: dark) {\n${await this.fs.readFile(
            path.resolve(
              utility.getCrossnoteBuildDirectory(),
              `./styles/prism_theme/${darkPrismTheme}`,
            ),
          )}\n}\n`;
        } else {
          styleCSS += await this.fs.readFile(
            path.resolve(
              utility.getCrossnoteBuildDirectory(),
              `./styles/prism_theme/${prismTheme}`,
            ),
          );
        }
      }

      if (yamlConfig['isPresentationMode']) {
        const presObj2 =
          typeof yamlConfig['presentation'] === 'object' &&
          yamlConfig['presentation'] !== null &&
          !Array.isArray(yamlConfig['presentation'])
            ? (yamlConfig['presentation'] as Record<string, unknown>)
            : null;
        const theme = MarkdownEngine.resolveThemeForExport(
          (presObj2?.['theme'] as string | undefined) ??
            this.notebook.config.revealjsTheme,
          'revealjs',
        );
        const safeTheme = MarkdownEngine.themeFileOf(theme, 'white.css');

        if (options.offline) {
          presentationStyle += await offlineStyle(
            `./dependencies/reveal/css/theme/${safeTheme}`,
          );
        } else {
          presentationStyle += `<link rel="stylesheet" href="https://${this.notebook.config.jsdelivrCdnHost}/npm/reveal.js@6.0.2/dist/theme/${safeTheme}">`;
        }
      } else {
        // preview theme
        const previewTheme = MarkdownEngine.resolveThemeForExport(
          this.notebook.config.previewTheme,
          'preview',
        );
        const darkPreviewTheme = followSystemColorScheme
          ? MarkdownEngine.darkVariantOf(
              previewTheme,
              MarkdownEngine.PreviewThemeColorCounterparts,
            )
          : null;
        if (forceLightTheme) {
          styleCSS += await this.fs.readFile(
            path.resolve(
              utility.getCrossnoteBuildDirectory(),
              `./styles/preview_theme/github-light.css`,
            ),
          );
        } else if (darkPreviewTheme) {
          const lightPreviewTheme =
            darkPreviewTheme === previewTheme
              ? MarkdownEngine.PreviewThemeColorCounterparts[previewTheme]
              : previewTheme;
          colorSchemeMeta = '<meta name="color-scheme" content="light dark">';
          styleCSS += await this.fs.readFile(
            path.resolve(
              utility.getCrossnoteBuildDirectory(),
              `./styles/preview_theme/${lightPreviewTheme}`,
            ),
          );
          styleCSS += `@media (prefers-color-scheme: dark) {\n${await this.fs.readFile(
            path.resolve(
              utility.getCrossnoteBuildDirectory(),
              `./styles/preview_theme/${darkPreviewTheme}`,
            ),
          )}\n}\n`;
        } else {
          styleCSS += await this.fs.readFile(
            path.resolve(
              utility.getCrossnoteBuildDirectory(),
              `./styles/preview_theme/${previewTheme}`,
            ),
          );
        }
      }

      // style template
      styleCSS += await this.fs.readFile(
        path.resolve(
          utility.getCrossnoteBuildDirectory(),
          './styles/style-template.css',
        ),
      );

      // markdown-it-admonition
      if (html.indexOf('admonition') > 0) {
        styleCSS += await this.fs.readFile(
          path.resolve(
            utility.getCrossnoteBuildDirectory(),
            './styles/markdown-it-admonition.css',
          ),
        );
      }

      // markdown-it-callout
      if (html.indexOf('callout') > 0) {
        styleCSS += await this.fs.readFile(
          path.resolve(
            utility.getCrossnoteBuildDirectory(),
            './styles/markdown-it-callout.css',
          ),
        );
      }
    } catch {
      styleCSS = '';
    }

    // global styles
    // No webview here — this is the HTML/print export path, where `file://`
    // is what the output should carry.
    const globalStyles = this.resolvePathsInStyles(
      this.notebook.config.globalCss,
    );

    // sidebar toc
    let sidebarTOC = '';
    let sidebarTOCScript = '';
    let sidebarTOCBtn = '';
    if (
      this.notebook.config.enableScriptExecution &&
      !yamlConfig['isPresentationMode'] &&
      !options.isForPrint &&
      (!('html' in yamlConfig) ||
        (yamlConfig['html'] &&
          (yamlConfig['html'] as Record<string, unknown>)['toc'] !== false))
    ) {
      // enable sidebar toc by default
      sidebarTOC = `<div class="md-sidebar-toc">${this.tocHTML}</div>`;
      sidebarTOCBtn = '<a id="sidebar-toc-btn">≡</a>';
      // toggle sidebar toc
      // If yamlConfig['html']['toc'], then display sidebar TOC on startup.
      sidebarTOCScript = `
<script>
${
  yamlConfig['html'] && (yamlConfig['html'] as Record<string, unknown>)['toc']
    ? `document.body.setAttribute('html-show-sidebar-toc', true)`
    : ''
}
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
      `;
    }

    // task list script
    if (html.indexOf('task-list-item-checkbox') >= 0) {
      const $ = cheerio.load('<div>' + html + '</div>');
      $('.task-list-item-checkbox').each((index: number, elem: Element) => {
        const $elem = $(elem);
        let $li = $elem.parent();
        if (!$li[0].name.match(/^li$/i)) {
          $li = $li.parent();
        }
        if ($li[0].name.match(/^li$/i)) {
          $li.addClass('task-list-item');
        }
      });
      html = $.html();
    }

    // process styles
    // move @import ''; to the very start.
    let styles = styleCSS + '\n' + globalStyles;
    let imports = '';
    styles = styles.replace(/@import\s+url\(([^)]+)\)\s*;/g, (whole) => {
      imports += whole + '\n';
      return '';
    });
    styles = imports + styles;

    html = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>${escape(title)}</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${colorSchemeMeta}
      ${presentationStyle}
      ${mathStyle}
      ${fontAwesomeStyle}
      ${tikzjaxStyle}
      ${presentationScript}
      ${mermaidScript}
      ${peleScript}
      ${wavedromScript}
      ${tikzjaxScript}
      ${vegaScript}
      <style>
      ${styles}
      </style>
      ${await this.resolvePathsInHeader(this.notebook.config.includeInHeader)}
    </head>
    <body ${options.isForPrint ? '' : 'for="html-export"'} ${
      yamlConfig['isPresentationMode'] ? 'data-presentation-mode' : ''
    }>
      <div class="crossnote markdown-preview ${princeClass} ${escape(elementClass)}" ${
        yamlConfig['isPresentationMode'] ? 'data-presentation-mode' : ''
      } ${elementId ? `id="${escape(elementId)}"` : ''}>
      ${html}
      </div>
      ${sidebarTOC}
      ${sidebarTOCBtn}
    </body>
    ${presentationInitScript}
    ${peleInitScript}
    ${mermaidInitScript}
    ${wavedromInitScript}
    ${vegaInitScript}
    ${sidebarTOCScript}
  </html>
    `;

    if (options.embedLocalImages || options.embedSVG) {
      const $ = cheerio.load(html);
      if (options.embedLocalImages) {
        await enhanceWithEmbeddedLocalImages(
          $,
          this.notebook,
          this.resolveFilePath.bind(this),
        );
      }
      if (options.embedSVG) {
        await enhanceWithEmbeddedSvgs(
          $,
          this.notebook,
          this.resolveFilePath.bind(this),
        );
      }
      html = $.html();
    }

    return html.trim();
  }

  /**
   * generate HTML file and open it in browser
   */
  public async openInBrowser({
    runAllCodeChunks = false,
  }: { runAllCodeChunks?: boolean } = {}): Promise<void> {
    const inputString = await this.fs.readFile(this.filePath);
    let html;
    let yamlConfig;
    // eslint-disable-next-line prefer-const
    ({ html, yamlConfig } = await this.parseMD(inputString, {
      useRelativeFilePath: false,
      hideFrontMatter: true,
      isForPreview: false,
      runAllCodeChunks,
    }));
    html = await this.generateHTMLTemplateForExport(html, yamlConfig, {
      isForPrint: false,
      isForPrince: false,
      offline: true,
      // Embed assets and images: the temp document lives outside the
      // crossnote build directory, and Safari/Firefox block cross-tree
      // `file://` subresources (vscode-mpe#2452 — KaTeX rendered twice
      // because its CSS never loaded). Chrome loads them either way.
      embedOfflineAssets: true,
      embedLocalImages: true,
      embedSVG: true,
      isForBrowser: true,
    });
    const info = await utility.tempOpen({
      prefix: 'crossnote',
      suffix: '.html',
    });

    fs.writeFileSync(info.fd, html);
    // open in browser
    utility.openFile(info.path);
    return;
  }

  /**
   *
   * @param filePath
   * @return dest if success, error if failure
   */
  public async htmlExport({
    offline = false,
    runAllCodeChunks = false,
  }: { offline?: boolean; runAllCodeChunks?: boolean } = {}): Promise<string> {
    let dest = this.filePath;
    const extname = path.extname(dest);
    dest = dest.replace(new RegExp(extname + '$'), '.html');

    const html = await this.htmlExportDocument({ offline, runAllCodeChunks });

    // The speaker notes plugin of a presentation that is not exported
    // offline is loaded from next to the exported file.
    if (!offline && html.indexOf('revealjs_deps/notes.js') >= 0) {
      const depsDirName = path.resolve(path.dirname(dest), 'revealjs_deps');
      if (!fs.existsSync(depsDirName)) {
        fs.mkdirSync(depsDirName);
      }
      // Copied in full before the export is reported as written. The file
      // is opened, and the presentation started, as soon as the export
      // returns: reveal.js 6 does not start from a truncated plugin.
      fs.copyFileSync(
        path.resolve(
          utility.getCrossnoteBuildDirectory(),
          './dependencies/reveal/plugin/notes/notes.js',
        ),
        path.resolve(depsDirName, 'notes.js'),
      );
    }

    await this.fs.writeFile(dest, html);
    return dest;
  }

  /**
   * Render this note as a complete, self-contained HTML document — the exact
   * document `htmlExport` writes, without touching the filesystem. Local
   * images/SVGs can be embedded as data URIs so the document works away from
   * the authoring machine; dependency assets (KaTeX CSS, mermaid, …) follow
   * `offline`: CDN links when false, inlined files when true.
   *
   * Front-matter `html:` keys (`offline`, `embed_local_images`, `embed_svg`)
   * override the arguments, like in `htmlExport`.
   */
  public async htmlExportDocument({
    offline = false,
    embedLocalImages = false,
    embedSVG = true,
    runAllCodeChunks = false,
  }: {
    offline?: boolean;
    embedLocalImages?: boolean;
    embedSVG?: boolean;
    runAllCodeChunks?: boolean;
  } = {}): Promise<string> {
    const inputString = await this.fs.readFile(this.filePath);
    let html;
    let yamlConfig;
    // eslint-disable-next-line prefer-const
    ({ html, yamlConfig } = await this.parseMD(inputString, {
      useRelativeFilePath: true,
      hideFrontMatter: true,
      isForPreview: false,
      runAllCodeChunks,
    }));
    const htmlConfig = (yamlConfig['html'] || {}) as Record<string, unknown>;
    if ('offline' in htmlConfig) {
      offline = htmlConfig['offline'] as boolean;
    }
    if ('embed_local_images' in htmlConfig) {
      embedLocalImages = !!htmlConfig['embed_local_images'];
    }
    if ('embed_svg' in htmlConfig) {
      embedSVG = htmlConfig['embed_svg'] as boolean;
    }

    return this.generateHTMLTemplateForExport(html, yamlConfig, {
      isForPrint: false,
      isForPrince: false,
      embedLocalImages,
      offline,
      embedOfflineAssets: offline,
      embedSVG,
    });
  }

  /**
   * Chrome (puppeteer) file export
   */
  public async chromeExport({
    fileType = 'pdf',
    runAllCodeChunks = false,
    openFileAfterGeneration = false,
  }: {
    fileType?: string;
    runAllCodeChunks?: boolean;
    openFileAfterGeneration?: boolean;
  } = {}): Promise<string> {
    const inputString = await this.fs.readFile(this.filePath);
    let html;
    let yamlConfig;
    // eslint-disable-next-line prefer-const
    ({ html, yamlConfig } = await this.parseMD(inputString, {
      useRelativeFilePath: false,
      hideFrontMatter: true,
      isForPreview: false,
      runAllCodeChunks,
    }));
    let dest = this.filePath;
    const extname = path.extname(dest);
    dest = dest.replace(new RegExp(extname + '$'), '.' + fileType);

    html = await this.generateHTMLTemplateForExport(html, yamlConfig, {
      isForPrint: true,
      isForPrince: false,
      embedLocalImages: false,
      offline: true,
    });

    let executablePath: string;
    try {
      executablePath = this.notebook.config.chromePath;
      if (!executablePath) {
        const chromePaths = (await import('chrome-paths')).default;
        executablePath =
          chromePaths.chrome ||
          chromePaths.chromeCanary ||
          chromePaths.chromium ||
          '';
      }
    } catch {
      executablePath = '';
    }
    if (!executablePath) {
      throw new Error('Chrome executable path is not set.');
    }

    // NOTE: Use the puppeteer-core esm module will cause problem
    // in the bundled version of the VSCode extension.
    // So we use the cjs module instead.
    // TypeError: Invalid host defined options
    const puppeteer =
      await import('puppeteer-core/lib/cjs/puppeteer/puppeteer-core.js');
    const browser = await puppeteer.launch({
      args: this.notebook.config.puppeteerArgs || [],
      executablePath,
      headless: true,
    });

    try {
      const info = await utility.tempOpen({
        prefix: 'crossnote',
        suffix: '.html',
      });
      fs.writeFileSync(info.fd, html);

      const page = await browser.newPage();
      const loadPath =
        utility.toFileURL(info.path) +
        (yamlConfig['isPresentationMode'] ? '?print-pdf' : '');
      await page.goto(loadPath);

      // Mermaid runs asynchronously after load. Its data-processed attribute is
      // set before rendering, so wait for the export script's completion signal.
      await page.waitForFunction(
        () => {
          const state = (window as MermaidExportWindow)
            .__crossnoteMermaidExport;
          return (
            !document.querySelector('div.mermaid') ||
            state?.status === 'complete' ||
            state?.status === 'error'
          );
        },
        { timeout: 30_000 },
      );
      const mermaidError = await page.evaluate(() => {
        const state = (window as MermaidExportWindow).__crossnoteMermaidExport;
        return state?.status === 'error' ? state.message : undefined;
      });
      if (mermaidError !== undefined) {
        throw new Error('Mermaid rendering failed: ' + mermaidError);
      }
      // Pele draws synchronously while the page loads, so there is nothing to
      // wait for, and a diagram that cannot be drawn is reported in its
      // place. Two things fail the export: the drawing script itself failing
      // — the pele bundle not loading, mostly — and a diagram that script
      // never reached, which would be captured as its source text.
      const peleFailure = await page.evaluate(() => {
        const message = (window as PeleExportWindow).__crossnotePeleExport
          ?.message;
        if (message !== undefined) {
          return message;
        }
        return document.querySelector('div.pele:not([data-processed])')
          ? 'A diagram was not drawn: the script that draws them did not reach it.'
          : undefined;
      });
      if (peleFailure !== undefined) {
        throw new Error('Pele rendering failed: ' + peleFailure);
      }
      if (yamlConfig['isPresentationMode']) {
        // reveal.js lays the pages of a presentation out once the page has
        // loaded, moving every slide into its page, and reports it. A PDF
        // taken before is made of pages that are not there yet. The report is
        // compared with `true`: a page is known by the id of each of its
        // elements, so one with that id would otherwise pass for the report.
        try {
          await page.waitForFunction(
            () =>
              (window as PrintLayoutWindow).__crossnotePrintLayoutReady ===
              true,
            { timeout: 30_000 },
          );
        } catch (error) {
          throw new Error(
            'reveal.js did not lay the pages of the presentation out.',
            { cause: error },
          );
        }
      }

      const chromeConfig =
        yamlConfig['chrome'] &&
        typeof yamlConfig['chrome'] === 'object' &&
        !Array.isArray(yamlConfig['chrome'])
          ? (yamlConfig['chrome'] as Record<string, unknown>)
          : undefined;
      const puppeteerConfig2 =
        yamlConfig['puppeteer'] &&
        typeof yamlConfig['puppeteer'] === 'object' &&
        !Array.isArray(yamlConfig['puppeteer'])
          ? (yamlConfig['puppeteer'] as Record<string, unknown>)
          : undefined;
      const puppeteerConfig: Record<string, unknown> = {
        path: dest,
        ...(yamlConfig['isPresentationMode']
          ? {}
          : {
              margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' },
            }),
        printBackground: this.notebook.config.printBackground,
        ...(chromeConfig || puppeteerConfig2 || {}),
      };

      // wait for timeout
      let timeout = 0;
      if (chromeConfig && chromeConfig['timeout']) {
        timeout = chromeConfig['timeout'] as number;
      } else if (puppeteerConfig2 && puppeteerConfig2['timeout']) {
        timeout = puppeteerConfig2['timeout'] as number;
      }
      if (timeout && typeof timeout === 'number') {
        await new Promise((resolve) => setTimeout(resolve, timeout));
      } else if (
        this.notebook.config.puppeteerWaitForTimeout &&
        this.notebook.config.puppeteerWaitForTimeout > 0
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.notebook.config.puppeteerWaitForTimeout),
        );
      }

      if (fileType === 'pdf') {
        await page.pdf(puppeteerConfig);
      } else {
        puppeteerConfig['fullPage'] = true; // <= set to fullPage by default
        await page.screenshot(puppeteerConfig);
      }

      if (openFileAfterGeneration) {
        utility.openFile(dest);
      }
      return dest;
    } finally {
      // A failed render must also close Chrome. Keep shutdown errors (e.g.
      // EBUSY unlinking a Windows profile) from replacing the export result.
      browser.close().catch(() => {});
    }
  }

  /**
   * prince pdf file export
   * @return dest if success, error if failure
   */
  public async princeExport({
    runAllCodeChunks = false,
    openFileAfterGeneration = false,
  }: {
    runAllCodeChunks?: boolean;
    openFileAfterGeneration?: boolean;
  } = {}): Promise<string> {
    const inputString = await this.fs.readFile(this.filePath);
    let html;
    let yamlConfig;
    // eslint-disable-next-line prefer-const
    ({ html, yamlConfig } = await this.parseMD(inputString, {
      useRelativeFilePath: false,
      hideFrontMatter: true,
      isForPreview: false,
      runAllCodeChunks,
    }));
    let dest = this.filePath;
    const extname = path.extname(dest);
    dest = dest.replace(new RegExp(extname + '$'), '.pdf');

    html = await this.generateHTMLTemplateForExport(html, yamlConfig, {
      isForPrint: true,
      isForPrince: true,
      embedLocalImages: false,
      offline: true,
    });

    const info = await utility.tempOpen({
      prefix: 'crossnote',
      suffix: '.html',
    });
    fs.writeFileSync(info.fd, html);

    if (yamlConfig['isPresentationMode']) {
      const url = utility.toFileURL(info.path) + '?print-pdf';
      return url;
    } else {
      await princeConvert(info.path, dest);

      //  open pdf
      if (openFileAfterGeneration) {
        utility.openFile(dest);
      }
      return dest;
    }
  }

  private async eBookDownloadImages(
    $: CheerioAPI,
    dest: string,
  ): Promise<string[]> {
    const imagesToDownload: Cheerio<AnyNode>[] = [];
    if (['.epub', '.mobi'].includes(path.extname(dest))) {
      $('img').each((offset, img) => {
        const $img = $(img);
        const src = $img.attr('src') || '';
        if (src.match(/^https?:\/\//)) {
          imagesToDownload.push($img);
        }
      });
    }

    // Every file a download began to write, next to the note.
    const savePaths: string[] = [];
    const asyncFunctions = imagesToDownload.map(async ($img) => {
      const httpSrc = $img.attr('src') ?? '';
      let savePath =
        Math.random().toString(36).substr(2, 9) + '_' + path.basename(httpSrc);
      savePath = path.resolve(this.fileDirectoryPath, savePath);
      savePaths.push(savePath);

      const response = await fetch(httpSrc);
      if (!response.ok || !response.body) {
        throw new Error(`Failed to download image from ${httpSrc}`);
      }
      const { pipeline } = await import('stream/promises');
      const { Readable } = await import('stream');
      await pipeline(
        Readable.fromWeb(
          response.body as Parameters<typeof Readable.fromWeb>[0],
        ),
        fs.createWriteStream(savePath),
      );
      $img.attr('src', utility.toFileURL(savePath));
      return savePath;
    });

    // Every download is awaited first, so that a failed one takes nothing
    // with it that another is still writing.
    const results = await Promise.allSettled(asyncFunctions);
    const savedPaths: string[] = [];
    let failure: PromiseRejectedResult | undefined;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        savedPaths.push(result.value);
      } else if (failure === undefined) {
        failure = result;
      }
    }
    if (failure) {
      // The export stops here: what was written next to the note is removed.
      await Promise.all(
        savePaths.map((savePath) =>
          fs.promises.unlink(savePath).catch(() => undefined),
        ),
      );
      throw failure.reason;
    }
    return savedPaths;
  }

  /**
   *
   *
   * @return dest if success, error if failure
   */
  public async eBookExport({
    fileType = 'epub',
    runAllCodeChunks = false,
  }: {
    /**
     * fileType: 'epub', 'pdf', 'mobi' or 'html'
     */
    fileType: string;
    runAllCodeChunks?: boolean;
  }): Promise<string> {
    const inputString = await this.fs.readFile(this.filePath);
    const emojiToSvg = fileType === 'pdf';
    let html;
    let yamlConfig;
    // eslint-disable-next-line prefer-const
    ({ html, yamlConfig } = await this.parseMD(inputString, {
      useRelativeFilePath: false,
      hideFrontMatter: true,
      isForPreview: false,
      runAllCodeChunks,
      emojiToSvg,
    }));

    let dest = this.filePath;
    const extname = path.extname(dest);
    dest = dest.replace(
      new RegExp(extname + '$'),
      '.' + fileType.toLowerCase(),
    );

    const ebookConfig = (yamlConfig['ebook'] || {}) as Record<string, unknown>;
    if (!ebookConfig) {
      throw new Error(
        'eBook config not found. Please insert ebook front-matter to your markdown file.',
      );
    }

    if (ebookConfig['cover']) {
      // change cover to absolute path if necessary
      ebookConfig['cover'] = utility.removeFileProtocol(
        this.resolveFilePath(String(ebookConfig['cover']), false),
      );
    }

    let $ = cheerio.load(`<div>${html}</div>`);
    const tocStructure: {
      level: number;
      filePath: string;
      heading: string;
      id: string;
    }[] = [];
    const headingIdGenerator = new HeadingIdGenerator();
    const $toc = $('div > ul').last();
    if ($toc.length) {
      if (ebookConfig['include_toc'] === false) {
        // remove itself and the heading ahead
        const $prev = $toc.prev();
        if ($prev.length && $prev[0].name.match(/^h\d$/i)) {
          $prev.remove();
        }
      }

      $('h1, h2, h3, h4, h5, h6').each((offset, h) => {
        const $h = $(h);
        const level = parseInt($h[0].name.slice(1), 10) - 1;

        // $h.attr('id', id)
        $h.attr('ebook-toc-level-' + (level + 1), '');
        $h.attr('heading', $h.html());
      });

      getStructure($toc, 0); // analyze TOC

      if (ebookConfig['include_toc'] === false) {
        // remove itself and the heading ahead
        $toc.remove();
      }
    }

    // load the last ul as TOC, analyze toc links
    function getStructure($ul: ReturnType<CheerioAPI>, level: number) {
      $ul.children('li').each((offset, li) => {
        const $li = $(li);
        const $a = $li.children('a').first();

        if (!$a.length) {
          if ($li.children().length >= 1) {
            getStructure($li.children().last(), level + 1);
          }
          return;
        }

        const filePath = decodeURIComponent($a.attr('href') ?? ''); // markdown file path
        // What the link says — its text, or what its image says of itself:
        // calibre reads it back as the title of the entry, and it is
        // written into an attribute.
        const heading = $a.text() || $a.find('img').first().attr('alt') || '';
        const id = headingIdGenerator.generateId(`ebook-heading-` + heading); // "ebook-heading-id-" + headingOffset;

        tocStructure.push({ level, filePath, heading, id });

        $a.attr('href', '#' + id); // change id
        if ($li.children().length > 1) {
          getStructure($li.children().last(), level + 1);
        }
      });
    }

    // load each markdown files according to `tocStructure`
    const asyncFunctions = tocStructure.map(
      ({ heading, id, level, filePath }, offset) => {
        return new Promise((resolve, reject) => {
          filePath = utility.removeFileProtocol(filePath);
          if (filePath.match(/^https?:\/\//)) {
            return resolve({ heading, id, level, filePath, html: '', offset });
          }
          fs.readFile(filePath, { encoding: 'utf-8' }, (error, text) => {
            if (error) {
              return reject(error.toString());
            }

            // Fix image paths that are relative to the child documents
            const rootPath = path.dirname(this.filePath);
            text = text.replace(
              /(!\[[^\]]*\]\()(\.[^)\s]*)/g,
              (whole, openTag, imageLink) => {
                const fullPath = path.resolve(
                  path.dirname(filePath),
                  imageLink,
                );
                const relativePath = path.relative(rootPath, fullPath);
                return openTag + relativePath;
              },
            );
            this.parseMD(text, {
              useRelativeFilePath: false,
              isForPreview: false,
              hideFrontMatter: true,
              emojiToSvg,
              fileDirectoryPath: path.dirname(filePath),
              /* tslint:disable-next-line:no-shadowed-variable */
            }).then(({ html }) => {
              return resolve({ heading, id, level, filePath, html, offset });
            });
          });
        });
      },
    );

    let outputHTML = $.html().replace(/^<div>(.+)<\/div>$/, '$1');
    let results = (await Promise.all(asyncFunctions)) as {
      heading: string;
      id: string;
      level: number;
      filePath: string;
      html?: string;
      offset: number;
    }[];
    results = results.sort((a, b) => a['offset'] - b['offset']);

    /* tslint:disable-next-line:no-shadowed-variable */
    results.forEach(({ heading, id, level, html }) => {
      /* tslint:disable-next-line:no-shadowed-variable */

      const $$ = cheerio.load(`<div>${html}</div>`);
      $$('a').each((index, a) => {
        const $a = $$(a);
        const href = $a.attr('href');
        if (href && href.startsWith('file://')) {
          results.forEach((result) => {
            if (result.filePath === utility.removeFileProtocol(href)) {
              $a.attr('href', '#' + result.id);
            }
          });
        }
      });

      outputHTML += `<div id="${id}" ebook-toc-level-${
        level + 1
      } heading="${escape(heading)}">${$$.html()}</div>`; // append new content
    });

    $ = cheerio.load(outputHTML);
    const downloadedImagePaths = await this.eBookDownloadImages($, dest);

    // convert image to base64 if output html
    if (path.extname(dest) === '.html') {
      // check cover
      if (ebookConfig['cover']) {
        const cover = ebookConfig['cover'] as string;
        const coverUrl = cover[0] === '/' ? utility.toFileURL(cover) : cover;
        $(':root')
          .children()
          .first()
          .prepend(
            `<img style="display:block; margin-bottom: 24px;" src="${escape(coverUrl)}">`,
          );
      }

      await enhanceWithEmbeddedLocalImages(
        $,
        this.notebook,
        this.resolveFilePath.bind(this),
      );
    }

    // retrieve html
    outputHTML = $.html();
    const title = ebookConfig['title'] || 'no title';

    // math
    let mathStyle = '';
    if (outputHTML.indexOf('class="katex"') > 0) {
      if (
        path.extname(dest) === '.html' &&
        ebookConfig['html'] &&
        (ebookConfig['html'] as Record<string, unknown>)['cdn']
      ) {
        mathStyle = `<link rel="stylesheet" href="https://${this.notebook.config.jsdelivrCdnHost}/npm/katex@0.19.1/dist/katex.min.css">`;
      } else {
        mathStyle = `<link rel="stylesheet" href="${utility.toFileURL(
          path.resolve(
            utility.getCrossnoteBuildDirectory(),
            './dependencies/katex/katex.min.css',
          ),
        )}">`;
      }
    }

    // `ebook.theme` is named by the note, and its file is inlined into the
    // page: only a bare `<name>.css` is a theme, as for a presentation.
    const ebookThemeName = MarkdownEngine.themeFileOf(
      ebookConfig['theme'],
      this.notebook.config.previewTheme,
    );

    // prism and preview theme
    let styleCSS: string;
    try {
      const styles = await Promise.all([
        // style template
        await this.fs.readFile(
          path.resolve(
            utility.getCrossnoteBuildDirectory(),
            './styles/style-template.css',
          ),
        ),
        // prism *.css
        await this.fs.readFile(
          path.resolve(
            utility.getCrossnoteBuildDirectory(),
            `./styles/prism_theme/${MarkdownEngine.resolveThemeForExport(
              (MarkdownEngine.AutoPrismThemeMap as Record<string, string>)[
                ebookThemeName
              ] ?? 'default.css',
              'codeBlock',
            )}`,
          ),
        ),
        // twemoji css style
        await this.fs.readFile(
          path.resolve(
            utility.getCrossnoteBuildDirectory(),
            './styles/twemoji.css',
          ),
        ),
        // preview theme
        await this.fs.readFile(
          path.resolve(
            utility.getCrossnoteBuildDirectory(),
            `./styles/preview_theme/${MarkdownEngine.resolveThemeForExport(
              ebookThemeName,
              'preview',
            )}`,
          ),
        ),
        // markdown-it-admonition
        outputHTML.indexOf('admonition') > 0
          ? await this.fs.readFile(
              path.resolve(
                utility.getCrossnoteBuildDirectory(),
                './styles/markdown-it-admonition.css',
              ),
            )
          : '',
        // markdown-it-callout
        outputHTML.indexOf('callout') > 0
          ? await this.fs.readFile(
              path.resolve(
                utility.getCrossnoteBuildDirectory(),
                './styles/markdown-it-callout.css',
              ),
            )
          : '',
      ]);
      styleCSS = styles.join('');
    } catch {
      styleCSS = '';
    }

    // global styles
    let globalStyles = '';
    try {
      globalStyles = this.resolvePathsInStyles(this.notebook.config.globalCss);
    } catch {
      // ignore it
    }

    // only use github-light style for ebook
    html = `
<!DOCTYPE html>
<html>
  <head>
    <title>${escape(String(title))}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
    ${styleCSS}
    ${globalStyles}
    </style>
    ${mathStyle}
    ${await this.resolvePathsInHeader(this.notebook.config.includeInHeader)}
  </head>
  <body ${path.extname(dest) === '.html' ? 'for="html-export"' : ''}>
    <div class="crossnote markdown-preview">
    ${outputHTML}
    </div>
  </body>
</html>
`;

    // save as html
    if (path.extname(dest) === '.html') {
      await this.fs.writeFile(dest, html);
      return dest;
    }

    // this function will be called later
    function deleteDownloadedImages() {
      downloadedImagePaths.forEach((imagePath) => {
        fs.unlink(imagePath, () => {
          return;
        });
      });
    }

    // calibre 6.19+ adds no local file outside the folder of the page it is
    // given: the page is written at the root of the notebook, so that the
    // images of the notebook (and those downloaded above) are in the book.
    const pagePath = path.resolve(
      this.projectDirectoryPath.fsPath,
      `${path.basename(this.filePath, extname)}.${Math.random()
        .toString(36)
        .substr(2, 9)}.crossnote-ebook.html`,
    );
    let pageWritten = false;
    try {
      await fs.promises.writeFile(pagePath, html, { flag: 'wx' });
      pageWritten = true;
      await ebookConvert(pagePath, dest, ebookConfig);
      return dest;
    } finally {
      deleteDownloadedImages();
      if (pageWritten) {
        await fs.promises.unlink(pagePath).catch(() => undefined);
      }
    }
  }

  /**
   * pandoc export
   */
  public async pandocExport({
    runAllCodeChunks = false,
    openFileAfterGeneration = false,
  }: {
    runAllCodeChunks?: boolean;
    openFileAfterGeneration?: boolean;
  } = {}): Promise<string> {
    let inputString = await this.fs.readFile(this.filePath);

    if (this.notebook.config.parserConfig.onWillParseMarkdown) {
      inputString =
        await this.notebook.config.parserConfig.onWillParseMarkdown(
          inputString,
        );
    }

    if (runAllCodeChunks) {
      // this line of code is only used to get this.codeChunksData
      await this.parseMD(inputString, {
        useRelativeFilePath: true,
        isForPreview: false,
        hideFrontMatter: false,
        runAllCodeChunks,
      });
    }

    let config = {};

    if (inputString.startsWith('---')) {
      const endFrontMatterOffset = inputString.indexOf('\n---');
      if (endFrontMatterOffset > 0) {
        const frontMatterString = inputString.slice(
          0,
          endFrontMatterOffset + 4,
        );
        config = this.processFrontMatter(frontMatterString, false).data;
      }
    }

    const outputFilePath = await pandocConvert(
      inputString,
      {
        fileDirectoryPath: this.fileDirectoryPath,
        projectDirectoryPath: this.projectDirectoryPath.fsPath,
        sourceFilePath: this.filePath,
        protocolsWhiteListRegExp: this.protocolsWhiteListRegExp,
        // deleteImages: true,
        filesCache: this.filesCache,
        codeChunksData: this.codeChunksData,
        graphsCache: this.graphsCache,
        notebook: this.notebook,
      },
      config,
    );

    if (openFileAfterGeneration) {
      utility.openFile(outputFilePath);
    }
    return outputFilePath;
  }

  /**
   * markdown(gfm) export
   */
  public async markdownExport({
    runAllCodeChunks = false,
  }: { runAllCodeChunks?: boolean } = {}): Promise<string> {
    let inputString = await this.fs.readFile(this.filePath);

    if (runAllCodeChunks) {
      // this line of code is only used to get this.codeChunksData
      await this.parseMD(inputString, {
        useRelativeFilePath: true,
        isForPreview: false,
        hideFrontMatter: false,
        runAllCodeChunks,
      });
    }

    let config: Record<string, unknown> = {};

    if (inputString.startsWith('---')) {
      const endFrontMatterOffset = inputString.indexOf('\n---');
      if (endFrontMatterOffset > 0) {
        const frontMatterString = inputString.slice(
          0,
          endFrontMatterOffset + 4,
        );
        inputString = inputString.replace(frontMatterString, ''); // remove front matter
        config = this.processFrontMatter(frontMatterString, false).data;
      }
    }

    /**
     * markdownConfig has the following properties:
     *     path:                        destination of the output file
     *     image_dir:                   where to save the image file
     *     use_absolute_image_path:      as the name shows.
     *     ignore_from_front_matter:    default is true.
     */
    let markdownConfig: Record<string, unknown> = {};
    if (config['markdown']) {
      markdownConfig = { ...(config['markdown'] as Record<string, unknown>) };
    }

    if (!markdownConfig['image_dir']) {
      markdownConfig['image_dir'] = this.notebook.config.imageFolderPath;
    }

    if (!markdownConfig['path']) {
      if (this.filePath.match(/\.src\./)) {
        markdownConfig['path'] = this.filePath.replace(/\.src\./, '.');
      } else {
        markdownConfig['path'] = this.filePath.replace(
          new RegExp(path.extname(this.filePath)),
          '_' + path.extname(this.filePath),
        );
      }
      markdownConfig['path'] = path.basename(markdownConfig['path'] as string);
    }

    // ignore_from_front_matter is `true` by default
    if (
      markdownConfig['ignore_from_front_matter'] ||
      !('ignore_from_front_matter' in markdownConfig)
    ) {
      // delete markdown config front-matter from the top front matter
      delete config['markdown'];
    }
    if (config['export_on_save']) {
      delete config['export_on_save'];
    }

    // put front-matter back
    if (Object.keys(config).length) {
      inputString = '---\n' + YAML.stringify(config) + '---\n' + inputString;
    }

    return await markdownConvert(
      inputString,
      {
        projectDirectoryPath: this.projectDirectoryPath.fsPath,
        fileDirectoryPath: this.fileDirectoryPath,
        protocolsWhiteListRegExp: this.protocolsWhiteListRegExp,
        filesCache: this.filesCache,
        codeChunksData: this.codeChunksData,
        graphsCache: this.graphsCache,
        notebook: this.notebook,
      },
      markdownConfig,
    );
  }

  /**
   * Eg
   * ---
   * export_on_save:
   *    html: true
   *    prince: true
   *    puppeteer | chrome: true  // or pdf | jpeg | png
   *    pandoc: true
   *    ebook: true      // or epub | pdf | html | mobi
   *    markdown: true
   * ---
   * @param data
   */
  private exportOnSave(data: JsonObject) {
    const isWeb = utility.isVSCodeWebExtension();
    for (const exporter in data) {
      if (exporter === 'html') {
        this.htmlExport({});
      } else if (!isWeb && exporter === 'prince') {
        this.princeExport({ openFileAfterGeneration: false });
      } else if (
        (!isWeb && exporter === 'puppeteer') ||
        exporter === 'chrome'
      ) {
        const fileTypes = data[exporter];
        let func = this.chromeExport;
        func = func.bind(this);

        if (fileTypes === true) {
          func({ fileType: 'pdf', openFileAfterGeneration: false });
        } else if (typeof fileTypes === 'string') {
          func({ fileType: fileTypes, openFileAfterGeneration: false });
        } else if (fileTypes instanceof Array) {
          fileTypes.forEach((fileType) => {
            func({
              fileType: fileType as string,
              openFileAfterGeneration: false,
            });
          });
        }
      } else if (!isWeb && exporter === 'pandoc') {
        this.pandocExport({ openFileAfterGeneration: false });
      } else if (!isWeb && exporter === 'ebook') {
        const fileTypes = data[exporter];
        if (fileTypes === true) {
          this.eBookExport({ fileType: 'epub' });
        } else if (typeof fileTypes === 'string') {
          this.eBookExport({ fileType: fileTypes });
        } else if (fileTypes instanceof Array) {
          fileTypes.forEach((fileType) => {
            this.eBookExport({ fileType: fileType as string });
          });
        }
      }
    }
  }

  /**
   * Resolve a link from the rendered HTML (`src`, `href`, …) to a URL.
   *
   * The link is a URL, not a filesystem path: markdown-it has already
   * percent-encoded it (`图.png` → `%E5%9B%BE.png`), and it may carry a
   * `?cache-buster` or `#fragment`. The path part is decoded before it is
   * resolved and the suffix is re-attached afterwards, so the host builds its
   * URL from a real file path (issues vscode-mpe#2441, vscode-mpe#2328).
   *
   * @param filePath
   * @param relative: whether to use the path relative to filePath or not.
   */
  private resolveFilePath(
    filePath: string = '',
    relative: boolean,
    fileDirectoryPath: string = '',
  ) {
    if (
      filePath.match(this.protocolsWhiteListRegExp) ||
      filePath.startsWith('data:image/') ||
      filePath.startsWith('tag://') ||
      filePath[0] === '#'
    ) {
      return filePath;
    }
    if (relative && filePath[0] !== '/') {
      return filePath;
    }
    const { path: linkPath, suffix } = utility.splitUrlReference(filePath);
    const absolutePath =
      linkPath[0] === '/'
        ? path.resolve(this.projectDirectoryPath.fsPath, '.' + linkPath)
        : path.resolve(fileDirectoryPath || this.fileDirectoryPath, linkPath);
    if (relative) {
      return (
        utility.escapeUrlPath(
          path.relative(
            fileDirectoryPath || this.fileDirectoryPath,
            absolutePath,
          ),
        ) + suffix
      );
    }
    return utility.appendUrlSuffix(
      utility.addFileProtocol(absolutePath, this.vscodePreviewPanel),
      suffix,
    );
  }

  /**
   * Turn the absolute filesystem paths that `resolveRelativeCssUrls` left in
   * the user's compiled `style.less` into URLs the current render target can
   * load — `vscode-webview://…` inside a VS Code webview, `file://…` for every
   * export path and for `crossnote serve`.
   *
   * Without this the preview inlines `<style>` with the paths still raw, and a
   * relative `@font-face src` (or `background-image`) resolves against the
   * webview document instead of the stylesheet, so local fonts silently fall
   * back while remote ones keep working
   * ([vscode-mpe#2424](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/2424)).
   */
  private resolvePathsInStyles(
    css: string,
    vscodePreviewPanel?: vscode.WebviewPanel | null,
  ): string {
    if (!css) {
      return css;
    }
    return mapAbsoluteCssUrls(css, (filePath) =>
      utility.addFileProtocol(filePath, vscodePreviewPanel),
    );
  }

  // FIXME: This function actually doesn't help in the web version.
  private async resolvePathsInHeader(
    header: string,
    {
      allowScripts = false,
      vscodePreviewPanel = null as vscode.WebviewPanel | null | undefined,
    }: {
      allowScripts?: boolean;
      vscodePreviewPanel?: vscode.WebviewPanel | null | undefined;
    } = {},
  ) {
    const $ = cheerio.load(header);

    // head.html is workspace content that executes in the preview webview
    // before the React app and any CSP/DOMPurify defenses, giving an
    // attacker access to the webview's postMessage API. By default all
    // <script> tags are removed; <style>, <meta>, and <link> tags are
    // kept. When the host application explicitly opted in
    // (`notebook.previewScriptsEnabled`), file-based scripts that resolve
    // inside the notebook directory — or inside one of the host-named
    // `notebook.trustedScriptRoots`, so the user-owned *global* head.html
    // can load the scripts sitting next to it — are kept and rewritten to
    // file URLs. Inline scripts and URL-scheme sources never run.
    //
    // NOTE: This helper is shared by the preview webview and the HTML /
    // eBook export paths, so scripts in head.html are stripped from
    // exported documents too — not just the webview that the advisory
    // (GHSA-mcwg-4j78-qwv3) covers. This is intentional hardening:
    // exported HTML running attacker-supplied JS is equally undesirable.
    if (allowScripts) {
      const trustedScriptRoots = this.notebook.trustedScriptRoots;
      $('script').each((_i, element) => {
        const src = $(element).attr('src');
        if (
          !src ||
          src.startsWith('//') ||
          /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(src)
        ) {
          $(element).remove();
          return;
        }
        // `/x.js` is notebook-root-relative. A relative src resolves
        // against the note's directory first, then against each trusted
        // root; the first candidate that is an existing file inside the
        // notebook directory or a trusted root wins. Containment is
        // checked per candidate (realpath, symlinks included), so a src
        // can never mix one base's path with another base's trust.
        const candidatePaths = src.startsWith('/')
          ? [path.resolve(this.projectDirectoryPath.fsPath, '.' + src)]
          : [
              path.resolve(this.fileDirectoryPath, src),
              ...trustedScriptRoots.map((root) => path.resolve(root, src)),
            ];
        const resolvedPath = candidatePaths.find(
          (p) =>
            isExistingFile(p) &&
            (this.isPathInsideProjectDirectory(p) ||
              trustedScriptRoots.some((root) =>
                isPathInsideDirectory(root, p),
              )),
        );
        if (!resolvedPath) {
          $(element).remove();
          return;
        }
        $(element).attr(
          'src',
          utility.addFileProtocol(resolvedPath, vscodePreviewPanel),
        );
      });
    } else {
      $('script').remove();
    }

    // The scripts the host allowed are put back once the rest is sanitized:
    // those of the head itself, each once. (One inside a `template` runs
    // nothing there, and what follows an `svg` is not in the head: both are
    // sanitized as the rest of the file is.)
    const allowedScripts: string[] = [];
    if (allowScripts) {
      $('head > script').each((_, script) => {
        allowedScripts.push($.html(script));
        $(script).remove();
      });
    }

    // The rest of the file is the notebook's, and it is written into the
    // page outside the page's sanitizer: an event handler, a dangerous
    // address, a `<base>` or a meta refresh is taken out as from a page.
    sanitizeRenderedHTML($);
    if (allowedScripts.length > 0) {
      $('head').append(allowedScripts.join('\n'));
    }

    // Return only the head content, not the full HTML structure. An
    // empty result is valid — every tag was stripped — and must not
    // fall back to the raw header, which would reintroduce exactly the
    // tags that were removed above (`|| header` used to do this
    // whenever the head ended up empty).
    return $('head').html() ?? header;
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
    this.filesCache = {};
    this.codeChunksData = {};
    this.graphsCache = {};
  }

  /**
   * Render a parsed front-matter value as HTML table markup.
   *
   * `vertical` selects the one-key-per-row layout (`<th>` key cell +
   * `<td>` value cell per row) instead of the default one-column-per-key
   * layout, which overflows the preview pane when there are many keys
   * or long values.
   */
  private frontMatterToTable(arg: unknown, vertical: boolean = false) {
    if (arg instanceof Array) {
      let tbody = '<tbody><tr>';
      arg.forEach(
        (item) =>
          (tbody += `<td>${this.frontMatterToTable(item, vertical)}</td>`),
      );
      tbody += '</tr></tbody>';
      return `<table>${tbody}</table>`;
    } else if (typeof arg === 'object') {
      if (vertical) {
        let tbody = '<tbody>';
        for (const key in arg) {
          // eslint-disable-next-line no-prototype-builtins
          if (arg.hasOwnProperty(key)) {
            tbody += `<tr><th>${escape(key)}</th><td>${this.frontMatterToTable(
              (arg as Record<string, unknown>)[key],
              vertical,
            )}</td></tr>`;
          }
        }
        tbody += '</tbody>';
        return `<table>${tbody}</table>`;
      }
      let thead = '<thead><tr>';
      let tbody = '<tbody><tr>';
      for (const key in arg) {
        // eslint-disable-next-line no-prototype-builtins
        if (arg.hasOwnProperty(key)) {
          thead += `<th>${escape(key)}</th>`;
          tbody += `<td>${this.frontMatterToTable((arg as Record<string, unknown>)[key], vertical)}</td>`;
        }
      }
      thead += '</tr></thead>';
      tbody += '</tr></tbody>';

      return `<table>${thead}${tbody}</table>`;
    } else {
      return escape(arg as string);
    }
  }

  /**
   * process input string, skip front-matter
   * if markdownParser === 'pandoc'. return {
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
  private processFrontMatter(
    frontMatterString: string,
    hideFrontMatter: boolean = false,
  ): { content: string; table: string; data: JsonObject } {
    if (frontMatterString) {
      const data = utility.parseYAML(frontMatterString);

      if (this.notebook.config.markdownParser === 'pandoc') {
        // use pandoc parser, so don't change inputString
        return { content: frontMatterString, table: '', data: data || {} };
      } else if (
        hideFrontMatter ||
        (this.notebook.config.frontMatterRenderingOption ?? '')[0] === 'n'
      ) {
        // hide
        return { content: '', table: '', data };
      } else if (
        ['t', 'v'].includes(
          (this.notebook.config.frontMatterRenderingOption ?? '')[0],
        )
      ) {
        // 'table' (keys as columns) or 'vertical table' (one key/value
        // pair per row, which keeps the table inside the preview pane
        // when there are many keys or long values —
        // vscode-markdown-preview-enhanced#2371)
        const vertical =
          (this.notebook.config.frontMatterRenderingOption ?? '')[0] === 'v';
        let table;
        if (typeof data === 'object') {
          table = this.frontMatterToTable(data, vertical);
        } else {
          table =
            '<pre class="language-text"><code>Failed to parse YAML.</code></pre>';
        }

        return { content: '', table, data };
      } else {
        // code block
        // # if frontMatterRenderingOption[0] == 'c' # code block
        const content = frontMatterString
          .replace(/^---/, '```yaml')
          .replace(/\n---$/, '\n```\n');
        return { content, table: '', data };
      }
    } else {
      return { content: frontMatterString, table: '', data: {} };
    }
  }

  /**
   * Parse `html` to generate slides. Each marker in the page names the
   * configuration of its slide. Returns `null` when no marker does: the
   * document is not a presentation then.
   *
   * Only a marker that carries the token of this rendering is one: it was
   * written by the transformer, in this file or in a file it imported. A
   * `[CROSSNOTESLIDE…]` written as text carries no token — or that of another
   * rendering, as of a note embedded by `![[…]]` in the middle of a line —
   * and stays the text it is, wherever it reaches the page (crossnote#589).
   */
  private parseSlides(
    html: string,
    slideConfigs: JsonObject[],
    useRelativeFilePath: boolean,
    slideMarkerToken: string,
  ): string | null {
    const configs = new Map<number, JsonObject>(
      slideConfigs.map((config) => [
        config[SLIDE_MARKER_NUMBER] as number,
        config,
      ]),
    );
    // A marker is a paragraph of its own, wherever the block before it ends
    // on the line: a fenced block is not followed by a newline, as a
    // paragraph is. One that is not in a paragraph of its own has to start
    // the line.
    const marker = slideMarkerRegExp(slideMarkerToken);

    // A marker that names no configuration — one of a slide whose
    // configuration did not reach the page — starts no slide: what follows
    // it stays with what comes before it.
    const slides: { config: JsonObject; html: string }[] = [];
    let before = '';
    const append = (content: string) => {
      if (slides.length) {
        slides[slides.length - 1].html += content;
      } else {
        before += content;
      }
    };
    let from = 0;
    for (let match = marker.exec(html); match; match = marker.exec(html)) {
      append(html.slice(from, match.index));
      from = match.index + match[0].length;
      const config = configs.get(Number(match[1]));
      if (config) {
        slides.push({ config, html: '' });
      }
    }
    append(html.slice(from));
    if (!slides.length) {
      return null;
    }

    const $ = cheerio.load(
      `<div style="display:none;">${before}</div><div class="reveal"><div class="slides"></div></div>`,
    );
    const deck = $('.slides');
    // The slides of a stack are sections of a section.
    let stack: Cheerio<AnyNode> | null = null;
    let h = -1; // horizontal
    let v = 0; // vertical
    for (const [i, { config: slideConfig, html: slide }] of slides.entries()) {
      // resolve paths in slideConfig
      // An attribute is the same in capitals.
      for (const name of Object.keys(slideConfig)) {
        if (!SLIDE_BACKGROUNDS.includes(name.toLowerCase())) {
          continue;
        }
        // A background that is not written as an address names none.
        if (typeof slideConfig[name] === 'string') {
          slideConfig[name] = this.resolveFilePath(
            slideConfig[name],
            useRelativeFilePath,
          );
        } else {
          delete slideConfig[name];
        }
      }

      if (slideConfig['vertical']) {
        // vertical slide
        v += 1;
      } else {
        h += 1;
        v = 0;
        // The slides of a stack share the section it starts.
        stack = slides[i + 1]?.config['vertical']
          ? $('<section>').appendTo(deck)
          : null;
      }

      const attributes: Record<string, string> = {};
      for (const [name, value] of Object.entries(slideConfig)) {
        // The number of the marker and the line of the slide are not
        // attributes of the slide: its source line is written below. An
        // attribute is the same in capitals: the class and the id of the
        // slide are written below, under whatever case they are written.
        if (
          !NOT_SLIDE_ATTRIBUTES.has(name.toLowerCase()) &&
          ATTRIBUTE_NAME.test(name)
        ) {
          attributes[name] = String(value);
        }
      }
      // What is written under the keys that are `name` in lower case, joined.
      const valuesOf = (name: string) =>
        Object.entries(slideConfig)
          .filter(([key]) => key.toLowerCase() === name)
          .map(([, value]) => String(value))
          .join(' ');
      const id = valuesOf('id');
      const section = $('<section>')
        .html(slide)
        .attr(
          readAttributeValues({
            ...attributes,
            'class': `slide ${valuesOf('class')}`.trim(),
            'data-source-line': String(slideConfig['lineNo']),
            'data-h': String(h),
            'data-v': String(v),
            ...(id ? { id } : {}),
          }),
        );
      (stack ?? deck).append(section);
    }

    // check list item attribtues
    // issue: https://github.com/shd101wyy/markdown-preview-enhanced/issues/559
    $('li').each((j, elem) => {
      const $elem = $(elem);
      const html2 = ($elem.html() ?? '').trim().split('\n')[0];
      const attributeMatch = html2.match(/<!--(.+?)-->/);
      if (attributeMatch) {
        const attributes = attributeMatch[1].replace(/\.element:/, '').trim();
        const attrObj = parseBlockAttributes(attributes);
        for (const [name, value] of Object.entries(attrObj)) {
          if (ATTRIBUTE_NAME.test(name)) {
            $elem.attr(name, String(value));
          }
        }
      }
    });

    // The page was sanitized before the attributes of the slides and of the
    // list items were written: it is sanitized again.
    sanitizeRenderedHTML($);

    return settledHTML($, $('body').html() ?? '');
  }

  private async pandocRender(
    text: string = '',
    args: string[],
  ): Promise<string> {
    // pandoc ≥ 3.11 deprecates the bare --mathjax/--katex flags and warns on
    // stderr — which pandocRender renders as a visible error block above the
    // document (#529). Use --math-method there; older pandoc rejects the new
    // flag outright, so keep the legacy spelling when it's unsupported.
    const mathMethod = await pandocSupportsMathMethod(
      this.notebook.config.pandocPath,
    );
    let mathRenderer;
    switch (this.notebook.config.mathRenderingOption) {
      case 'MathJax':
        mathRenderer = mathMethod ? '--math-method=mathjax' : '--mathjax';
        break;
      case 'KaTeX':
        mathRenderer = mathMethod ? '--math-method=katex' : '--katex';
        break;
      default:
        mathRenderer = '';
    }
    args = args || [];
    args = [
      '--from=' + this.notebook.config.pandocMarkdownFlavor, // -tex_math_dollars doesn't work properly
      '--to=html',
      mathRenderer,
    ]
      .concat(args)
      .filter((arg) => arg.length);

    /*
      convert pandoc code block to markdown-it code block
    */
    let outputString = '';
    const lines = text.split('\n');
    let i = 0;
    let inCodeBlock = false;
    let codeBlockSpacesAhead = 0;
    while (i < lines.length) {
      const line = lines[i];
      const match = line.match(/(^\s*)```/);
      if (match) {
        inCodeBlock = !inCodeBlock;

        if (inCodeBlock) {
          let info = line.slice(match[0].length).trim();
          if (!info) {
            info = 'text';
          }
          const parsedInfo = parseBlockInfo(info);
          const normalizedInfo = normalizeBlockInfo(parsedInfo);

          codeBlockSpacesAhead = match[1].length;
          outputString += `${
            match[1]
          }\`\`\`{.text data-role="codeBlock" data-info="${escape(
            info,
          )}" data-parsed-info="${escape(
            JSON.stringify(parsedInfo),
          )}" data-normalized-info="${escape(
            JSON.stringify(normalizedInfo),
          )}"}\n`;
        } else if (match[1].length === codeBlockSpacesAhead) {
          outputString += `${match[1]}\`\`\`\n`;
        } else {
          inCodeBlock = !inCodeBlock;
          outputString += line + '\n';
        }

        i += 1;
        continue;
      }

      outputString += line + '\n';
      i += 1;
    }

    const pandocPath = this.notebook.config.pandocPath;
    return await new Promise<string>((resolve, reject) => {
      try {
        const program = execFile(
          pandocPath,
          args,
          {
            cwd: this.fileDirectoryPath,
            maxBuffer: Infinity,
            windowsHide: true,
          },
          (error, stdout, stderr) => {
            if (error) {
              return reject(error);
            } else if (stderr) {
              return resolve(
                '<pre class="language-text"><code>' +
                  escape(stderr) +
                  '</code></pre>' +
                  stdout,
              );
            } else {
              return resolve(stdout);
            }
          },
        );
        program.stdin?.end(outputString, 'utf-8');
      } catch (error) {
        let errorMessage = String(error);
        if (errorMessage.indexOf('Error: write EPIPE') >= 0) {
          errorMessage = `"pandoc" is required to be installed.\nCheck "http://pandoc.org/installing.html" website.`;
        }
        return reject(errorMessage);
      }
    });
  }

  public async parseMD(
    inputString: string,
    options: MarkdownEngineRenderOption,
  ): Promise<MarkdownEngineOutput> {
    if (!inputString) {
      inputString = await this.fs.readFile(this.filePath);
    }

    this.vscodePreviewPanel = options.vscodePreviewPanel;

    // TODO: Remove the `onWillParseMarkdown` and `onWillTransformMarkdown`
    // as it is bad for adding source mapping support.
    if (this.notebook.config.parserConfig.onWillParseMarkdown) {
      inputString =
        await this.notebook.config.parserConfig.onWillParseMarkdown(
          inputString,
        );
    }

    // import external files and insert anchors if necessary

    // The token of this rendering, which every slide marker written for the
    // page carries — the ones of the files it imports too — and by which
    // `parseSlides` tells them from a marker written as text (crossnote#589).
    const slideMarkerToken = newSlideMarkerToken();

    let {
      outputString,
      // eslint-disable-next-line prefer-const
      slideConfigs,
      // eslint-disable-next-line prefer-const
      tocBracketEnabled,
      JSAndCssFiles,
      // eslint-disable-next-line prefer-const
      headings,
      // eslint-disable-next-line prefer-const
      frontMatterString,
    } = await transformMarkdown(inputString, {
      fileDirectoryPath: options.fileDirectoryPath || this.fileDirectoryPath,
      projectDirectoryPath: this.projectDirectoryPath.fsPath,
      forPreview: options.isForPreview,
      markdownParser: this.notebook.config.markdownParser,
      protocolsWhiteListRegExp: this.protocolsWhiteListRegExp,
      useRelativeFilePath: options.useRelativeFilePath,
      filesCache: this.filesCache,
      notebook: this.notebook,
      slideMarkerToken,
    });

    // process front-matter
    const fm = this.processFrontMatter(
      frontMatterString,
      options.hideFrontMatter,
    );
    const frontMatterTable = fm.table;
    let yamlConfig = fm.data || {};
    if (typeof yamlConfig !== 'object') {
      yamlConfig = {};
    }

    outputString = fm.content + outputString;

    /**
     * render markdown to html
     */
    let html: string;
    if (this.notebook.config.markdownParser === 'pandoc') {
      // pandoc
      try {
        let args = (yamlConfig['pandoc_args'] || []) as string[];
        if (!(args instanceof Array)) {
          args = [];
        }

        // check bibliography
        const noDefaultsOrCiteProc =
          args.find((el: string) => {
            return el.includes('pandoc-citeproc') || el.includes('--defaults');
          }) === undefined;

        if (
          noDefaultsOrCiteProc &&
          (yamlConfig['bibliography'] || yamlConfig['references'])
        ) {
          args.push('--citeproc');
        }

        args = this.notebook.config.pandocArguments.concat(args);
        html = await this.pandocRender(outputString, args);
      } catch (error) {
        html = `<pre class="language-text"><code>${escape(
          String(error),
        )}</code></pre>`;
      }
    } else {
      // markdown-it or markdown-yo
      // Set context so the wikilink renderer can call resolveWikilink()
      // with the correct current-note path, making wikiLinkResolution
      // actually affect the preview <a href>.
      this.notebook.currentRenderFilePath = path.relative(
        this.notebook.notebookPath.fsPath,
        this.filePath,
      );
      // For shortest mode, ensure the note index is populated so that
      // resolveWikilink() can find targets across the whole notebook.
      // relative and absolute modes compute paths from the link string
      // directly and never access this.notes.
      if (this.notebook.config.wikiLinkResolution === 'shortest') {
        await this.notebook.refreshNotesIfNotLoaded({
          dir: '.',
          includeSubdirectories: true,
        });
      }
      html = this.notebook.renderMarkdown(outputString, {
        isForPreview: options.isForPreview,
      });
    }

    /**
     * render tocHTML for [TOC] and sidebar TOC
     */
    // if (!utility.isArrayEqual(headings, this.headings)) { // <== this code is wrong, as it will always be true...
    const tocConfig = (yamlConfig['toc'] || {}) as Record<string, unknown>;
    const depthFrom = (tocConfig['depth_from'] as number | undefined) || 1;
    const depthTo = (tocConfig['depth_to'] as number | undefined) || 6;
    const ordered = !!tocConfig['ordered'];

    // Collaposible ToC
    // NOTE: We disable the source map here.
    const sidebarTocMd = this.notebook.getTocMarkdownIt();
    // The headings are the note's: the markup is read and sanitized as the
    // content of an element, which is what the sidebar of an export and the
    // page itself make of it.
    this.tocHTML = sanitizeStableHTML(
      generateSidebarToCHTML(headings, sidebarTocMd, {
        ordered,
        depthFrom,
        depthTo,
        tab: '  ',
      }),
    );

    // }
    this.headings = headings; // reset headings information

    if (tocBracketEnabled) {
      // [TOC]
      html = html.replace(tocMarkerRegExp(), ($0) => {
        // Check if $0 has `data-source-line` attribute
        const match = $0.match(/data-source-line="(\d+)"/);
        const lineNo = match ? match[1] : '';
        if (lineNo) {
          return `<div data-source-line="${lineNo}">${this.tocHTML}</div>`;
        } else {
          return this.tocHTML;
        }
      });
    }

    /**
     * resolve image paths and render code block.
     */
    const $ = cheerio.load(html);

    // markdown-yo outputs standard <pre><code class="language-xxx"> elements.
    // Normalize them to the data-role="codeBlock" format expected by all
    // render enhancers (code-block-styling, fenced-diagrams, fenced-math, etc.)
    // Also normalize headings: strip the {#id .class data-source-line="N"}
    // suffix appended by the transformer (markdown-it attrs syntax) and apply
    // those attributes directly to the heading elements.
    if (this.notebook.config.markdownParser === 'markdown-yo') {
      normalizeMarkdownYoCodeBlocks($);
      normalizeMarkdownYoHeadings($);
    }

    await enhanceWithFencedMath(
      $,
      this.notebook.config.mathRenderingOption,
      this.notebook.config.mathBlockDelimiters,
      this.notebook.config.katexConfig,
    );
    await enhanceWithFencedDiagrams({
      $,
      graphsCache: this.graphsCache,
      fileDirectoryPath: options.fileDirectoryPath || this.fileDirectoryPath,
      imageDirectoryPath: removeFileProtocol(
        this.resolveFilePath(this.notebook.config.imageFolderPath, false),
      ),
      plantumlServer: this.notebook.config.plantumlServer,
      plantumlJarPath: this.notebook.config.plantumlJarPath,
      kirokiServer: this.notebook.config.krokiServer,
      webSequenceDiagramsServer: this.notebook.config.webSequenceDiagramsServer,
      webSequenceDiagramsApiKey: this.notebook.config.webSequenceDiagramsApiKey,
      d2Path: this.notebook.config.d2Path,
      d2Layout: this.notebook.config.d2Layout,
      d2Theme: this.notebook.config.d2Theme,
      d2Sketch: this.notebook.config.d2Sketch,
    });
    await enhanceWithFencedCodeChunks(
      $,
      this.codeChunksData,
      options,
      this.generateRunOptions(),
    );
    await enhanceWithCodeBlockStyling($);
    await enhanceWithResolvedImagePaths(
      $,
      options,
      this.resolveFilePath.bind(this),
    );

    if (this.notebook.config.enableExtendedTableSyntax) {
      // extend table
      await enhanceWithExtendedTableSyntax($);
    }

    await enhanceWithEmbeddedWikilinks(
      $,
      this.notebook,
      options.fileDirectoryPath || this.fileDirectoryPath,
    );

    // Disable this function because of issue:
    // https://github.com/shd101wyy/markdown-preview-enhanced/issues/1287
    // if (options.emojiToSvg) {
    //   enhanceWithEmojiToSvg($);
    // }

    // Sanitize rendered HTML to prevent XSS (CVE-2025-65716)
    sanitizeRenderedHTML($);

    html =
      frontMatterTable +
      // NOTE: '\n' is necessary here. Otherwise, the first block of the body can
      // follow the front matter table on the same line, and a slide marker that
      // is not a paragraph of its own has to start a line to be found
      // (`parseSlides`).
      '\n' +
      $('head').html() +
      $('body').html(); // cheerio $.html() will add <html><head></head><body>$html</body></html>, so we hack it by select body first.

    // The browser reads the page once more than the sanitizer above (an export
    // is a document, the preview is written into an element), and in MathML
    // and SVG it can read it differently there.
    html = settledHTML($, html);

    /**
     * check slides
     */
    let presentationMode = false;
    if (slideConfigs.length) {
      const presentation = this.parseSlides(
        html,
        slideConfigs,
        options.useRelativeFilePath,
        slideMarkerToken,
      );
      // No marker of a slide is in the page, as when an import that is a
      // code block brought their configurations along.
      if (presentation !== null) {
        html = presentation;
        presentationMode = true;
        if (yamlConfig) {
          yamlConfig['isPresentationMode'] = true; // mark as presentation mode
        }
      }
    }

    if (this.notebook.config.parserConfig.onDidParseMarkdown) {
      html = await this.notebook.config.parserConfig.onDidParseMarkdown(html);
    }

    if (options.runAllCodeChunks) {
      await runCodeChunks(this.codeChunksData, this.generateRunOptions());
      options.runAllCodeChunks = false;
      return this.parseMD(inputString, options);
    }

    if (options.isForPreview) {
      // this.cachedHTML = html // save to cache
      this.isPreviewInPresentationMode = presentationMode; // check presentation mode
    }

    if (options.triggeredBySave && yamlConfig['export_on_save']) {
      // export files
      this.exportOnSave(yamlConfig['export_on_save'] as JsonObject);
    }

    if (!this.notebook.config.enableScriptExecution) {
      // disable importing js and css files.
      JSAndCssFiles = [];
    }

    return {
      html,
      markdown: inputString,
      tocHTML: this.tocHTML,
      yamlConfig,
      JSAndCssFiles,
    };
  }

  /**
   * legacy method to support backwards compatibility
   */
  public runCodeChunks() {
    return runCodeChunks(this.codeChunksData, this.generateRunOptions());
  }

  /**
   * legacy method to support backwards compatibility
   */
  public runCodeChunk(id: string) {
    return runCodeChunk(id, this.codeChunksData, this.generateRunOptions());
  }

  /**
   * Modify markdown source, append `result` after corresponding code chunk.
   * @param codeChunkData
   * @param result
   */
  private async modifySource(
    codeChunkData: CodeChunkData,
    result: string,
    filePath: string,
  ) {
    const doneRunning = () => {
      // Done with the code chunk
      codeChunkData.running = false;
      return result;
    };

    const markdown = await this.notebook.fs.readFile(filePath);
    if (!markdown) {
      return doneRunning();
    }

    const insertResult = async (i: number, lines: string[]) => {
      const lineCount = lines.length;
      let start = 0;
      // find <!-- code_chunk_output -->
      for (let j = i + 1; j < i + 6 && j < lineCount; j++) {
        if (lines[j].startsWith('<!-- code_chunk_output -->')) {
          start = j;
          break;
        }
      }
      if (start) {
        // found
        // TODO: modify exited output
        let end = start + 1;
        while (end < lineCount) {
          if (lines[end].startsWith('<!-- /code_chunk_output -->')) {
            break;
          }
          end += 1;
        }

        // if output not changed, then no need to modify editor buffer
        let r = '';
        for (let i = start + 2; i < end - 1; i++) {
          r += lines[i] + '\n';
        }
        if (r === result + '\n') {
          // no need to modify output
          return '';
        }

        const newLines = [
          ...lines.slice(0, start + 2),
          result,
          ...lines.slice(end - 1),
        ];

        // Write newLines to file
        await this.notebook.fs.writeFile(filePath, newLines.join('\n'));
        return '';
      } else {
        const newLines = [
          ...lines.slice(0, i + 1),
          `\n<!-- code_chunk_output -->\n\n${result}\n\n<!-- /code_chunk_output -->\n`,
          ...lines.slice(i + 1),
        ];

        // Write newLines to file
        await this.notebook.fs.writeFile(filePath, newLines.join('\n'));
        return '';
      }
    };

    const lines = markdown.split('\n') || [];
    const lineCount = lines.length;
    let codeChunkOffset = 0;
    const targetCodeChunkOffset =
      codeChunkData.normalizedInfo.attributes['code_chunk_offset'];
    for (let i = 0; i < lineCount; i++) {
      const line = lines[i];
      if (line.match(/^```(.+)"?cmd"?\s*[=\s}]/)) {
        if (codeChunkOffset === targetCodeChunkOffset) {
          i = i + 1;
          while (i < lineCount) {
            if (lines[i].match(/^```\s*/)) {
              break;
            }
            i += 1;
          }
          await insertResult(i, lines);
          break;
        } else {
          codeChunkOffset++;
        }
      } else if (line.match(/@import\s+(.+)"?cmd"?\s*[=\s}]/)) {
        if (codeChunkOffset === targetCodeChunkOffset) {
          await insertResult(i, lines);
          break;
        } else {
          codeChunkOffset++;
        }
      }
    }

    // Done with the code chunk
    return doneRunning();
  }

  private generateRunOptions(): RunCodeChunkOptions {
    return {
      enableScriptExecution: this.notebook.config.enableScriptExecution,
      fileDirectoryPath: this.fileDirectoryPath,
      filePath: this.filePath,
      imageFolderPath: this.notebook.config.imageFolderPath,
      latexEngine: this.notebook.config.latexEngine,
      modifySource: this.modifySource.bind(this),
      parseMD: this.parseMD.bind(this),
      headings: this.headings,
    };
  }
}
