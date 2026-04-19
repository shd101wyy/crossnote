import { execFile } from 'child_process';
import { mkdirp } from 'mkdirp';
import * as path from 'path';

// ebook-convert is requied (calibre), which can be got from https://calibre-ebook.com/download
// xpath http://www.w3schools.com/xsl/xpath_syntax.asp

function processMetadata(config: Record<string, unknown> = {}, args: string[]) {
  const title = (config['title'] as string) || 'No Title';
  args.push('--title', title);

  if (config['authors']) {
    args.push('--authors', config['authors'] as string);
  }

  if (config['cover']) {
    args.push('--cover', config['cover'] as string);
  }

  if (config['comment']) {
    args.push('--comments', config['comments'] as string);
  }

  if (config['publisher']) {
    args.push('--publisher', config['publisher'] as string);
  }

  if (config['book-producer']) {
    args.push('--book-producer', config['book-producer'] as string);
  }

  if (config['pubdate']) {
    args.push('--pubdate', config['pubdate'] as string);
  }

  if (config['language']) {
    args.push('--language', config['language'] as string);
  }

  if (config['isbn']) {
    args.push('--isbn', config['isbn'] as string);
  }

  if (config['tags']) {
    args.push('--tags', config['tags'] as string);
  }

  if (config['series']) {
    args.push('--series', config['series'] as string);
  }

  if (config['rating']) {
    args.push('--rating', config['rating'] as string);
  }
}

function processAppearance(
  config: Record<string, unknown> = {},
  args: string[],
) {
  if (config['asciiize']) {
    args.push('--asciiize');
  }

  if (config['base-font-size']) {
    args.push('--base-font-size=' + (config['base-font-size'] as string));
  }

  if (config['disable-font-rescaling']) {
    args.push('--disable-font-rescaling');
  }

  if (config['line-height']) {
    args.push('--line-height=' + (config['line-height'] as string));
  }

  let marginTop = 72;
  let marginRight = 72;
  let marginBottom = 72;
  let marginLeft = 72;
  if (config['margin']) {
    const margin = config['margin'] as number[] | number;
    if (margin instanceof Array) {
      if (margin.length === 1) {
        marginTop = margin[0];
        marginBottom = margin[0];
        marginLeft = margin[0];
        marginRight = margin[0];
      } else if (margin.length === 2) {
        marginTop = margin[0];
        marginBottom = margin[0];
        marginLeft = margin[1];
        marginRight = margin[1];
      } else if (margin.length === 4) {
        marginTop = margin[0];
        marginRight = margin[1];
        marginBottom = margin[2];
        marginLeft = margin[3];
      }
    } else if (typeof margin === 'number') {
      marginTop = margin;
      marginBottom = margin;
      marginLeft = margin;
      marginRight = margin;
    }
  } else {
    if (config['margin-top']) {
      marginTop = config['margin-top'] as number;
    }
    if (config['margin-right']) {
      marginRight = config['margin-right'] as number;
    }
    if (config['margin-bottom']) {
      marginBottom = config['margin-bottom'] as number;
    }
    if (config['margin-left']) {
      marginLeft = config['margin-left'] as number;
    }
  }

  args.push('--margin-top=' + marginTop);
  args.push('--margin-bottom=' + marginBottom);
  args.push('--margin-left=' + marginLeft);
  args.push('--margin-right=' + marginRight);
}

function processEPub(config: Record<string, unknown> = {}, args: string[]) {
  if (config['no-default-epub-cover']) {
    args.push('--no-default-epub-cover');
  }
  if (config['no-svg-cover']) {
    args.push('--no-svg-cover');
  }
  if (config['pretty-print']) {
    args.push('--pretty-print');
  }
}

function processPDF(config: Record<string, unknown> = {}, args: string[]) {
  if (config['paper-size']) {
    args.push('--paper-size', config['paper-size'] as string);
  }

  if (config['default-font-size']) {
    args.push(
      '--pdf-default-font-size=' + (config['default-font-size'] as string),
    );
  }

  if (config['header-template']) {
    args.push('--pdf-header-template', config['header-template'] as string);
  }

  if (config['footer-template']) {
    args.push('--pdf-footer-template', config['footer-template'] as string);
  }

  if (config['page-numbers']) {
    args.push('--pdf-page-numbers');
  }

  if (config['pretty-print']) {
    args.push('--pretty-print');
  }
}

/**
 * @param src: link to .html file
 * @param dest: output path
 */

export function ebookConvert(
  src: string,
  dest: string,
  config: Record<string, unknown> = {},
) {
  return new Promise<void>((resolve, reject) => {
    const args = [
      src,
      dest,
      '--level1-toc',
      '//*[@ebook-toc-level-1]/@heading',
      '--level2-toc',
      '//*[@ebook-toc-level-2]/@heading',
      '--level3-toc',
      '//*[@ebook-toc-level-3]/@heading',
      '--no-chapters-in-toc',
    ];

    processMetadata(config, args);
    processAppearance(config, args);

    // output formats
    const format = path.extname(dest).slice(1);
    if (format === 'epub') {
      processEPub(config['epub'] as Record<string, unknown>, args);
    } else if (format === 'pdf') {
      processPDF(config['pdf'] as Record<string, unknown>, args);
    }

    // arguments
    const ebookArgs = (config['args'] as string[]) || [];
    ebookArgs.forEach((arg) => {
      args.push(arg);
    });

    // ebook-convert will cause error if directory doesn't exist,
    // therefore I will create directory first.
    mkdirp(path.dirname(dest))
      .then(() => {
        execFile('ebook-convert', args, (error2) => {
          if (error2) {
            return reject(error2.toString());
          } else {
            return resolve();
          }
        });
      })
      .catch((error) => {
        if (error) {
          return reject(error);
        }
      });
  });
}

/*
# Example
ebookConvert('test.html', 'test.epub', {title: 'hehe', authors: 'shd101wyy'})
.then(()=> {...})
.catch((error)=> {...})
###
*/
