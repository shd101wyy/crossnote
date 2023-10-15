import { escape } from 'html-escaper';
import { run } from '../code-chunk/code-chunk';
import { CodeChunkData, CodeChunksData } from '../code-chunk/code-chunk-data';
import { BlockInfo } from '../lib/block-info';
import {
  MarkdownEngineOutput,
  MarkdownEngineRenderOption,
} from '../markdown-engine';
import { HeadingData, toc } from '../markdown-engine/toc';
import { extractCommandFromBlockInfo } from '../utility';

export default async function enhance(
  $: CheerioStatic,
  codeChunksData: CodeChunksData,
  renderOptions: MarkdownEngineRenderOption,
  runOptions: RunCodeChunkOptions,
): Promise<void> {
  const asyncFunctions: Promise<void>[] = [];
  const arrayOfCodeChunkData = [];
  $('[data-role="codeBlock"]').each((i, container) => {
    const $container = $(container);
    if ($container.data('executor')) {
      return;
    }

    const normalizedInfo: BlockInfo = $container.data('normalizedInfo');
    if (!normalizedInfo.attributes['cmd']) {
      return;
    }

    $container.data('executor', 'fenced-code-chunks');

    asyncFunctions.push(
      renderCodeBlock(
        $container,
        normalizedInfo,
        $,
        codeChunksData,
        arrayOfCodeChunkData,
        renderOptions,
        runOptions,
      ),
    );
  });
  await Promise.all(asyncFunctions);
}

export async function renderCodeBlock(
  $container: Cheerio,
  normalizedInfo: BlockInfo,
  $: CheerioStatic,
  codeChunksData: CodeChunksData,
  arrayOfCodeChunkData: CodeChunkData[],
  renderOptions: MarkdownEngineRenderOption,
  runOptions: RunCodeChunkOptions,
): Promise<void> {
  const code = $container.text();
  const id =
    normalizedInfo.attributes['id'] ||
    'code-chunk-id-' + arrayOfCodeChunkData.length;

  const cmd = extractCommandFromBlockInfo(normalizedInfo);
  const isJavascript = ['js', 'javascript'].indexOf(cmd) !== -1;

  const $codeAndOutputWrapper = $('<div class="code-chunk"></div>');
  $codeAndOutputWrapper.attr('data-id', id);
  $codeAndOutputWrapper.attr('data-cmd', cmd);
  if (isJavascript) {
    $codeAndOutputWrapper.attr('data-code', code);
  }
  $container.replaceWith($codeAndOutputWrapper);

  const $codeWrapper = $('<div class="input-div"/>');
  $codeWrapper.append($container);
  $codeAndOutputWrapper.append($codeWrapper);

  let codeChunkData: CodeChunkData = codeChunksData[id];
  const prev = arrayOfCodeChunkData.length
    ? arrayOfCodeChunkData[arrayOfCodeChunkData.length - 1].id
    : '';
  if (!codeChunkData) {
    codeChunkData = {
      id,
      code,
      normalizedInfo,
      result: '',
      plainResult: '',
      running: false,
      prev,
      next: null,
    };
    codeChunksData[id] = codeChunkData;
  } else {
    codeChunkData.code = code;
    codeChunkData.normalizedInfo = normalizedInfo;
    codeChunkData.prev = prev;
  }
  if (prev && codeChunksData[prev]) {
    codeChunksData[prev].next = id;
  }

  // this line has to be put above the `if` statement.
  arrayOfCodeChunkData.push(codeChunkData);

  if (
    renderOptions.triggeredBySave &&
    normalizedInfo.attributes['run_on_save']
  ) {
    await runCodeChunk(id, codeChunksData, runOptions);
  }

  let result = codeChunkData.result;

  // element attribute
  if (!result && codeChunkData.normalizedInfo.attributes['element']) {
    result = codeChunkData.normalizedInfo.attributes['element'];
    codeChunkData.result = result;
  }

  if (codeChunkData.running) {
    $codeAndOutputWrapper.addClass('running');
  }
  const statusDiv = `<div class="status">running...</div>`;
  const buttonGroup =
    '<div class="code-chunk-btn-group"><div class="run-btn btn btn-xs btn-primary"><span>▶︎</span></div><div class="run-all-btn btn btn-xs btn-primary">all</div></div>';
  let outputDiv = `<div class="output-div">${result}</div>`;

  // check javascript code chunk
  if (!renderOptions.isForPreview && isJavascript) {
    outputDiv += `<script>${code}</script>`;
    result = codeChunkData.normalizedInfo.attributes['element'] || '';
  }

  $codeWrapper.append(buttonGroup);
  $codeWrapper.append(statusDiv);

  normalizedInfo.attributes['output_first'] === true
    ? $codeAndOutputWrapper.prepend(outputDiv)
    : $codeAndOutputWrapper.append(outputDiv);
}

export interface RunCodeChunkOptions {
  enableScriptExecution: boolean;
  fileDirectoryPath: string;
  filePath: string;
  imageFolderPath: string;
  latexEngine?: string;
  modifySource: (
    codeChunkData: CodeChunkData,
    result: string,
    filePath: string,
  ) => Promise<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parseMD: (
    inputString: string,
    options: MarkdownEngineRenderOption,
  ) => Promise<MarkdownEngineOutput>;
  headings: HeadingData[];
}

export async function runCodeChunk(
  id: string,
  codeChunksData: CodeChunksData,
  runOptions: RunCodeChunkOptions,
): Promise<string> {
  const {
    headings,
    enableScriptExecution,
    filePath,
    fileDirectoryPath,
    latexEngine,
    modifySource,
    parseMD,
  } = runOptions;
  const codeChunkData = codeChunksData[id];
  if (!codeChunkData || codeChunkData.running) {
    return '';
  }

  const combinedCodeAsArray = [codeChunkData.code];
  let patentCodeChunkData = codeChunkData;
  while (patentCodeChunkData.normalizedInfo.attributes['continue']) {
    let parentId = patentCodeChunkData.normalizedInfo.attributes['continue'];
    if (parentId === true) {
      parentId = patentCodeChunkData.prev;
    }
    patentCodeChunkData = codeChunksData[parentId];
    if (!patentCodeChunkData) {
      break;
    }
    combinedCodeAsArray.unshift(patentCodeChunkData.code);
  }
  const code = combinedCodeAsArray.join('\n');
  const cmd = extractCommandFromBlockInfo(codeChunkData.normalizedInfo);

  codeChunkData.running = true;
  let result: string;
  let outputFormat = 'text';
  let blockModifiesSource =
    codeChunkData.normalizedInfo.attributes['modify_source'];
  try {
    const normalizedAttributes = codeChunkData.normalizedInfo.attributes;
    if (cmd === 'toc') {
      // toc code chunk. <= this is a special code chunk.
      const tocObject = toc(headings, {
        ordered: normalizedAttributes['ordered_list'],
        depthFrom: normalizedAttributes['depth_from'],
        depthTo: normalizedAttributes['depth_to'],
        tab: normalizedAttributes['tab'] || '  ',
        ignoreLink: normalizedAttributes['ignore_link'],
      });
      result = tocObject.content;
      outputFormat = 'markdown';
      blockModifiesSource = true;
    } else {
      // common code chunk
      // I put this line here because some code chunks like `toc` still need to be run.
      if (!enableScriptExecution) {
        return ''; // code chunk is disabled.
      }

      result = await run(
        code,
        fileDirectoryPath,
        cmd,
        codeChunkData.normalizedInfo.attributes,
        latexEngine,
      );
    }
    codeChunkData.plainResult = result;

    if (
      blockModifiesSource &&
      'code_chunk_offset' in codeChunkData.normalizedInfo.attributes
    ) {
      codeChunkData.result = '';
      return modifySource(codeChunkData, result, filePath);
    }

    // set output format for a few special cases
    if (cmd.match(/(la)?tex/) || cmd === 'pdflatex') {
      outputFormat = 'markdown';
    } else if (
      normalizedAttributes['matplotlib'] ||
      normalizedAttributes['mpl']
    ) {
      outputFormat = 'markdown';
    } else if (codeChunkData.normalizedInfo.attributes['output']) {
      outputFormat = codeChunkData.normalizedInfo.attributes['output'];
    }

    if (!result) {
      // do nothing
      result = '';
    } else if (outputFormat === 'html') {
      // result = result;
    } else if (outputFormat === 'png') {
      const base64 = new Buffer(result).toString('base64');
      result = `<img src="data:image/png;charset=utf-8;base64,${base64}">`;
    } else if (outputFormat === 'markdown') {
      const { html } = await parseMD(result, {
        useRelativeFilePath: true,
        isForPreview: false,
        hideFrontMatter: true,
      });
      result = html;
    } else if (outputFormat === 'none') {
      result = '';
    } else {
      // text
      result = `<pre class="language-text"><code>${escape(
        result,
      )}</code></pre>`;
    }
  } catch (error) {
    result = `<pre class="language-text"><code>${escape(
      error.toString(),
    )}</code></pre>`;
  }

  codeChunkData.result = result; // save result.
  codeChunkData.running = false;
  return result;
}

export async function runCodeChunks(
  codeChunksData: CodeChunksData,
  runOptions: RunCodeChunkOptions,
) {
  const asyncFunctions: Promise<string>[] = [];
  for (const id in codeChunksData) {
    // eslint-disable-next-line no-prototype-builtins
    if (codeChunksData.hasOwnProperty(id)) {
      asyncFunctions.push(runCodeChunk(id, codeChunksData, runOptions));
    }
  }
  return Promise.all(asyncFunctions);
}
