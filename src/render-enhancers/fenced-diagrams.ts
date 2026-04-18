// tslint:disable:ban-types no-var-requires
import type { CheerioAPI, Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import fetch from 'cross-fetch';
import { escape } from 'html-escaper';
import * as YAML from 'yaml';
import {
  BlockAttributes,
  stringifyBlockAttributes,
} from '../lib/block-attributes';
import { BlockInfo } from '../lib/block-info';
import computeChecksum from '../lib/compute-checksum';
import { renderBitfield } from '../renderers/bitfield';
import { D2_NOT_FOUND, renderD2 } from '../renderers/d2';
import { TIKZ_NOT_AVAILABLE, renderTikz } from '../renderers/tikz';
import { render as renderPlantuml } from '../renderers/puml';
import { toSVG as vegaToSvg } from '../renderers/vega';
import { toSVG as vegaLiteToSvg } from '../renderers/vega-lite';
import { Viz } from '../renderers/viz';
import { buildWsdImageUrl } from '../renderers/wsd';

// NOTE: We shouldn't need this function anymore
// because we always put `language` as a class in the attributes.
const ensureClassInAttributes = (
  attributes: BlockAttributes,
  className: string,
) => {
  const existingClassNames: string = attributes['class'] || '';
  if (existingClassNames.split(' ').indexOf(className) === -1) {
    return {
      ...attributes,
      ['class']: `${existingClassNames} ${className}`.trim(),
    };
  } else {
    return attributes;
  }
};

// same order as in docs
const supportedLanguages = [
  'mermaid',
  'puml',
  'plantuml',
  'wavedrom',
  'bitfield',
  'bit-field',
  'graphviz',
  'viz',
  'dot',
  'vega',
  'vega-lite',
  'wsd',
  'd2',
  'tikz',
];

/**
 * This function resolves image paths and render code blocks
 * @param html the html string that we will analyze
 * @return html
 */
export default async function enhance({
  $,
  graphsCache,
  fileDirectoryPath,
  imageDirectoryPath,
  plantumlServer,
  plantumlJarPath,
  kirokiServer,
  webSequenceDiagramsServer,
  webSequenceDiagramsApiKey,
  d2Path,
  d2Layout,
  d2Theme,
  d2Sketch,
}: {
  $: CheerioAPI;
  graphsCache: { [key: string]: string };
  fileDirectoryPath: string;
  imageDirectoryPath: string;
  plantumlServer: string;
  plantumlJarPath: string;
  kirokiServer: string;
  webSequenceDiagramsServer: string;
  webSequenceDiagramsApiKey: string;
  d2Path: string;
  d2Layout: string;
  d2Theme: number;
  d2Sketch: boolean;
}): Promise<void> {
  const asyncFunctions: Promise<void>[] = [];
  const allBlocks = $('[data-role="codeBlock"]');
  allBlocks.each((i, container) => {
    const $container = $(container);
    if ($container.data('executor')) {
      return;
    }

    const normalizedInfo: BlockInfo = $container.data(
      'normalizedInfo',
    ) as BlockInfo;
    // Check if Kroki is enabled
    const isKroki =
      !!normalizedInfo.attributes['kroki'] ||
      normalizedInfo.language.startsWith('kroki-');
    if (
      normalizedInfo.attributes['literate'] === false ||
      normalizedInfo.attributes['cmd'] === false ||
      (supportedLanguages.indexOf(normalizedInfo.language) === -1 &&
        !isKroki) ||
      normalizedInfo.attributes['code_block'] === true
    ) {
      return;
    }
    $container.data('executor', 'fenced-diagrams');

    if (normalizedInfo.attributes['literate'] === false) {
      return;
    }

    asyncFunctions.push(
      renderDiagram({
        $container,
        normalizedInfo,
        $,
        graphsCache,
        fileDirectoryPath,
        imageDirectoryPath,
        plantumlServer,
        plantumlJarPath,
        isKroki,
        kirokiServer,
        webSequenceDiagramsServer,
        webSequenceDiagramsApiKey,
        d2Path,
        d2Layout,
        d2Theme,
        d2Sketch,
      }),
    );
  });
  await Promise.all(asyncFunctions);
}

async function renderDiagram({
  $container,
  normalizedInfo,
  $,
  graphsCache,
  fileDirectoryPath,
  plantumlServer,
  plantumlJarPath,
  isKroki,
  kirokiServer,
  webSequenceDiagramsServer,
  webSequenceDiagramsApiKey,
  d2Path,
  d2Layout,
  d2Theme,
  d2Sketch,
}: {
  $container: Cheerio<AnyNode>;
  normalizedInfo: BlockInfo;
  $: CheerioAPI;
  graphsCache: { [key: string]: string };
  fileDirectoryPath: string;
  imageDirectoryPath: string;
  plantumlJarPath: string;
  plantumlServer: string;
  isKroki: boolean;
  kirokiServer: string;
  webSequenceDiagramsServer: string;
  webSequenceDiagramsApiKey: string;
  d2Path: string;
  d2Layout: string;
  d2Theme: number;
  d2Sketch: boolean;
}): Promise<void> {
  let $output: string | Cheerio<AnyNode> | null = null;

  const code = $container.text();
  const checksum = computeChecksum(JSON.stringify(normalizedInfo) + code);
  const diagramInCache: string = graphsCache[checksum];

  if (isKroki) {
    if (diagramInCache) {
      $output = diagramInCache;
    } else {
      // Kroki is a service that can render diagrams from textual descriptions
      // see https://kroki.io/
      const krokiURL = kirokiServer || 'https://kroki.io';

      const krokiDiagramType =
        typeof normalizedInfo.attributes['kroki'] === 'string'
          ? normalizedInfo.attributes['kroki']
          : normalizedInfo.language.replace(/^kroki-/, '');

      // NOTE: Code below are using GET request, but it's not working for large diagrams
      // So we use POST request instead
      // Convert code to deflate+base64
      /*
      const data = Buffer.from(code, 'utf8');
      const compressed = pako.deflate(data, { level: 9 });
      const result = Buffer.from(compressed)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const krokiDiagramURL = `${krokiURL}/${krokiDiagramType}/${normalizedInfo
        .attributes['output'] ?? 'svg'}/${result}`;
      */
      try {
        const req = await fetch(
          `${krokiURL}/${krokiDiagramType}/${
            normalizedInfo.attributes['output'] ?? 'svg'
          }`,
          {
            method: 'POST',
            body: code,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          },
        );
        const diagram = await req.text();

        $output = `<div ${stringifyBlockAttributes(
          ensureClassInAttributes(
            normalizedInfo.attributes,
            normalizedInfo.language,
          ),
        )}>${diagram}</div>`;

        graphsCache[checksum] = $output; // store to new cache
      } catch (error) {
        $output = `<pre class="language-text"><code>${escape(
          String(error),
        )}</code></pre>`;
      }
    }
  } else {
    try {
      switch (normalizedInfo.language) {
        case 'mermaid': {
          // these diagrams are rendered on the client
          $output = `<div ${stringifyBlockAttributes(
            ensureClassInAttributes(
              normalizedInfo.attributes,
              normalizedInfo.language,
            ),
          )}>${escape(code)}</div>`;
          break;
        }
        case 'wavedrom': {
          // wavedrom is also rendered on the client, but using <script>
          $output = `<div ${stringifyBlockAttributes(
            ensureClassInAttributes(
              normalizedInfo.attributes,
              normalizedInfo.language,
            ),
          )}><script type="WaveDrom">${code}</script></div>`;
          break;
        }
        case 'puml':
        case 'plantuml': {
          let svg = diagramInCache;
          if (!svg) {
            svg = await renderPlantuml({
              content: code,
              fileDirectoryPath,
              serverURL: plantumlServer,
              plantumlJarPath,
            });
            graphsCache[checksum] = svg; // store to new cache
          }
          $output = `<p ${stringifyBlockAttributes(
            normalizedInfo.attributes,
          )}>${svg}</p>`;
          break;
        }
        case 'bitfield':
        case 'bit-field': {
          let svg = diagramInCache;
          if (!svg) {
            svg = await renderBitfield(code, normalizedInfo.attributes);
            graphsCache[checksum] = svg; // store to new cache
          }
          $output = `<p ${stringifyBlockAttributes(
            normalizedInfo.attributes,
          )}>${svg}</p>`;
          break;
        }
        case 'graphviz':
        case 'viz':
        case 'dot': {
          let svg = diagramInCache;
          if (!svg) {
            const engine = normalizedInfo.attributes['engine'] || 'dot';
            svg = await Viz(code, { engine });
            graphsCache[checksum] = svg; // store to new cache
          }
          $output = `<p ${stringifyBlockAttributes(
            normalizedInfo.attributes,
          )}>${svg}</p>`;
          break;
        }
        case 'vega':
        case 'vega-lite': {
          if (normalizedInfo.attributes['interactive'] === true) {
            const rawSpec = code.trim();
            let spec;
            if (rawSpec[0] !== '{') {
              // yaml
              spec = YAML.parse(rawSpec);
            } else {
              // json
              spec = JSON.parse(rawSpec);
            }
            $output = hiddenCode(
              escape(JSON.stringify(spec)),
              normalizedInfo.attributes,
              normalizedInfo.language,
            );
          } else {
            let svg = diagramInCache;
            if (!svg) {
              const vegaFunctionToCall =
                normalizedInfo.language === 'vega' ? vegaToSvg : vegaLiteToSvg;
              svg = await vegaFunctionToCall(code, fileDirectoryPath);
              graphsCache[checksum] = svg; // store to new cache
            }
            $output = `<p data-processed ${stringifyBlockAttributes(
              normalizedInfo.attributes,
            )}>${svg}</p>`;
          }
          break;
        }
        case 'wsd': {
          const server =
            webSequenceDiagramsServer || 'https://www.websequencediagrams.com';
          const style =
            (normalizedInfo.attributes['style'] as string) || 'default';
          const apiKey = webSequenceDiagramsApiKey || undefined;
          const imgUrl = buildWsdImageUrl(code, server, style, apiKey);
          $output = `<div ${stringifyBlockAttributes(
            ensureClassInAttributes(normalizedInfo.attributes, 'wsd'),
          )}><img src="${escape(imgUrl)}" alt="Sequence Diagram"></div>`;
          break;
        }
        case 'd2': {
          // Per-block overrides are parsed by crossnote's block-info parser
          // from the fence info string (e.g. ```d2 layout=elk theme=200 sketch)
          // and stored as typed values in normalizedInfo.attributes.
          const renderOpts = {
            d2Path: d2Path || 'd2',
            d2Layout:
              (normalizedInfo.attributes['layout'] as string) ||
              d2Layout ||
              'dagre',
            d2Theme:
              (normalizedInfo.attributes['theme'] as number) ?? d2Theme ?? 0,
            d2Sketch:
              'sketch' in normalizedInfo.attributes
                ? normalizedInfo.attributes['sketch'] === true
                : (d2Sketch ?? false),
          };
          // Include resolved render options in the checksum so that changes to
          // global d2 settings (layout/theme/sketch) correctly bust the cache,
          // consistent with how per-fence attributes already do via normalizedInfo.
          const d2Checksum = computeChecksum(
            JSON.stringify(normalizedInfo) + code + JSON.stringify(renderOpts),
          );
          const d2DiagramInCache: string = graphsCache[d2Checksum];
          if (!d2DiagramInCache) {
            const result = await renderD2(code, renderOpts);
            if (result !== D2_NOT_FOUND) {
              graphsCache[d2Checksum] = result as string;
              $output = `<div class="d2-diagram">${result}</div>`;
            }
            // D2_NOT_FOUND: leave block as-is (d2 not installed)
          } else {
            $output = `<div class="d2-diagram">${d2DiagramInCache}</div>`;
          }
          break;
        }
        case 'tikz': {
          let svg = diagramInCache;
          if (!svg) {
            const attrs = normalizedInfo.attributes;
            const texPkgRaw = attrs['texPackages'] ?? attrs['tex_packages'];
            const tikzOpts = {
              texPackages:
                typeof texPkgRaw === 'string'
                  ? (JSON.parse(texPkgRaw) as Record<string, string>)
                  : undefined,
              tikzLibraries: (attrs['tikzLibraries'] ??
                attrs['tikz_libraries']) as string,
              addToPreamble: (attrs['addToPreamble'] ??
                attrs['add_to_preamble']) as string,
            };
            const result = await renderTikz(code, tikzOpts);
            if (result === TIKZ_NOT_AVAILABLE) {
              // Fall back to client-side rendering via tikzjax
              $output = `<div ${stringifyBlockAttributes(
                ensureClassInAttributes(
                  normalizedInfo.attributes,
                  normalizedInfo.language,
                ),
              )}><script type="text/tikz">${code}</script></div>`;
              break;
            }
            svg = result;
            graphsCache[checksum] = svg;
          }
          $output = `<div ${stringifyBlockAttributes(
            normalizedInfo.attributes,
          )}>${svg}</div>`;
          break;
        }
      }
    } catch (error) {
      $output = $(
        `<pre class="language-text"><code>${escape(
          String(error),
        )}</code></pre>`,
      );
    }
  }

  if ($output !== null) {
    if (normalizedInfo.attributes['output_first'] === true) {
      $container.before($output as string);
    } else {
      $container.after($output as string);
    }
  }

  if (
    normalizedInfo.attributes['hide'] !== false &&
    normalizedInfo.attributes['code_block'] !== true
  ) {
    $container.data('hiddenByEnhancer', true);
  }
}

const hiddenCode = (
  code: string,
  attributes: Record<string, unknown>,
  language: string,
) =>
  `<p ${stringifyBlockAttributes(
    ensureClassInAttributes(attributes, language),
  )}><span style="display: none">${code}</span></p>`;
