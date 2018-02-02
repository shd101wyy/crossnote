import { relative, resolve } from "path";
import * as CodeChunkAPI from "../code-chunk"
import { CodeChunkData } from "../code-chunk-data";
import * as ditaaAPI from "../ditaa"
import { normalizeCodeBlockInfo, parseBlockInfo } from "../lib/block-info";
import parseMath from "../parse-math";
import { toc } from "../toc"
import { extensionDirectoryPath, mkdirp, removeFileProtocol, unescapeString } from "../utility";
import * as vegaAPI from "../vega";
import * as vegaLiteAPI from "../vega-lite";

// tslint:disable-next-line no-var-requires
const md5 = require(resolve(
  extensionDirectoryPath,
  "./dependencies/javascript-md5/md5.js"
));

export interface CodeChunksData {
  [key: string]: CodeChunkData;
}
/**
 * This function resovle image paths and render code blocks
 * @param html the html string that we will analyze
 * @return html
 */
export default async function enhance(
  $,
  options /*: MarkdownEngineRenderOption */,
  fileDirectoryPath
): Promise<void> {
  // new caches
  // which will be set when this.renderCodeBlocks is called
  const newGraphsCache: { [key: string]: string } = {};
  const codeChunksArray: CodeChunkData[] = [];

  const asyncFunctions = [];
  $('[data-role="codeBlock"]').each((i, container) => {
    const $container = $(container);

    // skip code block execution if it's already been executied by another executor
    if ($container.data("executor")) {
      return;
    }

    const infoAsString = $container.data("info");
    const code = $container
      .children()
      .first()
      .text();

    // let codeBlock;
    // let lang;
    // let code;
    // const $container = $(preElement);
    // if (preElement.children[0] && preElement.children[0].name === "code") {
    //   codeBlock = $container.children().first();
    //   lang = "text";
    //
    //   let classes;
    //   if (this.config.usePandocParser) {
    //     const dataLang = unescapeString(
    //       $container.attr("data-lang") || ""
    //     );
    //     if (
    //       !dataLang &&
    //       codeBlock.text().startsWith("```{.mpe-code data-lang")
    //     ) {
    //       // Fix indentation issue in pandoc code block
    //       classes = "language-text";
    //       code = codeBlock.text();
    //       codeBlock.text(
    //         code.replace(
    //           /^```{\.mpe\-code\s*data\-lang=\"(.+?)\"}/,
    //           ($0, $1) => `\`\`\`${unescapeString($1)}`
    //         )
    //       );
    //     } else {
    //       classes = "language-" + dataLang;
    //     }
    //   } else {
    //     classes = codeBlock.attr("class");
    //   }
    //
    //   if (!classes) {
    //     classes = "language-text";
    //   }
    //   lang = classes.replace(/^language-/, "");
    //   if (!lang) {
    //     lang = "text";
    //   }
    //   code = codeBlock.text();
    //   $container.attr("class", classes);
    //   $container
    //     .children()
    //     .first()
    //     .addClass(classes);
    // } else {
    //   lang = "text";
    //   code = preElement.children[0] ? preElement.children[0].data : "";
    //   $container.attr("class", "language-text");
    // }

    asyncFunctions.push(
      renderCodeBlock($, $container, code, infoAsString, fileDirectoryPath, {
        codeChunksArray,
        graphsCache: newGraphsCache,
        isForPreview: options.isForPreview,
        triggeredBySave: options.triggeredBySave
      })
    );
  });

  await Promise.all(asyncFunctions);

  // reset caches
  // the line below actually has problem.
  // if (options.isForPreview) {
  //   graphsCache = newGraphsCache;
  //   // console.log(graphsCache)
  // }
  return $;
}

/**
 *
 * @param preElement the cheerio element
 * @param info is in the format of `lang {opt1:val1, opt2:val2}` or just `lang`
 * @param text
 */
export async function renderCodeBlock(
  $: CheerioStatic,
  $container: Cheerio,
  code: string,
  infoAsString: string,
  fileDirectoryPath,
  {
    graphsCache,
    codeChunksArray,
    isForPreview,
    triggeredBySave
  }: {
    graphsCache: object;
    codeChunksArray: CodeChunkData[];
    isForPreview: boolean;
    triggeredBySave: boolean;
  }
): Promise<void> {
  const info = normalizeCodeBlockInfo(parseBlockInfo(infoAsString));

  if (!info.literate) {
    return;
  }
  // let match, lang, optionsStr: string;
  // let options: object;
  // if ((match = info.match(/\s*([^\s]+)\s+\{(.+?)\}/))) {
  //   lang = match[1];
  //   optionsStr = match[2];
  // } else {
  //   lang = info;
  //   optionsStr = "";
  // }

  //
  // if (optionsStr) {
  //   try {
  //     options = utility.parseAttributes(optionsStr);
  //   } catch (e) {
  //     return $container.replaceWith(
  //       `<pre class="language-text">OptionsError: ${"{" +
  //         optionsStr +
  //         "}"}<br>${e.toString()}</pre>`
  //     );
  //   }
  // } else {
  //   options = {};
  // }

  let $output = null;

  $output = `<p><b>${
    info.lang
  }</b> is not supported or is temporary disabled</p>`;
  switch (info.lang) {
    case "puml":
    case "plantuml":
      break;

    case "math":
      try {
        const mathHtml = parseMath({
          closeTag: "",
          content: code,
          displayMode: true,
          openTag: "",
          renderingOption: "KaTeX"
        });
        $output = `<p ${
          ""
          // optionsStr ? utility.stringifyAttributes(options, false) : ""
        }>${mathHtml}</p>`;
      } catch (error) {
        $output = `<pre class="language-text">${error.toString()}</pre>`;
      }
      break;

    case "vega": {
      const checksum = md5(infoAsString + code);
      let svg: string = graphsCache[checksum];
      if (!svg) {
        try {
          svg = await vegaAPI.toSVG(code, fileDirectoryPath);

          $output = `<p ${
            ""
            // optionsStr ? utility.stringifyAttributes(options, false) : ""
          }>${svg}</p>`;
          graphsCache[checksum] = svg; // store to new cache
        } catch (error) {
          $output = `<pre class="language-text">${error.toString()}</pre>`;
        }
      } else {
        $output = `<p ${
          ""
          // optionsStr ? utility.stringifyAttributes(options, false) : ""
        }>${svg}</p>`;
        graphsCache[checksum] = svg; // store to new cache
      }
      break;
    }
    case "vega-lite": {
      // vega-lite
      const checksum = md5(infoAsString + code);
      let svg: string = graphsCache[checksum];
      if (!svg) {
        try {
          svg = await vegaLiteAPI.toSVG(code, fileDirectoryPath);

          $output = `<p ${
            ""
            // optionsStr ? utility.stringifyAttributes(options, false) : ""
          }>${svg}</p>`;
          graphsCache[checksum] = svg; // store to new cache
        } catch (error) {
          $output = `<pre class="language-text">${error.toString()}</pre>`;
        }
      } else {
        $output = `<p ${
          ""
          // optionsStr ? utility.stringifyAttributes(options, false) : ""
        }>${svg}</p>`;
        graphsCache[checksum] = svg; // store to new cache
      }
    }
  }

  if (info.outputFirst) {
    $container.before($output);
  } else {
    $container.after($output);
  }

  // } else if (lang.match(/^(puml|plantuml)$/)) {
  //   // PlantUML
  //   const checksum = md5(infoAsString + code);
  //   let svg: string = graphsCache[checksum];
  //   if (!svg) {
  //     svg = await plantumlAPI.render(code, this.fileDirectoryPath);
  //   }
  //   $container.replaceWith(
  //     `<p ${
  //       optionsStr ? utility.stringifyAttributes(options, false) : ""
  //     }>${svg}</p>`
  //   );
  //   graphsCache[checksum] = svg; // store to new cache
  // } else if (lang.match(/^mermaid$/)) {
  //   // mermaid
  //   /*
  //     // it doesn't work well...
  //     // the cache doesn't work well.
  //     const checksum = md5(infoAsString + code)
  //     let svg:string = graphsCache[checksum]
  //     if (!svg) {
  //       $container.replaceWith(`<div class="mermaid">${code}</div>`)
  //     } else {
  //       $container.replaceWith(svg)
  //       graphsCache[checksum] = svg // store to new cache
  //     }
  //     */
  //   if (options["class"]) {
  //     options["class"] = "mermaid " + options["class"];
  //   } else {
  //     options["class"] = "mermaid";
  //   }
  //   $container.replaceWith(
  //     `<div ${utility.stringifyAttributes(options, false)}>${code}</div>`
  //   );
  // } else if (lang === "wavedrom") {
  //   if (options["class"]) {
  //     options["class"] = "wavedrom " + options["class"];
  //   } else {
  //     options["class"] = "wavedrom";
  //   }
  //   $container.replaceWith(
  //     `<div ${utility.stringifyAttributes(
  //       options,
  //       false
  //     )}><script type="WaveDrom">${code}</script></div>`
  //   );
  // } else if (lang === "flow") {
  //   if (options["class"]) {
  //     options["class"] = "flow " + options["class"];
  //   } else {
  //     options["class"] = "flow";
  //   }
  //   $container.replaceWith(
  //     `<div ${utility.stringifyAttributes(options, false)}>${code}</div>`
  //   );
  // } else if (lang === "sequence") {
  //   if (options["class"]) {
  //     options["class"] = "sequence " + options["class"];
  //   } else {
  //     options["class"] = "sequence";
  //   }
  //   $container.replaceWith(
  //     `<div ${utility.stringifyAttributes(options, false)}>${code}</div>`
  //   );
  // } else if (lang.match(/^(dot|viz)$/)) {
  //   // GraphViz
  //   const checksum = md5(infoAsString + code);
  //   let svg = graphsCache[checksum];
  //   if (!svg) {
  //     try {
  //       let engine = options["engine"] || "dot";
  //       svg = Viz(code, { engine });
  //
  //       $container.replaceWith(
  //         `<p ${
  //           optionsStr ? utility.stringifyAttributes(options, false) : ""
  //         }>${svg}</p>`
  //       );
  //       graphsCache[checksum] = svg; // store to new cache
  //     } catch (e) {
  //       $container.replaceWith(
  //         `<pre class="language-text">${e.toString()}</pre>`
  //       );
  //     }
  //   } else {
  //     $container.replaceWith(
  //       `<p ${
  //         optionsStr ? utility.stringifyAttributes(options, false) : ""
  //       }>${svg}</p>`
  //     );
  //     graphsCache[checksum] = svg; // store to new cache
  //   }
  // } else if (lang.match(/^math$/)) {
  //   try {
  //     const mathHtml = parseMath({
  //       closeTag: "",
  //       content: code,
  //       displayMode: true,
  //       openTag: "",
  //       renderingOption: this.config.mathRenderingOption
  //     });
  //     $container.replaceWith(
  //       `<p ${
  //         optionsStr ? utility.stringifyAttributes(options, false) : ""
  //       }>${mathHtml}</p>`
  //     );
  //   } catch (error) {
  //     $container.replaceWith(
  //       `<pre class="language-text">${error.toString()}</pre>`
  //     );
  //   }
  // } else if (lang.match(/^vega$/)) {
  //   // vega
  //   const checksum = md5(infoAsString + code);
  //   let svg: string = graphsCache[checksum];
  //   if (!svg) {
  //     try {
  //       svg = await vegaAPI.toSVG(code, this.fileDirectoryPath);
  //
  //       $container.replaceWith(
  //         `<p ${
  //           optionsStr ? utility.stringifyAttributes(options, false) : ""
  //         }>${svg}</p>`
  //       );
  //       graphsCache[checksum] = svg; // store to new cache
  //     } catch (error) {
  //       $container.replaceWith(
  //         `<pre class="language-text">${error.toString()}</pre>`
  //       );
  //     }
  //   } else {
  //     $container.replaceWith(
  //       `<p ${
  //         optionsStr ? utility.stringifyAttributes(options, false) : ""
  //       }>${svg}</p>`
  //     );
  //     graphsCache[checksum] = svg; // store to new cache
  //   }
  // } else if (lang === "vega-lite") {
  //   // vega-lite
  //   const checksum = md5(infoAsString + code);
  //   let svg: string = graphsCache[checksum];
  //   if (!svg) {
  //     try {
  //       svg = await vegaLiteAPI.toSVG(code, this.fileDirectoryPath);
  //
  //       $container.replaceWith(
  //         `<p ${
  //           optionsStr ? utility.stringifyAttributes(options, false) : ""
  //         }>${svg}</p>`
  //       );
  //       graphsCache[checksum] = svg; // store to new cache
  //     } catch (error) {
  //       $container.replaceWith(
  //         `<pre class="language-text">${error.toString()}</pre>`
  //       );
  //     }
  //   } else {
  //     $container.replaceWith(
  //       `<p ${
  //         optionsStr ? utility.stringifyAttributes(options, false) : ""
  //       }>${svg}</p>`
  //     );
  //     graphsCache[checksum] = svg; // store to new cache
  //   }
  // } else if (options["cmd"]) {
  //   const $el = $('<div class="code-chunk"></div>'); // create code chunk
  //   if (!options["id"]) {
  //     options["id"] = "code-chunk-id-" + codeChunksArray.length;
  //   }
  //
  //   if (options["cmd"] === true) {
  //     options["cmd"] = lang;
  //   }
  //
  //   $el.attr({
  //     "data-id": options["id"],
  //     "data-cmd": options["cmd"],
  //     "data-code": options["cmd"] === "javascript" ? code : ""
  //   });
  //
  //   let highlightedBlock = "";
  //   if (!options["hide"]) {
  //     try {
  //       if (!Prism) {
  //         Prism = require(path.resolve(
  //           extensionDirectoryPath,
  //           "./dependencies/prism/prism.js"
  //         ));
  //       }
  //       highlightedBlock = `<pre class="language-${lang} ${options["class"] ||
  //         ""}">${Prism.highlight(
  //         code,
  //         Prism.languages[scopeForLanguageName(lang)]
  //       )}</pre>`;
  //     } catch (e) {
  //       // do nothing
  //       highlightedBlock = `<pre class="language-text ${options["class"] ||
  //         ""}">${code}</pre>`;
  //     }
  //
  //     const $highlightedBlock = $(highlightedBlock);
  //     this.addLineNumbersIfNecessary($highlightedBlock, code);
  //     highlightedBlock = $.html($highlightedBlock);
  //   }
  //
  //   /*
  //     if (!options['id']) { // id is required for code chunk
  //       highlightedBlock = `<pre class="language-text">'id' is required for code chunk</pre>`
  //     }*/
  //
  //   let codeChunkData: CodeChunkData = this.codeChunksData[options["id"]];
  //   let previousCodeChunkDataId = codeChunksArray.length
  //     ? codeChunksArray[codeChunksArray.length - 1].id
  //     : "";
  //   if (!codeChunkData) {
  //     codeChunkData = {
  //       id: options["id"],
  //       code,
  //       options: options,
  //       result: "",
  //       plainResult: "",
  //       running: false,
  //       prev: previousCodeChunkDataId,
  //       next: null
  //     };
  //     this.codeChunksData[options["id"]] = codeChunkData;
  //   } else {
  //     codeChunkData.code = code;
  //     codeChunkData.options = options;
  //     codeChunkData.prev = previousCodeChunkDataId;
  //   }
  //   if (previousCodeChunkDataId && this.codeChunksData[previousCodeChunkDataId])
  //     this.codeChunksData[previousCodeChunkDataId].next = options["id"];
  //
  //   codeChunksArray.push(codeChunkData); // this line has to be put above the `if` statement.
  //
  //   if (triggeredBySave && options["run_on_save"]) {
  //     await this.runCodeChunk(options["id"]);
  //   }
  //
  //   let result = codeChunkData.result;
  //   // element option
  //   if (!result && codeChunkData.options["element"]) {
  //     result = codeChunkData.options["element"];
  //     codeChunkData.result = result;
  //   }
  //
  //   if (codeChunkData.running) {
  //     $el.addClass("running");
  //   }
  //   const statusDiv = `<div class="status">running...</div>`;
  //   const buttonGroup =
  //     '<div class="btn-group"><div class="run-btn btn"><span>▶︎</span></div><div class="run-all-btn btn">all</div></div>';
  //   let outputDiv = `<div class="output-div">${result}</div>`;
  //
  //   // check javascript code chunk
  //   if (!isForPreview && options["cmd"] === "javascript") {
  //     outputDiv += `<script>${code}</script>`;
  //     result = codeChunkData.options["element"] || "";
  //   }
  //
  //   $el.append(highlightedBlock);
  //   $el.append(buttonGroup);
  //   $el.append(statusDiv);
  //   $el.append(outputDiv);
  //   $container.replaceWith($el);
  // } else {
  //   // normal code block  // TODO: code chunk
  //   renderPlainCodeBlock();
  // }
}

export interface RunCodeChunkOptions {
  enableScriptExecution: boolean,
  fileDirectoryPath: string,
  filePath: string,
  imageFolderPath: string,
  latexEngine: any,
  modifySource: any,
  parseMD: any,
  headings: any,
  resolveFilePath: any,
}

/**
 * Run code chunk of `id`
 * @param id
 */
export async function runCodeChunk(id: string, codeChunksData: CodeChunksData, runOptions: RunCodeChunkOptions): Promise<string> {
  const {
    headings,
    enableScriptExecution,
    filePath,
    fileDirectoryPath,
    imageFolderPath,
    latexEngine,
    modifySource,
    parseMD,
    resolveFilePath,
  } = runOptions;
  const codeChunkData = codeChunksData[id];
  if (!codeChunkData || codeChunkData.running) {
    return "";
  }

  let code = codeChunkData.code;
  let cc = codeChunkData;
  while (cc.options["continue"]) {
    let parentId = cc.options["continue"];
    if (parentId === true) {
      parentId = cc.prev;
    }
    cc = codeChunksData[parentId];
    if (!cc) {
      break;
    }
    code = cc.code + code;
  }

  codeChunkData.running = true;
  let result;
  try {
    const options = codeChunkData.options;
    if (options["cmd"] === "toc") {
      // toc code chunk. <= this is a special code chunk.
      const tocObject = toc(headings, {
        ordered: options["orderedList"],
        depthFrom: options["depthFrom"],
        depthTo: options["depthTo"],
        tab: options["tab"] || "\t",
        ignoreLink: options["ignoreLink"]
      });
      result = tocObject.content;
    } else if (options["cmd"] === "ditaa") {
      // ditaa diagram
      const filename =
        options["filename"] || `${md5(filePath + options["id"])}.png`;
      const imageFolder = removeFileProtocol(
        resolveFilePath(imageFolderPath, false)
      );
      await mkdirp(imageFolder);

      codeChunkData.options["output"] = "markdown";
      const dest = await ditaaAPI.render(
        code,
        options["args"] || [],
        resolve(imageFolder, filename)
      );
      result = `  \n![](${relative(fileDirectoryPath, dest)
        .replace(/\\/g, "/")})  \n`; // <= fix windows path issue.
    } else {
      // common code chunk
      // I put this line here because some code chunks like `toc` still need to be run.
      if (!enableScriptExecution) {
        return ""; // code chunk is disabled.
      }

      result = await CodeChunkAPI.run(
        code,
        fileDirectoryPath,
        codeChunkData.options,
        latexEngine
      );
    }
    codeChunkData.plainResult = result;

    if (
      codeChunkData.options["modify_source"] &&
      "code_chunk_offset" in codeChunkData.options
    ) {
      codeChunkData.result = "";
      return modifySource(codeChunkData, result, this.filePath);
    }

    const outputFormat = codeChunkData.options["output"] || "text";
    if (!result) {
      // do nothing
      result = "";
    } else if (outputFormat === "html") {
      result = result;
    } else if (outputFormat === "png") {
      const base64 = new Buffer(result).toString("base64");
      result = `<img src="data:image/png;charset=utf-8;base64,${base64}">`;
    } else if (outputFormat === "markdown") {
      const { html } = await parseMD(result, {
        useRelativeFilePath: true,
        isForPreview: false,
        hideFrontMatter: true
      });
      result = html;
    } else if (outputFormat === "none") {
      result = "";
    } else {
      result = `<pre class="language-text">${result}</pre>`;
    }
  } catch (error) {
    result = `<pre class="language-text">${error}</pre>`;
  }

  codeChunkData.result = result; // save result.
  codeChunkData.running = false;
  return result;
}

export async function runAllCodeChunks(codeChunksData: CodeChunksData, runOptions: RunCodeChunkOptions) {
  const asyncFunctions = [];
  for (const id in codeChunksData) {
    if (codeChunksData.hasOwnProperty(id)) {
      asyncFunctions.push(runCodeChunk(id, codeChunksData, runOptions));
    }
  }
  return Promise.all(asyncFunctions);
}
