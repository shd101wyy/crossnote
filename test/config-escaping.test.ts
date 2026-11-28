import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Script } from 'vm';
import { load } from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { cssForStyle } from '../src/lib/css-for-style';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { buildMermaidExportScript } from '../src/markdown-engine/mermaid-export';
import { Notebook } from '../src/notebook';
import {
  getDefaultNotebookConfig,
  type NotebookConfig,
  type WebviewConfig,
} from '../src/notebook/types';
import {
  getCrossnoteBuildDirectory,
  setCrossnoteBuildDirectory,
} from '../src/utility';

/**
 * Values of the notebook's configuration are written into the templates of the
 * preview and of the exports. They come from settings or from
 * `.crossnote/config.js`, which can be a workspace's as much as a user's, so
 * each is escaped for where it is written — as the front matter is
 * (`test/front-matter-escaping.test.ts`), whose setup this follows.
 */

jest.mock('less', () => ({
  render: (
    _input: string,
    _options: unknown,
    callback: (error: unknown, output: { css: string } | undefined) => void,
  ) => {
    callback(null, { css: '' });
  },
}));

/** Ends a script element wherever it is written, quoted or not. */
const SCRIPT_END = '</script><script>window.__pwn = 1</script>';
/** Ends a style element wherever it is written. */
const STYLE_END = '</style><script>window.__pwn = 1</script>';
/**
 * Ends the attribute a value is written into — whichever quotes it has — with
 * an event handler after it.
 */
const OUT_OF_ATTRIBUTE =
  'x" onload="window.__pwn = 1;//\' onload=\'window.__pwn = 1;//';
/** Ends the single-quoted string a value is written into inside a script. */
const OUT_OF_SINGLE_QUOTES = "x' + (window.__pwn = 1) + '";
/** Ends the double-quoted string a value is written into inside a script. */
const OUT_OF_DOUBLE_QUOTES = 'x" + (window.__pwn = 1) + "';

/** How many script elements a page has, as a browser reads them. */
const countScripts = (html: string) => load(html)('script').length;

/** What counts: the script elements of a page that run `window.__pwn = 1`. */
function injectedScripts(html: string): string[] {
  const $ = load(html);
  const injected: string[] = [];
  $('script').each((_i: number, element: Element) => {
    const text = $(element).html() ?? '';
    if (/^\s*window\.__pwn\b/.test(text)) {
      injected.push(text);
    }
  });
  return injected;
}

/** The event handler attributes of a page, as a browser reads them. */
function eventHandlers(html: string): string[] {
  const $ = load(html);
  const handlers: string[] = [];
  $('*').each((_i: number, element: AnyNode) => {
    // A script or a style element is an element too, with attributes.
    if (!('tagName' in element)) {
      return;
    }
    for (const name of Object.keys($(element).attr() ?? {})) {
      if (/^on/i.test(name)) {
        handlers.push(`${element.tagName}[${name}]`);
      }
    }
  });
  return handlers;
}

/** The scripts and styles a page loads from the web, as a browser reads them. */
function webAddresses(html: string): string[] {
  const $ = load(html);
  const addresses: string[] = [];
  $('link[href], script[src]').each((_i: number, element: Element) => {
    const address = $(element).attr('href') ?? $(element).attr('src') ?? '';
    if (/^https:\/\//.test(address)) {
      addresses.push(address);
    }
  });
  return addresses.sort();
}

/** The text of the one script element of a page that holds `text`. */
function scriptHolding(html: string, text: string): string {
  const $ = load(html);
  const contents = $('script')
    .toArray()
    .map((script) => $(script).html() ?? '');
  const found = contents.filter((content) => content.includes(text));
  expect(found).toHaveLength(1);
  return found[0];
}

/** The configuration the page hands to MathJax in its `window.MathJax`. */
function mathJaxConfigIn(html: string): Record<string, unknown> {
  const assignment = 'window.MathJax = (';
  const script = scriptHolding(html, assignment);
  const json = script.slice(
    script.indexOf(assignment) + assignment.length,
    script.indexOf(');'),
  );
  return JSON.parse(json) as Record<string, unknown>;
}

track();

/** The notebook of the tests; also its build directory, like the other exports. */
const tmpDir = mkdirSync({ prefix: 'xnote-config-escaping-' });
const notePath = path.join(tmpDir, 'note.md');
/** Where a script is run by the script engine below. */
const checkDir = mkdirSync({ prefix: 'xnote-config-escaping-check-' });

/** The page of a note, with the configuration of its notebook. */
async function createEngine(markdown: string, config: object = {}) {
  fs.writeFileSync(notePath, markdown);
  const notebook = await Notebook.init({
    notebookPath: tmpDir,
    config: {
      markdownParser: 'markdown-it',
      markdownYoBinaryPath: '',
      mathRenderingOption: 'None',
      ...config,
    } as Partial<NotebookConfig>,
  });
  return {
    notebook,
    engine: new MarkdownEngine({ notebook, filePath: notePath }),
  };
}

/** The document `htmlExport` writes, before its images are embedded. */
async function exportPage(
  markdown: string,
  config: object,
  { offline = false }: { offline?: boolean } = {},
): Promise<string> {
  const { engine } = await createEngine(markdown, config);
  return engine.htmlExportDocument({ offline, embedSVG: false });
}

/** The page of the preview. */
async function previewPage(markdown: string, config: object): Promise<string> {
  const { engine, notebook } = await createEngine(markdown, config);
  return engine.generateHTMLTemplateForPreview({
    inputString: markdown,
    config: notebook.config as WebviewConfig,
    vscodePreviewPanel: null,
  });
}

/** What the script that draws the mermaid diagrams of an export handed on. */
interface MermaidExportRun {
  initialized: Record<string, unknown>[];
  pwn: unknown;
  status?: string;
}

/**
 * Run that script in the script engine itself, with mermaid, the document and
 * the window as stubs that report what they are given.
 */
function runMermaidExport(script: string): MermaidExportRun {
  const file = path.join(checkDir, 'mermaid-export.mjs');
  fs.writeFileSync(
    file,
    `
const report = { initialized: [] }
const window = {}
const mermaid = {
  startOnLoad: true,
  registerExternalDiagrams() {},
  initialize(config) { report.initialized.push(config) },
  async run() {},
}
const document = {
  body: {},
  querySelector() { return null },
  querySelectorAll() { return [] },
}
${script}
console.log(JSON.stringify({
  ...report,
  pwn: window.__pwn,
  status: window.__crossnoteMermaidExport && window.__crossnoteMermaidExport.status,
}))
`,
  );
  const run = spawnSync(process.execPath, [file]);
  // The failed import of the ZenUML module is the script's own to report.
  if (run.status !== 0) {
    throw new Error(String(run.stderr));
  }
  return JSON.parse(String(run.stdout)) as MermaidExportRun;
}

/** The line that gives mermaid its theme, of a script that initializes it. */
function themeLine(script: string): string {
  const line = script.match(/^.*MERMAID_CONFIG\.theme = .*$/m);
  expect(line).not.toBeNull();
  return line![0];
}

describe('configuration values written into a page', () => {
  const originalBuildDirectory = getCrossnoteBuildDirectory();

  beforeAll(() => {
    const revealDir = path.join(tmpDir, 'dependencies', 'reveal');
    for (const dir of [
      path.join(revealDir, 'js'),
      path.join(revealDir, 'css', 'theme'),
      path.join(tmpDir, 'styles', 'preview_theme'),
      path.join(tmpDir, 'styles', 'prism_theme'),
    ]) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'prism_theme', 'default.css'),
      '/* prism:default */',
    );
    fs.writeFileSync(path.join(revealDir, 'js', 'reveal.js'), '/* reveal */');
    fs.writeFileSync(path.join(revealDir, 'css', 'reveal.css'), '/* css */');
    fs.writeFileSync(
      path.join(revealDir, 'css', 'theme', 'white.css'),
      '/* theme */',
    );
    setCrossnoteBuildDirectory(tmpDir);
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(originalBuildDirectory);
  });

  describe('jsdelivrCdnHost', () => {
    /** What each script and style is at the CDN, as the export names them. */
    const CDN_FILES = [
      'katex@0.19.1/dist/katex.min.css',
      '@fortawesome/fontawesome-free@6.4.2/css/all.min.css',
      'mermaid@12.4.0/dist/mermaid.min.js',
      'pele@1.13.0/dist/pele.global.js',
      'wavedrom@3.3.0/skins/default.js',
      'wavedrom@3.3.0/skins/narrow.js',
      'wavedrom@3.3.0/wavedrom.min.js',
      'vega@5.25.0/build/vega.js',
      'vega-lite@5.16.1/build/vega-lite.js',
      'vega-embed@6.23.0/build/vega-embed.js',
      'reveal.js@6.0.2/dist/reveal.js',
      'reveal.js@6.0.2/dist/theme/white.css',
    ];
    const at = (host: string) =>
      CDN_FILES.map((file) => `https://${host}/npm/${file}`).sort();
    const KATEX =
      '<link rel="stylesheet" href="https://cdn.example.com/npm/katex@0.19.1/dist/katex.min.css">';

    test('is the host of every script and style an export loads from the CDN', async () => {
      // A deck with one of everything an export loads from the CDN; the
      // element of an interactive vega diagram and a font-awesome icon are
      // what their renderers leave in the page.
      const deck = [
        '<!-- slide -->',
        '# One',
        '',
        '```mermaid',
        'graph TD',
        'A[ZenUML example] --> B',
        '```',
        '',
        '```pele',
        'graph TD',
        'A --> B',
        '```',
        '',
        '```wavedrom',
        "{ signal: [{ name: 'clk', wave: 'p...' }] }",
        '```',
        '',
        '<div class="vega-lite"></div>',
        '<i class="fa fa-smile"></i>',
        '',
        '<!-- slide -->',
        '# Two',
        '',
      ].join('\n');
      const config = {
        jsdelivrCdnHost: 'cdn.example.com',
        mathRenderingOption: 'KaTeX',
      };
      const plain = await exportPage(deck, config);
      const hostile = await exportPage(deck, {
        ...config,
        jsdelivrCdnHost: OUT_OF_ATTRIBUTE,
      });

      // An ordinary host gives the URLs the export has always written.
      expect(webAddresses(plain)).toEqual(at('cdn.example.com'));
      expect(plain).toContain(KATEX);
      // A host with a quote in it is no attribute of its own...
      expect(eventHandlers(hostile)).toEqual([]);
      // ...and is still the host of each URL.
      expect(webAddresses(hostile)).toEqual(at(OUT_OF_ATTRIBUTE));
    });

    test('is the host of the stylesheet an eBook loads from the CDN', async () => {
      const note =
        '---\nebook:\n  title: T\n  html:\n    cdn: true\n---\n\n$x$\n';
      const eBook = async (jsdelivrCdnHost: string) => {
        const { engine } = await createEngine(note, {
          jsdelivrCdnHost,
          mathRenderingOption: 'KaTeX',
        });
        return fs.readFileSync(
          await engine.eBookExport({ fileType: 'html' }),
          'utf8',
        );
      };
      const plain = await eBook('cdn.example.com');
      const hostile = await eBook(OUT_OF_ATTRIBUTE);

      const katex = `https://HOST/npm/katex@0.19.1/dist/katex.min.css`;

      expect(plain).toContain(KATEX);
      expect(webAddresses(plain)).toEqual([
        katex.replace('HOST', 'cdn.example.com'),
      ]);
      expect(eventHandlers(hostile)).toEqual([]);
      expect(webAddresses(hostile)).toEqual([
        katex.replace('HOST', OUT_OF_ATTRIBUTE),
      ]);
    });

    test('stays inside the string of the ZenUML import of an export', () => {
      const zenuml =
        '/npm/@mermaid-js/mermaid-zenuml@0.1.0/dist/mermaid-zenuml.esm.min.mjs';
      const jsdelivrCdnHost = OUT_OF_SINGLE_QUOTES;
      const hostile = buildMermaidExportScript(
        { ...getDefaultNotebookConfig(), jsdelivrCdnHost },
        true,
      );

      // A quote in the host runs nothing of its own.
      const run = runMermaidExport(hostile);
      expect(run.pwn).toBeUndefined();
      expect(run.status).toBe('error');
      // The address is one string, holding the host as it was written.
      const literal = hostile.match(/^.*await import\((".*")\);?$/m);
      expect(literal).not.toBeNull();
      expect(JSON.parse(literal![1])).toBe(
        `https://${jsdelivrCdnHost}${zenuml}`,
      );

      // An ordinary host is imported from where it always was.
      const plain = buildMermaidExportScript(getDefaultNotebookConfig(), true);
      expect(plain).toContain(
        `await import("https://cdn.jsdelivr.net${zenuml}")`,
      );
    });
  });

  describe('mermaidTheme', () => {
    test('cannot end the script that initializes mermaid in a preview', async () => {
      const note = '# One\n';
      const plain = await previewPage(note, {});
      const hostile = await previewPage(note, {
        mermaidTheme: SCRIPT_END as NotebookConfig['mermaidTheme'],
      });

      expect(plain).toContain(
        'MERMAID_CONFIG.theme = MERMAID_CONFIG.theme || "default"',
      );
      expect(countScripts(hostile)).toBe(countScripts(plain));
      expect(injectedScripts(hostile)).toEqual([]);
      // The theme is where mermaid reads it, as it was written.
      const script = scriptHolding(hostile, 'MERMAID_CONFIG');
      expect(() => new Script(script)).not.toThrow();
      expect(JSON.parse(themeLine(script).split('|| ')[1])).toBe(SCRIPT_END);
    });

    test('cannot end the script that draws mermaid diagrams in an export', async () => {
      const note = '```mermaid\ngraph TD\nA --> B\n```\n';
      const plain = await exportPage(note, {});
      const hostile = await exportPage(note, {
        mermaidTheme: SCRIPT_END as NotebookConfig['mermaidTheme'],
      });

      expect(plain).toContain(
        'MERMAID_CONFIG.theme = MERMAID_CONFIG.theme || "default"',
      );
      expect(countScripts(hostile)).toBe(countScripts(plain));
      expect(injectedScripts(hostile)).toEqual([]);
    });

    test('is where the export script gives mermaid its theme, as it was written', () => {
      const mermaidTheme =
        OUT_OF_DOUBLE_QUOTES as NotebookConfig['mermaidTheme'];
      const run = runMermaidExport(
        buildMermaidExportScript(
          { ...getDefaultNotebookConfig(), mermaidTheme },
          false,
        ),
      );

      // The line cannot be left by a quote either.
      expect(run.pwn).toBeUndefined();
      expect(run.initialized).toEqual([
        { startOnLoad: false, cloneCssStyles: false, theme: mermaidTheme },
      ]);
    });
  });

  describe('mermaidConfig', () => {
    const config = {
      mermaidConfig: { note: SCRIPT_END } as NotebookConfig['mermaidConfig'],
    };
    /** The configuration as the script writes it: no `<` in it. */
    const written = JSON.stringify(config.mermaidConfig).replace(
      /</g,
      '\\u003c',
    );

    test('cannot end the script that initializes mermaid in a preview', async () => {
      const note = '# One\n';
      const plain = await previewPage(note, {});
      const hostile = await previewPage(note, config);

      expect(plain).toContain('var MERMAID_CONFIG = ({"startOnLoad":false});');
      expect(countScripts(hostile)).toBe(countScripts(plain));
      expect(injectedScripts(hostile)).toEqual([]);
      // The configuration is where mermaid reads it, as it was written.
      const script = scriptHolding(hostile, 'MERMAID_CONFIG');
      expect(() => new Script(script)).not.toThrow();
      expect(
        JSON.parse(script.match(/^var MERMAID_CONFIG = \((.*)\);$/m)![1]),
      ).toEqual(config.mermaidConfig);
    });

    test('cannot end the script that draws mermaid diagrams in an export', async () => {
      const note = '```mermaid\ngraph TD\nA --> B\n```\n';
      const plain = await exportPage(note, {});
      const hostile = await exportPage(note, config);

      expect(plain).toContain('var MERMAID_CONFIG = ({"startOnLoad":false});');
      expect(countScripts(hostile)).toBe(countScripts(plain));
      expect(injectedScripts(hostile)).toEqual([]);
      expect(scriptHolding(hostile, 'MERMAID_CONFIG')).toContain(
        `var MERMAID_CONFIG = (${written});`,
      );
    });

    test('is where the export script gives mermaid its configuration, as it was written', () => {
      const run = runMermaidExport(
        buildMermaidExportScript(
          { ...getDefaultNotebookConfig(), ...config },
          false,
        ),
      );

      expect(run.pwn).toBeUndefined();
      expect(run.initialized).toEqual([
        {
          ...config.mermaidConfig,
          startOnLoad: false,
          cloneCssStyles: false,
          theme: 'default',
        },
      ]);
    });
  });

  describe('mathjaxConfig', () => {
    const config = {
      mathRenderingOption: 'MathJax',
      mathjaxConfig: { note: SCRIPT_END },
    };
    const note = '# One\n';

    test('cannot end the script that configures MathJax in a preview', async () => {
      const plain = await previewPage(note, { mathRenderingOption: 'MathJax' });
      const hostile = await previewPage(note, config);

      expect(countScripts(hostile)).toBe(countScripts(plain));
      expect(injectedScripts(hostile)).toEqual([]);
      // The configuration is where MathJax reads it, as it was written.
      expect(mathJaxConfigIn(hostile).note).toBe(SCRIPT_END);
    });

    test('cannot end the script that configures MathJax in an export', async () => {
      const plain = await exportPage(note, { mathRenderingOption: 'MathJax' });
      const hostile = await exportPage(note, config);

      expect(countScripts(hostile)).toBe(countScripts(plain));
      expect(injectedScripts(hostile)).toEqual([]);
      expect(mathJaxConfigIn(hostile).note).toBe(SCRIPT_END);
    });
  });

  describe('mathjaxScriptSrc', () => {
    const DEFAULT = 'https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js';
    /** The address the page loads MathJax from, as a browser reads it. */
    const mathJaxSources = (html: string) => {
      const $ = load(html);
      const sources: string[] = [];
      $('script[defer]').each((_i: number, element: Element) => {
        sources.push($(element).attr('src') ?? '');
      });
      return sources;
    };
    const config = { mathRenderingOption: 'MathJax' };
    const note = '# One\n';
    const pages: Record<string, [string, (c: object) => Promise<string>]> = {
      'a preview': [
        `<script type="text/javascript" defer src="${DEFAULT}" charset="UTF-8"></script>`,
        (c) => previewPage(note, c),
      ],
      'an export': [
        `<script type="text/javascript" defer src="${DEFAULT}"></script>`,
        (c) => exportPage(note, c),
      ],
      'an offline export': [
        `<script type="text/javascript" defer src="${DEFAULT}" charset="UTF-8"></script>`,
        (c) => exportPage(note, c, { offline: true }),
      ],
    };

    test.each(['a preview', 'an export', 'an offline export'])(
      'stays in the attribute that loads MathJax in %s',
      async (page) => {
        const [written, render] = pages[page];
        const plain = await render(config);
        const hostile = await render({
          ...config,
          mathjaxScriptSrc: OUT_OF_ATTRIBUTE,
        });

        // An ordinary address is written as it always was.
        expect(plain).toContain(written);
        // One with a quote in it is the address still...
        expect(mathJaxSources(hostile)).toEqual([OUT_OF_ATTRIBUTE]);
        // ...and is no attribute of its own.
        expect(eventHandlers(hostile)).toEqual([]);
      },
    );
  });

  describe('globalCss', () => {
    /** A stylesheet whose one string holds `ending`. */
    const css = (ending: string) => `.x::after { content: "${ending}" }`;
    /** The stylesheet as it is written into a style element. */
    const cssWritten = (ending: string) => css(ending).replace(/<\//g, '<\\/');
    const note = '# One\n';

    test('cannot end the style element of a preview', async () => {
      const plain = await previewPage(note, { globalCss: css('') });
      const hostile = await previewPage(note, { globalCss: css(STYLE_END) });

      expect(plain).toContain(`<style>${css('')}</style>`);
      expect(countScripts(hostile)).toBe(countScripts(plain));
      expect(injectedScripts(hostile)).toEqual([]);
      // `/` is written escaped, which a stylesheet reads as `/` in a string.
      expect(hostile).toContain(`<style>${cssWritten(STYLE_END)}</style>`);
    });

    test('cannot end the style element of an export', async () => {
      const plain = await exportPage(note, { globalCss: css('') });
      const hostile = await exportPage(note, { globalCss: css(STYLE_END) });

      expect(plain).toContain(css(''));
      expect(countScripts(hostile)).toBe(countScripts(plain));
      expect(injectedScripts(hostile)).toEqual([]);
      expect(hostile).toContain(cssWritten(STYLE_END));
    });

    // A configuration may hold `null` for it, or nothing at all.
    test.each([
      ['null', null],
      ['undefined', undefined],
    ])(
      'that is %s is no stylesheet: a preview and an export are made',
      async (_, globalCss) => {
        await expect(previewPage(note, { globalCss })).resolves.toContain(
          '<body',
        );
        await expect(exportPage(note, { globalCss })).resolves.toContain('<h1');
      },
    );

    test('cannot end the style element of an eBook', async () => {
      const ebook = '---\nebook:\n  title: T\n---\n\n# One\n';
      const eBook = async (globalCss: string) => {
        const { engine } = await createEngine(ebook, { globalCss });
        return fs.readFileSync(
          await engine.eBookExport({ fileType: 'html' }),
          'utf8',
        );
      };
      const plain = await eBook(css(''));
      const hostile = await eBook(css(STYLE_END));

      expect(plain).toContain(css(''));
      expect(countScripts(hostile)).toBe(countScripts(plain));
      expect(injectedScripts(hostile)).toEqual([]);
      expect(hostile).toContain(cssWritten(STYLE_END));
    });
  });

  test('an export read as a document again has no attribute or script of any of them', async () => {
    const note = '```mermaid\ngraph TD\nA --> B\n```\n';
    const style = `.x::after { content: "${STYLE_END}" }`;
    const render = async (config: object) => {
      const { engine } = await createEngine(note, config);
      return engine.htmlExportDocument();
    };
    const plain = await render({ mathRenderingOption: 'MathJax' });
    const hostile = await render({
      jsdelivrCdnHost: OUT_OF_ATTRIBUTE,
      mathRenderingOption: 'MathJax',
      mathjaxScriptSrc: OUT_OF_ATTRIBUTE,
      mermaidTheme: SCRIPT_END as NotebookConfig['mermaidTheme'],
      mermaidConfig: { note: SCRIPT_END } as NotebookConfig['mermaidConfig'],
      mathjaxConfig: { note: SCRIPT_END },
      globalCss: style,
    });

    expect(countScripts(hostile)).toBe(countScripts(plain));
    expect(injectedScripts(hostile)).toEqual([]);
    expect(eventHandlers(hostile)).toEqual([]);
  });
});

describe('cssForStyle', () => {
  test.each([
    ['a stylesheet', '.a { color: red }'],
    ['a `<` that ends nothing', '.a[b<c] { color: red }'],
    ['a `<` and a `/` apart', '.a::after { content: "< /" }'],
    ['an empty stylesheet', ''],
  ])('writes %s as it is', (_, css) => {
    expect(cssForStyle(css)).toBe(css);
  });

  test.each([[null], [undefined]])('gives %s back as it is', (css) => {
    expect(cssForStyle(css as unknown as string)).toBe(css);
  });

  test('writes no `</`, so that nothing in it can end the element', () => {
    expect(
      cssForStyle('.a::after { content: "</style>" } /* </STYLE> */'),
    ).not.toContain('</');
  });
});
