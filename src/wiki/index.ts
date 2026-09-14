import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import {
  getCrossnoteBuildDirectory,
  setCrossnoteBuildDirectory,
} from '../utility';
import { createNotebooksForDirectories } from '../serve/config';
import { listMarkdownFiles } from '../serve/markdown-files';

/**
 * Injected into every embedded note document. Makes the document behave
 * inside the wiki shell:
 *
 * - links to other notes of the wiki are relayed to the shell, which swaps
 *   the iframe instead of navigating away;
 * - http(s) links open in a new browser tab (the sandboxed iframe itself is
 *   never navigated away);
 * - task-list checkboxes are click-disabled — the wiki is a read-only
 *   snapshot and there is no file behind the checkbox to update.
 *
 * Runs inside a `sandbox="allow-scripts …"` iframe, so its only outbound
 * channel is `parent.postMessage`.
 */
const WIKI_RELAY_SCRIPT = `(function () {
  document.addEventListener('click', function (event) {
    var node = event.target;
    var anchor = node && node.closest ? node.closest('a') : null;
    if (!anchor) {
      if (node && node.classList && node.classList.contains('task-list-item-checkbox')) {
        event.preventDefault();
      }
      return;
    }
    var href = anchor.getAttribute('href');
    if (!href || href.charAt(0) === '#') {
      return;
    }
    if (anchor.target === '_blank') {
      return;
    }
    event.preventDefault();
    if (/^https?:/i.test(href)) {
      window.open(anchor.href, '_blank', 'noopener');
      return;
    }
    if (/^(mailto:|tel:)/i.test(href)) {
      window.location.href = href;
      return;
    }
    parent.postMessage({ command: 'wiki-navigate', href: href }, '*');
  }, true);
})();`;

export interface BuildWikiOptions {
  /**
   * Directories to include — like a VS Code multi-root workspace, each keeps
   * its own `.crossnote` config while the global config layer is shared.
   */
  directories: string[];
  /** Load config from VS Code user settings on top of the global config. */
  vscode?: boolean;
  /** Path to the VS Code user `settings.json` (auto-detected by default). */
  vscodeSettingsPath?: string;
  /** Override the global config directory (tests). */
  globalConfigDirectory?: string;
  /** Override the crossnote build directory (tests). */
  crossnoteBuildDirectory?: string;
  /**
   * Progress callback, called after each rendered note. `rendered`/`total`
   * count the notes of the root currently being processed.
   */
  onProgress?: (info: {
    rendered: number;
    total: number;
    root: string;
  }) => void;
}

export interface WikiFileEntry {
  /** Absolute path of the note. */
  path: string;
  /** Absolute path of the served root the note belongs to. */
  root: string;
  /** Document title (front-matter title or file basename). */
  title: string;
  /** The complete, self-contained export document of the note. */
  html: string;
}

export interface BuildWikiResult {
  /** The standalone HTML document. */
  html: string;
  /** Metadata of the embedded notes (without the html payloads). */
  files: Array<Pick<WikiFileEntry, 'path' | 'root' | 'title'>>;
  rootDirectories: string[];
  /** Notes that failed to render, skipped from the wiki. */
  failures: Array<{ path: string; error: string }>;
}

/**
 * Build a standalone, single-file wiki (a la TiddlyWiki) from a list of
 * directories: every markdown note is rendered into its own self-contained
 * HTML document through the regular HTML export pipeline (CDN asset links,
 * local images/SVGs embedded as data URIs), and the documents are embedded
 * into one shell file with a small client-side app — file list, fuzzy
 * filter, and a sandboxed iframe that shows one note at a time.
 *
 * The result is read-only by construction: notes are pre-rendered and the
 * embedded documents have no write channel back to anything.
 */
export async function buildWiki(
  options: BuildWikiOptions,
): Promise<BuildWikiResult> {
  const buildDirectory = path.resolve(
    options.crossnoteBuildDirectory ?? getCrossnoteBuildDirectory(),
  );
  setCrossnoteBuildDirectory(buildDirectory);

  const { rootDirectories, notebooks } = await createNotebooksForDirectories(
    options.directories,
    {
      vscode: options.vscode,
      vscodeSettingsPath: options.vscodeSettingsPath,
      globalConfigDirectory: options.globalConfigDirectory,
    },
  );

  const files: WikiFileEntry[] = [];
  const failures: Array<{ path: string; error: string }> = [];

  for (let rootIndex = 0; rootIndex < rootDirectories.length; rootIndex++) {
    const root = rootDirectories[rootIndex];
    const notebook = notebooks[rootIndex];
    const markdownFiles = await listMarkdownFiles(root);
    let processedInRoot = 0;
    for (const file of markdownFiles) {
      try {
        const engine = notebook.getNoteMarkdownEngine(file.absolutePath);
        let html = await engine.htmlExportDocument({
          offline: false,
          // A wiki is meant to be shared, so local images/SVGs travel with
          // it as data URIs (front matter can still turn this off).
          embedLocalImages: true,
          embedSVG: true,
        });
        let title = path.basename(
          file.absolutePath,
          path.extname(file.absolutePath),
        );
        const $ = cheerio.load(html);
        // Same-document fragment anchors keep working; relative note links
        // are relayed to the shell; external links open new tabs.
        $('head').prepend(`<script>${WIKI_RELAY_SCRIPT}</script>`);
        const titleElement = $('title').first().text().trim();
        if (titleElement) {
          title = titleElement;
        }
        html = $.html();
        files.push({ path: file.absolutePath, root, title, html });
      } catch (error) {
        failures.push({
          path: file.absolutePath,
          error: String(error),
        });
      }
      processedInRoot += 1;
      options.onProgress?.({
        rendered: processedInRoot,
        total: markdownFiles.length,
        root,
      });
    }
  }

  if (files.length === 0) {
    throw new Error(
      'no markdown notes found to build a wiki from' +
        (failures.length > 0
          ? ` (${failures.length} notes failed to render)`
          : ''),
    );
  }

  const html = buildShellHTML({
    rootDirectories,
    files,
    buildDirectory,
  });

  return {
    html,
    files: files.map(({ path, root, title }) => ({ path, root, title })),
    rootDirectories,
    failures,
  };
}

/**
 * Assemble the shell document: a small client-side app (inlined from the
 * build directory) plus every note document embedded as a JSON payload.
 */
function buildShellHTML({
  rootDirectories,
  files,
  buildDirectory,
}: {
  rootDirectories: string[];
  files: WikiFileEntry[];
  buildDirectory: string;
}): string {
  const appScriptPath = path.join(buildDirectory, 'wiki-app', 'wiki-app.js');
  const appStylePath = path.join(buildDirectory, 'wiki-app', 'wiki-app.css');
  let appScript: string;
  let appStyle: string;
  try {
    appScript = fs.readFileSync(appScriptPath, 'utf-8');
    appStyle = fs.readFileSync(appStylePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `the wiki app bundle is missing (looked at ${appScriptPath}); rebuild crossnote so out/wiki-app/ exists`,
      { cause: error },
    );
  }
  // Escape `</script>`-breakouts: `<` inside the JSON payload (and inside
  // the inlined app, for good measure) becomes a JS unicode escape.
  const payload = JSON.stringify({
    rootDirectories,
    files,
  }).replace(/</g, '\\u003c');
  const safeAppScript = appScript.replace(/<\/script/g, '<\\/script');
  const safeAppStyle = appStyle.replace(/<\/style/g, '<\\/style');

  const title = `wiki — ${path.basename(rootDirectories[0] ?? '')}`;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHTML(title)}</title>
<style>${safeAppStyle}</style>
</head>
<body>
<script>window.__CROSSNOTE_WIKI__ = ${payload};</script>
<div id="root"></div>
<script>${safeAppScript}</script>
</body>
</html>`;
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
