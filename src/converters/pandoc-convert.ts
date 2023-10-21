import { execFile } from 'child_process';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import * as YAML from 'yaml';
import { CodeChunkData } from '../code-chunk/code-chunk-data';
import computeChecksum from '../lib/compute-checksum';
import { toc } from '../markdown-engine/toc';
import { transformMarkdown } from '../markdown-engine/transformer';
import { Notebook } from '../notebook';
import * as utility from '../utility';
import { processGraphs } from './process-graphs';

function getFileExtension(documentType: string) {
  if (
    documentType === 'pdf_document' ||
    documentType === 'beamer_presentation'
  ) {
    return 'pdf';
  } else if (documentType === 'word_document') {
    return 'docx';
  } else if (documentType === 'rtf_document') {
    return 'rtf';
  } else if (documentType === 'custom_document') {
    return '*';
  } else {
    return null;
  }
}

/**
 * eg: process config inside pdf_document block
 */

function processOutputConfig(
  config: object,
  args: string[],
  latexEngine: string = 'pdflatex',
) {
  if (config['toc']) {
    args.push('--toc');
  }

  if (config['toc_depth']) {
    args.push('--toc-depth=' + config['toc_depth']);
  }

  if (config['highlight']) {
    if (config['highlight'] === 'default') {
      config['highlight'] = 'pygments';
    }
    args.push('--highlight-style=' + config['highlight']);
  }

  if (config['reference_docx']) {
    // issue #448
    args.push('--reference-docx=' + config['reference_docx']);
  }
  if (config['reference_doc']) {
    args.push('--reference-doc=' + config['reference_doc']);
  }

  if (config['highlight'] === null) {
    args.push('--no-highlight');
  }

  if (config['citation_package']) {
    if (config['citation_package'] === 'natbib') {
      args.push('--natbib');
    } else if (config['citation_package'] === 'biblatex') {
      args.push('--biblatex');
    }
  }

  if (config['number_sections']) {
    args.push('--number-sections');
  }

  if (config['incremental']) {
    args.push('--incremental');
  }

  if (config['slide_level']) {
    args.push('--slide-level=' + config['slide_level']);
  }

  if (config['theme']) {
    args.push('-V', 'theme:' + config['theme']);
  }

  if (config['colortheme']) {
    args.push('-V', 'colortheme:' + config['colortheme']);
  }

  if (config['fonttheme']) {
    args.push('-V', 'fonttheme:' + config['fonttheme']);
  }

  if (config['latex_engine']) {
    args.push('--pdf-engine=' + config['latex_engine']);
  } else if (config['pdf_engine']) {
    args.push('--pdf-engine=' + config['pdf_engine']);
  } else {
    args.push('--pdf-engine=' + latexEngine);
  }

  if (config['includes'] && typeof config['includes'] === 'object') {
    const includesConfig = config['includes'];
    const helper = (prefix, data) => {
      if (typeof data === 'string') {
        args.push(prefix + data);
      } else if (data.constructor === Array) {
        data.forEach((d) => args.push(prefix + d));
      } else {
        args.push(prefix + data);
      }
    };

    // TODO: includesConfig['in_header'] is array
    if (includesConfig['in_header']) {
      helper('--include-in-header=', includesConfig['in_header']);
    }
    if (includesConfig['before_body']) {
      helper('--include-before-body=', includesConfig['before_body']);
    }
    if (includesConfig['after_body']) {
      helper('--include-after-body=', includesConfig['after_body']);
    }
  }

  if (config['template']) {
    args.push('--template=' + config['template']);
  }

  // All other arguments give here can override the
  // defaults from above
  if (config['pandoc_args']) {
    config['pandoc_args'].forEach((arg) => args.push(arg));
  }
}

function loadOutputYAML(fileDirectoryPath, config) {
  const yamlPath = path.resolve(fileDirectoryPath, '_output.yaml');
  let yaml: string = '';
  try {
    yaml = fs.readFileSync(yamlPath, { encoding: 'utf-8' });
  } catch (error) {
    return Object.assign({}, config);
  }

  let data = {};
  if (yaml) {
    data = utility.parseYAML(yaml);
  }

  if (config['output']) {
    if (typeof config['output'] === 'string' && data[config['output']]) {
      const format = config['output'];
      config['output'] = {};
      config['output'][format] = data[format];
    } else {
      const format = Object.keys(config['output'])[0];
      if (data[format]) {
        config['output'][format] = Object.assign(
          {},
          data[format],
          config['output'][format],
        );
      }
    }
  }
  return Object.assign({}, data, config);
}

/*
function processConfigPaths(config, fileDirectoryPath, projectDirectoryPath)->
  # same as the one in processPaths function
  # TODO: refactor in the future
  resolvePath = (src)->
    if src.startsWith('/')
      return path.relative(fileDirectoryPath, path.resolve(projectDirectoryPath, '.'+src))
    else # ./test.png or test.png
      return src

  helper = (data)->
    if typeof(data) == 'string'
      return resolvePath(data)
    else if data.constructor == Array
      return data.map (d)->resolvePath(d)
    else
      data

  if config['bibliography']
    config['bibliography'] = helper(config['bibliography'])

  if config['csl']
    config['csl'] = helper(config['csl'])

  if config['output'] and typeof(config['output']) == 'object'
    documentFormat = Object.keys(config['output'])[0]
    outputConfig = config['output'][documentFormat]
    if outputConfig['includes']
      if outputConfig['includes']['in_header']
        outputConfig['includes']['in_header'] = helper(outputConfig['includes']['in_header'])
      if outputConfig['includes']['before_body']
        outputConfig['includes']['before_body'] = helper(outputConfig['includes']['before_body'])
      if outputConfig['includes']['after_body']
        outputConfig['includes']['after_body'] = helper(outputConfig['includes']['after_body'])

    if outputConfig['reference_docx']
      outputConfig['reference_docx'] = helper(outputConfig['reference_docx'])

    if outputConfig['template']
      outputConfig['template'] = helper(outputConfig['template'])
*/

function processPaths(text, fileDirectoryPath, projectDirectoryPath) {
  function resolvePath(src) {
    if (src.startsWith('/')) {
      return path.relative(
        fileDirectoryPath,
        path.resolve(projectDirectoryPath, '.' + src),
      ); // ./test.png or test.png
    } else {
      return src;
    }
  }

  let inBlock = false;
  let lines = text.split('\n');
  lines = lines.map((line) => {
    if (line.match(/^\s*```/)) {
      inBlock = !inBlock;
      return line;
    } else if (inBlock) {
      return line;
    } else {
      // replace path in ![](...) and []()
      let r = /(!?\[.*?]\()([^)|^'|^"]*)(.*?\))/gi;
      line = line.replace(r, (whole, a, b, c) => {
        if (b[0] === '<') {
          b = b.slice(1, b.length - 1);
          return a + '<' + resolvePath(b.trim()) + '> ' + c;
        } else {
          return a + resolvePath(b.trim()) + ' ' + c;
        }
      });

      // replace path in tag
      r = /(<[img|a|iframe].*?[src|href]=['"])(.+?)(['"].*?>)/gi;
      line = line.replace(r, (whole, a, b, c) => {
        return a + resolvePath(b) + c;
      });
      return line;
    }
  });

  return lines.join('\n');
}

/*
@param {String} text: markdown string
@param {Object} all properties are required!
  @param {String} fileDirectoryPath
  @param {String} projectDirectoryPath
  @param {String} sourceFilePath
callback(err, outputFilePath)
*/
/**
 * @return outputFilePath
 */
export async function pandocConvert(
  text,
  {
    fileDirectoryPath,
    projectDirectoryPath,
    sourceFilePath,
    filesCache,
    protocolsWhiteListRegExp,
    /*deleteImages=true,*/
    codeChunksData,
    graphsCache,
    notebook,
  }: {
    fileDirectoryPath: string;
    projectDirectoryPath: string;
    sourceFilePath: string;
    filesCache: { [key: string]: string };
    protocolsWhiteListRegExp: RegExp;
    codeChunksData: { [key: string]: CodeChunkData };
    graphsCache: { [key: string]: string };
    notebook: Notebook;
  },
  config = {},
): Promise<string> {
  config = loadOutputYAML(fileDirectoryPath, config);
  // TODO =>
  const args = [
    '-f',
    notebook.config.pandocMarkdownFlavor.replace(/-raw_tex/, ''),
  ];

  let extension: string | null = null;
  let outputConfig = null;
  let documentFormat: string | null = null;
  if (config['output']) {
    if (typeof config['output'] === 'string') {
      documentFormat = config['output'];
      extension = getFileExtension(documentFormat);
    } else {
      documentFormat = Object.keys(config['output'])[0];
      extension = getFileExtension(documentFormat);
      outputConfig = config['output'][documentFormat];
    }
  } else {
    throw new Error('Output format needs to be specified.');
  }

  if (extension === null) {
    throw new Error('Invalid document type.');
  }

  // custom_document requires path to be defined
  if (
    documentFormat === 'custom_document' &&
    (!outputConfig || !outputConfig['path'])
  ) {
    throw new Error('custom_document requires path to be defined.');
  }

  if (documentFormat === 'beamer_presentation') {
    args.push('-t', 'beamer');
  }

  // dest
  let outputFilePath;
  if (outputConfig && outputConfig['path']) {
    outputFilePath = outputConfig['path'];
    if (outputFilePath.startsWith('/')) {
      outputFilePath = path.resolve(projectDirectoryPath, '.' + outputFilePath);
    } else {
      outputFilePath = path.resolve(fileDirectoryPath, outputFilePath);
    }

    if (
      documentFormat !== 'custom_document' &&
      path.extname(outputFilePath) !== '.' + extension
    ) {
      throw new Error(
        'Invalid extension for ' +
          documentFormat +
          '. Extension .' +
          extension +
          ' is required, but ' +
          path.extname(outputFilePath) +
          ' was provided.',
      );
    }

    args.push('-o', outputFilePath);
  } else {
    outputFilePath = sourceFilePath;
    outputFilePath =
      outputFilePath.slice(
        0,
        outputFilePath.length - path.extname(outputFilePath).length,
      ) +
      '.' +
      extension;
    args.push('-o', outputFilePath);
  }

  // NOTE: 0.12.4 No need to resolve paths.
  // #409: https://github.com/shd101wyy/markdown-preview-enhanced/issues/409
  // resolve paths in front-matter(yaml)
  // processConfigPaths config, fileDirectoryPath, projectDirectoryPath

  // process output config
  processOutputConfig(outputConfig || {}, args, notebook.config.latexEngine);

  if (notebook.config.parserConfig.onWillParseMarkdown) {
    text = await notebook.config.parserConfig.onWillParseMarkdown(text);
  }

  // import external files
  const data = await transformMarkdown(text, {
    fileDirectoryPath,
    projectDirectoryPath,
    useRelativeFilePath: true,
    filesCache,
    protocolsWhiteListRegExp,
    forPreview: false,
    usePandocParser: true,
    notebook,
  });
  text = data.outputString;

  // add front-matter(yaml) back to text
  text = '---\n' + YAML.stringify(config) + '---\n' + text;

  // replace [CROSSNOTETOC]
  const tocBracketEnabled = data.tocBracketEnabled;
  if (tocBracketEnabled) {
    // [TOC]
    const headings = data.headings;
    const { content: tocMarkdown } = toc(headings, {
      ordered: false,
      depthFrom: 1,
      depthTo: 6,
      tab: '  ',
    });
    text = text.replace(
      /^\s*(?:<p[^>]*>)?<span>\[CROSSNOTETOC\]<\/span>(?:<\/p>)?\s*/gm,
      '\n\n' + tocMarkdown + '\n\n',
    );
  }

  // change link path to relative path
  text = processPaths(text, fileDirectoryPath, projectDirectoryPath);

  // citation
  const noDefaultsOrCiteProc =
    args.find((el) => {
      return el.includes('pandoc-citeproc') || el.includes('--defaults');
    }) === undefined;

  if (
    noDefaultsOrCiteProc &&
    (config['bibliography'] || config['references'])
  ) {
    args.push('--citeproc');
  }

  let imageDirectoryPath = notebook.config.imageFolderPath;
  if (imageDirectoryPath[0] === '/') {
    imageDirectoryPath = path.resolve(
      projectDirectoryPath,
      '.' + imageDirectoryPath,
    );
  } else {
    imageDirectoryPath = path.resolve(fileDirectoryPath, imageDirectoryPath);
  }
  await mkdirp.sync(imageDirectoryPath); // create imageDirectoryPath

  const { outputString } = await processGraphs(text, {
    fileDirectoryPath,
    projectDirectoryPath,
    imageDirectoryPath,
    imageFilePrefix: computeChecksum(outputFilePath),
    useRelativeFilePath: true,
    codeChunksData,
    graphsCache,
    addOptionsStr: true,
    notebook,
  });

  // pandoc will cause error if directory doesn't exist,
  // therefore I will create directory first.
  await mkdirp.sync(path.dirname(outputFilePath));

  return await new Promise<string>((resolve, reject) => {
    const program = execFile(
      notebook.config.pandocPath,
      args,
      { cwd: fileDirectoryPath },
      (error) => {
        /*if (deleteImages) {
        imagePaths.forEach((p)=> fs.unlink(p, (error)=>{}))
      }*/

        if (error) {
          return reject(error.toString());
        } else {
          return resolve(outputFilePath);
        }
      },
    );

    // add front matter back to doc.
    program.stdin?.end(outputString);
  });
}
