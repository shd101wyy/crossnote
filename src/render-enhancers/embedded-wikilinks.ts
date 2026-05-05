import type { CheerioAPI } from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { escape } from 'html-escaper';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { Notebook } from '../notebook';

const MAX_EMBED_DEPTH = 3;

/**
 * File extensions where reading the file as a UTF-8 string and
 * embedding it as a `<pre><code>` block would produce garbage (binary
 * content gets mangled into `�` replacement characters).  We
 * reject these explicitly with an error message instead of falling
 * through to the text-embed branch.
 *
 * This is not exhaustive — anything unrecognised that turns out to
 * be binary will still produce ugly output — but it covers the
 * common offenders that a notebook-style workspace would actually
 * have lying around.
 */
const BINARY_EMBED_EXTENSIONS = new Set([
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.tgz',
  '.7z',
  '.rar',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  '.dmg',
  '.iso',
  '.mp3',
  '.mp4',
  '.mov',
  '.wav',
  '.flac',
  '.ogg',
  '.webm',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.odt',
  '.ods',
  '.odp',
]);

const IMAGE_EMBED_RE = /^\.(apng|avif|gif|jpeg|jpg|png|svg|bmp|webp|emf)$/;

export default async function enhance(
  $: CheerioAPI,
  notebook: Notebook,
  fileDirectoryPath: string,
  embedDepth: number = 0,
): Promise<void> {
  const embeds = $('wikilink-embed.wikilink-embed');

  // Hit the recursion cap: replace each remaining placeholder with a
  // visible warning so the user sees that an embed was skipped, rather
  // than a silent blank where they expected `![[Note]]` content.
  if (embedDepth >= MAX_EMBED_DEPTH) {
    embeds.each((_i, el: AnyNode) => {
      const attribs = (el as Element).attribs;
      const embedPath = decodeURIComponent(
        (attribs && attribs['data-wikilink-embed-path']) || '',
      );
      $(el).replaceWith(
        `<div class="wikilink-embed-content wikilink-embed-error">Maximum embed depth (${MAX_EMBED_DEPTH}) reached: ${escape(
          embedPath,
        )}</div>`,
      );
    });
    return;
  }
  const asyncFunctions: Promise<void>[] = [];

  embeds.each((_i, el: AnyNode) => {
    const attribs = (el as Element).attribs;
    if (!attribs) return;

    const embedPath = decodeURIComponent(
      attribs['data-wikilink-embed-path'] || '',
    );
    const embedText = decodeURIComponent(
      attribs['data-wikilink-embed-text'] || '',
    );
    const blockRef = decodeURIComponent(
      attribs['data-wikilink-embed-block-ref'] || '',
    );
    if (!embedPath) return;

    asyncFunctions.push(
      resolveEmbed(
        $,
        notebook,
        fileDirectoryPath,
        $(el),
        embedPath,
        embedText,
        blockRef,
        embedDepth,
      ),
    );
  });

  await Promise.all(asyncFunctions);
}

async function resolveEmbed(
  _$: CheerioAPI,
  notebook: Notebook,
  fileDirectoryPath: string,
  $placeholder: ReturnType<CheerioAPI>,
  embedPath: string,
  embedText: string,
  blockRef: string,
  depth: number,
): Promise<void> {
  if (embedPath.match(/^https?:\/\//)) {
    $placeholder.replaceWith(
      `<div class="wikilink-embed-content wikilink-embed-error">Remote content embedding is not supported: ${escape(
        embedPath,
      )}</div>`,
    );
    return;
  }

  let resolvedPath: string;

  if (embedPath.startsWith('/')) {
    resolvedPath = path.resolve(notebook.notebookPath.fsPath, '.' + embedPath);
  } else {
    resolvedPath = path.resolve(fileDirectoryPath, embedPath);
  }

  let hash = '';
  const hashIndex = resolvedPath.lastIndexOf('#');
  if (hashIndex > 0) {
    hash = resolvedPath.substring(hashIndex);
    resolvedPath = resolvedPath.substring(0, hashIndex);
  }

  // Decide what to do BEFORE reading the file — for image and binary
  // targets we don't need (or want) the byte content in memory.
  const extname = path.extname(resolvedPath).toLowerCase();

  // Image: emit an <img> tag.  Don't read the file.
  if (IMAGE_EMBED_RE.test(extname)) {
    $placeholder.replaceWith(
      `<div class="wikilink-embed-content"><img src="${escape(
        resolvedPath,
      )}" alt="${escape(embedText)}"></div>`,
    );
    return;
  }

  // Known binary types: refuse with a clear error rather than reading
  // the bytes as UTF-8 and embedding gibberish into the preview HTML.
  if (BINARY_EMBED_EXTENSIONS.has(extname)) {
    $placeholder.replaceWith(
      `<div class="wikilink-embed-content wikilink-embed-error">Cannot embed binary file: ${escape(
        embedPath,
      )}</div>`,
    );
    return;
  }

  let content: string;
  try {
    content = await notebook.fs.readFile(resolvedPath);
  } catch {
    $placeholder.replaceWith(
      `<div class="wikilink-embed-content wikilink-embed-error">File not found: ${escape(
        embedPath,
      )}</div>`,
    );
    return;
  }

  if (notebook.config.markdownFileExtensions.includes(extname)) {
    try {
      let markdownContent = content;

      if (hash) {
        const headingLines = markdownContent.split('\n');
        let headingLineIndex = -1;
        for (let i = 0; i < headingLines.length; i++) {
          const line = headingLines[i];
          const match = line.match(/^(#{1,7})\s.*\{[^}]*#/);
          if (match && line.includes(`#${hash.slice(1)}`)) {
            headingLineIndex = i;
            break;
          }
        }

        if (headingLineIndex >= 0) {
          const headingLine = headingLines[headingLineIndex];
          const headingLevel =
            (headingLine.match(/^(#{1,7})/) || [])[1]?.length || 1;

          let endLineIndex = headingLines.length;
          for (let i = headingLineIndex + 1; i < headingLines.length; i++) {
            const levelMatch = headingLines[i].match(/^(#{1,7})\s/);
            if (levelMatch && levelMatch[1].length <= headingLevel) {
              endLineIndex = i;
              break;
            }
          }
          markdownContent = headingLines
            .slice(headingLineIndex, endLineIndex)
            .join('\n');
        }
      }

      const embedFileDir = path.dirname(resolvedPath);
      const engine = notebook.getNoteMarkdownEngine(resolvedPath);
      const { html } = await engine.parseMD(markdownContent, {
        useRelativeFilePath: false,
        isForPreview: true,
        hideFrontMatter: true,
        fileDirectoryPath: embedFileDir,
      });

      const embed$ = cheerio.load(`<div>${html}</div>`);
      await enhance(embed$, notebook, embedFileDir, depth + 1);

      let resultHtml = embed$.html();

      if (blockRef) {
        // Extract just the referenced block from rendered HTML.
        // Find the span/div with the block ID, then extract its
        // parent block-level element (p, li, blockquote, etc.)
        const blockSpan = embed$(`#${blockRef}, [id="${blockRef}"]`).first();
        if (blockSpan.length) {
          const parent = blockSpan.parent();
          if (parent.length) {
            resultHtml = `<div class="wikilink-embed-content">${cheerioLoadHtml(parent.toString() ?? '')}</div>`;
          } else {
            resultHtml = `<div class="wikilink-embed-content">${cheerioLoadHtml(blockSpan.toString() ?? '')}</div>`;
          }
        } else {
          resultHtml = `<div class="wikilink-embed-content wikilink-embed-error">Block reference not found: ${escape(
            blockRef,
          )}</div>`;
        }
      } else {
        resultHtml = `<div class="wikilink-embed-content">${resultHtml}</div>`;
      }

      $placeholder.replaceWith(resultHtml);
    } catch (error) {
      $placeholder.replaceWith(
        `<div class="wikilink-embed-content wikilink-embed-error">Error rendering embed: ${escape(
          String(error),
        )}</div>`,
      );
    }
  } else {
    // Unknown / text-y extension: embed as a fenced code block.  We
    // already filtered out the binary cases up front so this is safe
    // for `.txt`, `.json`, `.csv`, source files, etc.
    $placeholder.replaceWith(
      `<div class="wikilink-embed-content"><pre class="language-text"><code>${escape(
        content,
      )}</code></pre></div>`,
    );
  }
}

function cheerioLoadHtml(html: string): string {
  const $ = cheerio.load(`<div>${html}</div>`);
  const bodyHtml = $('body').html() ?? '';
  return bodyHtml;
}
