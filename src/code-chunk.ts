import { spawn } from 'child_process';
import { unlink } from 'fs-extra';
import * as path from 'path';
import * as vm from 'vm';

import * as LaTeX from './latex';
import { BlockAttributes } from './lib/block-attributes';
import * as utility from './utility';

export async function compileLaTeX(
  content: string,
  fileDirectoryPath: string,
  normalizedAttributes: BlockAttributes,
): Promise<string> {
  const latexEngine = normalizedAttributes['latex_engine'] || 'pdflatex';
  const latexSVGDir = normalizedAttributes['latex_svg_dir']; // if not provided, the svg files will be stored in temp folder and will be deleted automatically
  const latexZoom = normalizedAttributes['latex_zoom'];
  const latexWidth = normalizedAttributes['latex_width'];
  const latexHeight = normalizedAttributes['latex_height'];

  const texFilePath = path.resolve(
    fileDirectoryPath,
    Math.random()
      .toString(36)
      .substr(2, 9) + '_code_chunk.tex',
  );

  await utility.writeFile(texFilePath, content);

  try {
    const svgMarkdown = await LaTeX.toSVGMarkdown(texFilePath, {
      latexEngine,
      markdownDirectoryPath: fileDirectoryPath,
      svgDirectoryPath: latexSVGDir,
      svgZoom: latexZoom,
      svgWidth: latexWidth,
      svgHeight: latexHeight,
    });
    await unlink(texFilePath);
    return svgMarkdown;
  } catch (e) {
    await unlink(texFilePath);
    throw e;
  }
}

/**
 *
 * @param code should be a javascript function string
 * @param options
 */
async function runInVm(
  code: string,
  normalizedAttributes: BlockAttributes,
): Promise<string> {
  const script = new vm.Script(`((${code})())`);
  const context = vm.createContext(normalizedAttributes['context'] || {});
  return script.runInContext(context);
}

export async function run(
  content: string,
  fileDirectoryPath: string,
  cmd: string,
  normalizedAttributes: BlockAttributes,
  latexEngine: string = 'pdflatex',
): Promise<string> {
  let args = normalizedAttributes['args'] || [];
  if (typeof args === 'string') {
    args = [args];
  }

  const fileExtension = getFileExtension(cmd);
  const savePath = path.resolve(
    fileDirectoryPath,
    Math.random()
      .toString(36)
      .substr(2, 9) +
      '_code_chunk' +
      fileExtension,
  );
  content = content.replace(/\u00A0/g, ' ');

  if (cmd.match(/(la)?tex/) || cmd === 'pdflatex') {
    const patchedAttributes = {
      ...normalizedAttributes,
      latex_engine: normalizedAttributes['latex_engine'] || latexEngine,
    };
    return compileLaTeX(content, fileDirectoryPath, patchedAttributes);
  }

  if (cmd === 'node.vm') {
    return runInVm(content, normalizedAttributes);
  }

  if (
    cmd.match(/python/) &&
    (normalizedAttributes['matplotlib'] || normalizedAttributes['mpl'])
  ) {
    content =
      `
# -*- coding: utf-8 -*-
# modify default matplotlib pyplot show function
try:
    import matplotlib
    matplotlib.use('Agg') # use Agg backend
    import matplotlib.pyplot as plt
    import sys
    def new_plt_show():
        plt.savefig(sys.stdout, format="svg")
    plt.show = new_plt_show # override old one
except Exception:
    pass
# modify default mpld3 behavior
try:
    import matplotlib.pyplot as plt, mpld3
    import sys
    def new_mpld3_show():
        fig = plt.gcf() # get current figure
        sys.stdout.write(mpld3.fig_to_html(fig))
    mpld3.show = new_mpld3_show # override old one
    mpld3.display = new_mpld3_show
except Exception:
    pass
` + content;
  }

  await utility.writeFile(savePath, content);

  // check macros
  let findInputFileMacro = false;
  args = args.map(arg => {
    if (arg === '$input_file') {
      findInputFileMacro = true;
      return savePath;
    } else {
      return arg;
    }
  });

  if (!findInputFileMacro && !normalizedAttributes['stdin']) {
    args.push(savePath);
  }

  return await new Promise<string>((resolve, reject) => {
    const task = spawn(cmd, args, { cwd: fileDirectoryPath });
    if (normalizedAttributes['stdin']) {
      task.stdin.write(content); // pass content as stdin
    }
    task.stdin.end();

    const chunks: Buffer[] = [];
    task.stdout.on('data', chunk => {
      chunks.push(chunk);
    });

    task.stderr.on('data', chunk => {
      chunks.push(chunk);
    });

    task.on('error', error => {
      chunks.push(Buffer.from(error.toString(), 'utf-8'));
    });

    task.on('close', () => {
      unlink(savePath, () => {
        const data = Buffer.concat(chunks).toString();
        resolve(data);
      });
    });
  });
}

const fileExtensionMap = {
  go: '.go',
  javascript: '.js',
  python: '.py',
  typescript: '.ts',
  node: '.js',
  'ts-node': '.ts',
};

function getFileExtension(cmd: string): string {
  return fileExtensionMap[cmd] || `.${cmd}`;
}
