import type { CheerioAPI } from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { escape } from 'html-escaper';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { Notebook } from '../notebook';

const MAX_EMBED_DEPTH = 3;

export default async function enhance(
  $: CheerioAPI,
  notebook: Notebook,
  fileDirectoryPath: string,
  embedDepth: number = 0,
): Promise<void> {
  if (embedDepth >= MAX_EMBED_DEPTH) {
    return;
  }

  const embeds = $('wikilink-embed.wikilink-embed');
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
    if (!embedPath) return;

    asyncFunctions.push(
      resolveEmbed(
        $,
        notebook,
        fileDirectoryPath,
        $(el),
        embedPath,
        embedText,
        embedDepth,
      ),
    );
  });

  await Promise.all(asyncFunctions);
}

async function resolveEmbed(
  $: CheerioAPI,
  notebook: Notebook,
  fileDirectoryPath: string,
  $placeholder: ReturnType<CheerioAPI>,
  embedPath: string,
  embedText: string,
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

  const extname = path.extname(resolvedPath).toLowerCase();

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

      $placeholder.replaceWith(
        `<div class="wikilink-embed-content">${embed$.html()}</div>`,
      );
    } catch (error) {
      $placeholder.replaceWith(
        `<div class="wikilink-embed-content wikilink-embed-error">Error rendering embed: ${escape(
          String(error),
        )}</div>`,
      );
    }
  } else if (
    extname.match(/^\.(apng|avif|gif|jpeg|jpg|png|svg|bmp|webp|emf)$/)
  ) {
    $placeholder.replaceWith(
      `<div class="wikilink-embed-content"><img src="${escape(
        resolvedPath,
      )}" alt="${escape(embedText)}"></div>`,
    );
  } else {
    $placeholder.replaceWith(
      `<div class="wikilink-embed-content"><pre class="language-text"><code>${escape(
        content,
      )}</code></pre></div>`,
    );
  }
}
