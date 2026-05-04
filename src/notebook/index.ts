import { Mutex } from 'async-mutex';
import * as caseAnything from 'case-anything';
import ignore, { type Ignore } from 'ignore';
import { execFileSync } from 'child_process';
import MarkdownIt from 'markdown-it';
import MarkdownItAbbr from 'markdown-it-abbr';
import MarkdownItDeflist from 'markdown-it-deflist';
import MarkdownItFootnote from 'markdown-it-footnote';
import MarkdownItMark from 'markdown-it-mark';
import MarkdownItSub from 'markdown-it-sub';
import MarkdownItSup from 'markdown-it-sup';
import Token from 'markdown-it/lib/token';
import * as path from 'path';
import { URI, Utils } from 'vscode-uri';
import type { MarkdownRenderer, RenderOptions } from 'markdown_yo';
import parseMath from '../renderers/parse-math';
import useMarkdownAdmonition from '../custom-markdown-it-features/admonition';
import useMarkdownCallout from '../custom-markdown-it-features/callout';
import useMarkdownItCodeFences from '../custom-markdown-it-features/code-fences';
import useMarkdownItColonFencedCodeBlocks from '../custom-markdown-it-features/colon-fenced-code-blocks';
import useMarkdownItCriticMarkup from '../custom-markdown-it-features/critic-markup';
import useMarkdownItCurlyBracketAttributes from '../custom-markdown-it-features/curly-bracket-attributes';
import useMarkdownItEmoji from '../custom-markdown-it-features/emoji';
import useMarkdownItHTML5Embed from '../custom-markdown-it-features/html5-embed';
import useMarkdownItMath from '../custom-markdown-it-features/math';
import useMarkdownItSourceMap from '../custom-markdown-it-features/sourcemap';
import useMarkdownItTag from '../custom-markdown-it-features/tag';
import useMarkdownItWidget from '../custom-markdown-it-features/widget';
import useMarkdownItWikilink from '../custom-markdown-it-features/wikilink';
import { MarkdownEngine } from '../markdown-engine';
import { replaceVariablesInString } from '../utility';
import { loadConfigsInDirectory, wrapNodeFSAsApi } from './config-helper';
import { matter, matterStringify } from './markdown';
import { FilePath, Mentions, Note, NoteConfig, Notes } from './note';
import { Reference, ReferenceMap, TagReferenceMap } from './reference';
import Search from './search';
import {
  Backlink,
  ExtendedMarkdownItOptions,
  FileSystemApi,
  FileSystemStats,
  IS_NODE,
  NotebookConfig,
  getDefaultNotebookConfig,
} from './types';

export * from './types';
export { constructGraphView } from './graph-view';
export type { GraphViewData, GraphViewLink, GraphViewNode } from './graph-view';
export { ReferenceMap, TagReferenceMap } from './reference';
export type { Reference, ReferenceKind } from './reference';
export {
  extractBlockIds,
  extractHeadings,
  findFragmentTargetLine,
} from './note-fragments';
export type { Note, Notes, NoteConfig, Mentions } from './note';
export { matter, matterStringify } from './markdown';
export type { MatterOutput } from './markdown';

const defaultMarkdownItConfig: Partial<ExtendedMarkdownItOptions> = {
  html: true, // Enable HTML tags in source
  xhtmlOut: false, // Use '/' to close single tags (<br />)
  breaks: true, // Convert '\n' in paragraphs into <br>
  langPrefix: 'language-', // CSS language prefix for fenced blocks
  linkify: true, // autoconvert URL-like texts to links
  typographer: true, // Enable smartypants and other sweet transforms
  sourceMap: true, // Enable source map
};

interface NotebookConstructorArgs {
  /**
   * Absolute path to the notebook directory
   * The path can include the scheme like `file`
   * If no scheme is passed, then `file` is used.
   */
  notebookPath: string;
  /**
   * This has the highest priority.
   * Then the configs from ".crossnote/*" will be merged.
   */
  config: Partial<NotebookConfig>;
  /**
   * File system API.
   * You can check `wrapNodeFSAsApi` in `config-helper.ts` as a reference.
   */
  fs?: FileSystemApi;
}

interface RefreshNotesIfNotLoaded {
  /**
   * Relative path to the notebook
   */
  dir: string;
  includeSubdirectories?: boolean;
}

interface RefreshNotesArgs extends RefreshNotesIfNotLoaded {
  refreshRelations?: boolean;
}

/** Internal shape used during the recursive directory walk. */
interface RefreshNotesInternalArgs extends RefreshNotesArgs {
  /**
   * Accumulated .gitignore rules from ancestor directories.
   * Each entry: ig = parsed rules; base = directory path relative to the
   * notebook root, using forward slashes (POSIX), with no trailing slash.
   */
  gitignoreStack?: Array<{ ig: Ignore; base: string }>;
}

export class Notebook {
  public notebookPath!: URI;
  public config!: NotebookConfig;
  public fs!: FileSystemApi;

  public notes: Notes = {};
  public hasLoadedNotes: boolean = false;
  public referenceMap: ReferenceMap = new ReferenceMap();
  /**
   * Global `#tag` index.  Independent of the file system: tags are
   * notebook-wide metadata, not phantom paths.  See
   * src/notebook/reference.ts for shape.
   */
  public tagReferenceMap: TagReferenceMap = new TagReferenceMap();
  private refreshNotesIfNotLoadedMutex: Mutex = new Mutex();
  /**
   * Serialises calls to refreshNotes so two callers can't interleave
   * the wipe-and-rebuild cycle (which would leave the indices in a
   * half-rebuilt state — the second wipe would happen after the first
   * loop had populated entries the second wipe expects to remove,
   * etc.).  refreshNotesIfNotLoaded above goes through its own mutex
   * but ultimately calls refreshNotes; sharing one mutex across both
   * wouldn't be safe (refreshNotesIfNotLoaded would deadlock when it
   * calls refreshNotes while holding the same lock).
   */
  private refreshNotesMutex: Mutex = new Mutex();

  private search: Search = new Search();

  public md!: MarkdownIt;

  /**
   * Optional markdown_yo WASM renderer.
   * Used for HTML rendering when `markdownParser === 'markdown_yo'`.
   */
  public markdownYoRenderer: MarkdownRenderer | null = null;

  /**
   * Tracks in-flight markdown_yo initialization to avoid duplicate loads.
   */
  private markdownYoRendererPromise: Promise<void> | null = null;
  /**
   * Markdown engines for each note
   * key is the relative path of the note
   */
  private markdownEngines: { [key: FilePath]: MarkdownEngine } = {};

  private constructor() {}

  private async init({
    notebookPath,
    config = {},
    fs,
  }: NotebookConstructorArgs) {
    const uri = URI.parse(notebookPath);

    // Check if workspaceFolder is absolute path
    if (!path.isAbsolute(uri.fsPath) || uri.path.startsWith('/./')) {
      throw new Error(
        `\`notebookPath\`: "${notebookPath}" must be an absolute path`,
      );
    }
    this.notebookPath = uri;
    this.initFs(fs);
    await this.initConfig(config);
    this.md = this.initMarkdownIt();
    if (this.config.markdownParser === 'markdown_yo') {
      await this.initMarkdownYo();
    }
    this.updateConfig({});
  }

  public static async init(args: NotebookConstructorArgs) {
    const crossnote = new Notebook();
    await crossnote.init(args);
    return crossnote;
  }

  private async initConfig(config: Partial<NotebookConfig>) {
    const extraConfig = await loadConfigsInDirectory(
      path.join(this.notebookPath.fsPath, './.crossnote'),
      this.fs,
    );
    this.config = {
      ...getDefaultNotebookConfig(),
      ...extraConfig,
      ...config,
    };
  }

  public initMarkdownIt(options?: ExtendedMarkdownItOptions) {
    const md = new MarkdownIt(options ?? defaultMarkdownItConfig);

    // markdown-it extensions
    md.use(MarkdownItFootnote);
    md.use(MarkdownItSub);
    md.use(MarkdownItSup);
    md.use(MarkdownItDeflist);
    md.use(MarkdownItAbbr);
    md.use(MarkdownItMark);

    useMarkdownItCodeFences(md);
    useMarkdownItColonFencedCodeBlocks(md);
    useMarkdownItCurlyBracketAttributes(md);
    useMarkdownItCriticMarkup(md, this);
    useMarkdownItEmoji(md, this);
    useMarkdownItHTML5Embed(md, this);
    useMarkdownItMath(md, this);
    useMarkdownItWikilink(md, this);
    useMarkdownAdmonition(md);
    useMarkdownCallout(md);
    useMarkdownItSourceMap(md);
    useMarkdownItTag(md, this);
    useMarkdownItWidget(md, this);
    return md;
  }

  initFs(_fs?: FileSystemApi) {
    if (_fs) {
      this.fs = _fs;
    } else {
      if (IS_NODE) {
        this.fs = wrapNodeFSAsApi();
      } else {
        throw new Error('`fs` is required');
      }
    }
  }

  /**
   * Initialize the markdown_yo WASM renderer.
   */
  private async initMarkdownYo() {
    if (this.markdownYoRendererPromise) {
      await this.markdownYoRendererPromise;
      return;
    }

    if (this.markdownYoRenderer) {
      return;
    }

    this.markdownYoRendererPromise = (async () => {
      try {
        const { createRenderer } = await import('markdown_yo');
        const renderer = await createRenderer();

        if (this.config.markdownParser === 'markdown_yo') {
          this.markdownYoRenderer = renderer;
        } else {
          renderer.destroy();
        }
      } catch (error) {
        console.warn('Failed to load markdown_yo WASM renderer:', error);
        this.markdownYoRenderer = null;
      } finally {
        this.markdownYoRendererPromise = null;
      }
    })();

    await this.markdownYoRendererPromise;
  }

  private destroyMarkdownYo() {
    this.markdownYoRenderer?.destroy();
    this.markdownYoRenderer = null;
  }

  /**
   * Build markdown_yo render options from the current notebook config.
   */
  public buildMarkdownYoOptions(isForPreview: boolean): RenderOptions {
    const c = this.config;
    return {
      html: true,
      typographer: !!c.enableTypographer,
      breaks: !!c.breakOnSingleNewLine,
      // Always-on features in crossnote (plugins loaded unconditionally)
      subscript: true,
      superscript: true,
      mark: true,
      footnote: true,
      deflist: true,
      abbr: true,
      admonition: true,
      callout: true,
      // Conditional features
      emoji: !!c.enableEmojiSyntax,
      wikilink: !!c.enableWikiLinkSyntax,
      critic: !!c.enableCriticMarkupSyntax,
      math: c.mathRenderingOption !== 'None',
      sourceMap: isForPreview,
    };
  }

  /**
   * Convert markdown_yo RenderOptions to CLI flags for the native binary.
   */
  private buildMarkdownYoBinaryArgs(opts: RenderOptions): string[] {
    const flags: string[] = [];
    if (opts.html) flags.push('--html');
    if (opts.typographer) flags.push('--typographer');
    if (opts.commonmark) flags.push('--commonmark');
    if (opts.subscript) flags.push('--subscript');
    if (opts.superscript) flags.push('--superscript');
    if (opts.mark) flags.push('--mark');
    if (opts.math) flags.push('--math');
    if (opts.emoji) flags.push('--emoji');
    if (opts.wikilink) flags.push('--wikilink');
    if (opts.critic) flags.push('--critic');
    if (opts.abbr) flags.push('--abbr');
    if (opts.deflist) flags.push('--deflist');
    if (opts.admonition) flags.push('--admonition');
    if (opts.callout) flags.push('--callout');
    if (opts.footnote) flags.push('--footnote');
    if (opts.sourceMap) flags.push('--source-map');
    // Note: the `breaks` option (breakOnSingleNewLine) is not supported by the
    // native binary CLI and is silently ignored when using markdownYoBinaryPath.
    // Read from stdin
    flags.push('-');
    return flags;
  }

  /**
   * Render markdown to HTML using markdown_yo (WASM) if available,
   * otherwise falls back to markdown-it.
   */
  public renderMarkdown(
    markdown: string,
    options?: { isForPreview?: boolean },
  ): string {
    if (this.config.markdownParser === 'markdown_yo') {
      const renderOpts = this.buildMarkdownYoOptions(!!options?.isForPreview);
      const binaryPath = this.config.markdownYoBinaryPath;
      let html: string;
      if (binaryPath) {
        const args = this.buildMarkdownYoBinaryArgs(renderOpts);
        html = execFileSync(binaryPath, args, {
          input: markdown,
          encoding: 'utf8',
          maxBuffer: 256 * 1024 * 1024,
        });
      } else if (this.markdownYoRenderer) {
        html = this.markdownYoRenderer.render(markdown, renderOpts);
      } else {
        // WASM not yet loaded — fall through to markdown-it
        return this.renderMarkdownWithMarkdownIt(markdown, options);
      }
      return this.postProcessMarkdownYo(html);
    }
    return this.renderMarkdownWithMarkdownIt(markdown, options);
  }

  private renderMarkdownWithMarkdownIt(
    markdown: string,
    options?: { isForPreview?: boolean },
  ): string {
    if (options?.isForPreview) {
      return this.md.render(markdown);
    }
    const md = this.initMarkdownIt({
      ...this.md.options,
      sourceMap: false,
    });
    return md.render(markdown);
  }

  /**
   * Post-process markdown_yo HTML output:
   * - Render math expressions with KaTeX (when mathRenderingOption is 'KaTeX')
   * - Append file extension to wikilink hrefs
   */
  private postProcessMarkdownYo(html: string): string {
    // Post-process math: replace <span class="mathjax-exps">$...$</span>
    // and <div class="mathjax-exps">$$...$$</div> with KaTeX-rendered HTML
    if (this.config.mathRenderingOption === 'KaTeX') {
      html = html.replace(
        /<(span|div) class="mathjax-exps">(\${1,2})([\s\S]*?)\2<\/\1>/g,
        (_match, _tag, delim, content) => {
          const displayMode = delim === '$$';
          return parseMath({
            content: content.trim(),
            openTag: delim,
            closeTag: delim,
            displayMode,
            renderingOption: this.config.mathRenderingOption,
            katexConfig: this.config.katexConfig,
          });
        },
      );
    } else if (this.config.mathRenderingOption === 'MathJax') {
      // MathJax mode: normalize newlines in math content to spaces
      html = html.replace(
        /<(span|div) class="mathjax-exps">(\${1,2})([\s\S]*?)\2<\/\1>/g,
        (_match, tag, delim, content) => {
          const normalized = content.replace(/\n/g, ' ').trim();
          const text = delim + normalized + delim;
          return `<${tag} class="mathjax-exps">${text}</${tag}>`;
        },
      );
    }

    // Post-process wikilinks: append file extension to href
    if (this.config.enableWikiLinkSyntax) {
      html = html.replace(
        /<a href="([^"]*)"( class="wikilink")/g,
        (_match, href, classAttr) => {
          const processed = this.processWikilink(href);
          return `<a href="${processed.link}"${classAttr}`;
        },
      );
    }

    return html;
  }

  public updateConfig(config: Partial<NotebookConfig>) {
    this.config = {
      ...this.config,
      ...config,
    };

    // Interpolate config
    this.interpolateConfig();

    // Update markdown-it
    this.md.set({
      typographer: !!this.config.enableTypographer,
      breaks: !!this.config.breakOnSingleNewLine,
      linkify: !!this.config.enableLinkify,
    });

    if (this.config.markdownParser === 'markdown_yo') {
      void this.initMarkdownYo();
    } else {
      this.destroyMarkdownYo();
    }
  }

  private interpolateConfig() {
    const replacements = {
      projectDir: this.notebookPath.fsPath,
      workspaceFolder: this.notebookPath.fsPath, // vscode abreviation
    };

    // Replace certains paths
    this.config.imageFolderPath = replaceVariablesInString(
      this.config.imageFolderPath,
      replacements,
    );
    this.config.imageMagickPath = replaceVariablesInString(
      this.config.imageMagickPath,
      replacements,
    );
    this.config.chromePath = replaceVariablesInString(
      this.config.chromePath,
      replacements,
    );
    this.config.pandocPath = replaceVariablesInString(
      this.config.pandocPath,
      replacements,
    );
    this.config.markdownYoBinaryPath = replaceVariablesInString(
      this.config.markdownYoBinaryPath,
      replacements,
    );
    this.config.plantumlJarPath = replaceVariablesInString(
      this.config.plantumlJarPath,
      replacements,
    );
  }

  public async getBacklinkedNotes(filePath: string): Promise<Notes> {
    filePath = this.resolveNoteRelativePath(filePath);
    if (!(filePath in this.referenceMap.map)) {
      return {};
    }
    const map = this.referenceMap.map[filePath];
    const notes: Notes = {};
    // Use the in-memory `notes` map directly: by the time the host
    // calls into us the workspace has been refreshed (refreshNotes /
    // refreshNotesIfNotLoaded), so every referrer in the index has a
    // corresponding loaded Note.  Falling back to `await getNote`
    // would re-stat and re-read the file from disk on every backlink
    // hit — N async hops for N referrers.
    for (const rFilePath in map) {
      if (rFilePath === filePath) continue; // exclude self
      const note = this.notes[rFilePath];
      if (note) notes[rFilePath] = note;
    }
    return notes;
  }

  /**
   * List every tag that has been mentioned anywhere in the notebook.
   * Tags are case-folded, so the returned values are lowercase.
   */
  public getAllTags(): string[] {
    return this.tagReferenceMap.getAllTags();
  }

  /**
   * Notes that mention a given `#tag`, anywhere in the notebook.
   * Tag is matched case-insensitively.
   *
   * Reads from the in-memory `notes` map — same rationale as
   * `getBacklinkedNotes`: re-loading each referrer from disk would be
   * N async hops for no win, since the index can only contain
   * referrers we already loaded.
   */
  public async getNotesReferringToTag(tag: string): Promise<Notes> {
    const referrers = this.tagReferenceMap.getReferrers(tag);
    const notes: Notes = {};
    for (const filePath of referrers.keys()) {
      const note = this.notes[filePath];
      if (note) notes[filePath] = note;
    }
    return notes;
  }

  /**
   * Same shape as `getNoteBacklinks`, but for a `#tag` rather than a
   * note filepath.  Each Backlink groups a referrer note with the
   * individual `#tag` references inside it (token + rendered HTML).
   */
  public async getTagBacklinks(tag: string): Promise<Backlink[]> {
    const referrers = this.tagReferenceMap.getReferrers(tag);
    const backlinks: Backlink[] = [];
    for (const [filePath, references] of referrers) {
      const note = this.notes[filePath];
      if (!note) continue;
      backlinks.push({
        note: {
          notebookPath: note.notebookPath,
          filePath: note.filePath,
          title: note.title,
          config: note.config,
        },
        references,
        referenceHtmls: references.map((reference) => {
          const tokens = [reference.parentToken ?? reference.token];
          return this.md.renderer.render(tokens, this.md.options, {});
        }),
      });
    }
    return backlinks;
  }

  public async getNoteBacklinks(filePath: string): Promise<Backlink[]> {
    const backlinkedNotes = await this.getBacklinkedNotes(filePath);
    const backlinks: Backlink[] = [];
    const noteFilePaths = Object.keys(backlinkedNotes);

    for (const noteFilePath_ of noteFilePaths) {
      const note = backlinkedNotes[noteFilePath_];
      const references = await this.getReferences(filePath, noteFilePath_);
      backlinks.push({
        note: {
          notebookPath: note.notebookPath,
          filePath: note.filePath,
          title: note.title,
          config: note.config,
        },
        references,
        // FIXME: The link is not correct. Needs to resolve the path correctly.
        referenceHtmls: references.map((reference) => {
          const tokens = [reference.parentToken ?? reference.token];
          const html = this.md.renderer.render(tokens, this.md.options, {});
          return html;
        }),
      });
    }

    return backlinks;
  }

  public async getReferences(
    noteFilePath: string,
    backlinkedNoteFilePath: string,
  ) {
    return this.referenceMap.getReferences(
      this.resolveNoteRelativePath(noteFilePath),
      this.resolveNoteRelativePath(backlinkedNoteFilePath),
    );
  }

  async processNoteMentionsAndMentionedBy(filePath: string) {
    const note = await this.getNote(filePath);
    if (!note) {
      return;
    }
    // Get mentions
    const tokens = this.md.parse(note.markdown, {});

    /**
     * Change the link to path relative to the notebook directory
     * @param link
     * @returns
     */
    const resolveLink = (link: string) => {
      // If the link has no file extension, apply the configured
      // wikilink default (`.md` by default, but configurable so a
      // notebook using `.markdown` or another extension keeps its
      // own convention).  Don't blindly tack `.md` onto links that
      // already have ANY extension — that's how `note.markdown` or
      // `image.jpg` used to become `note.markdown.md` / `image.jpg.md`.
      if (!path.extname(link)) {
        link = link + this.config.wikiLinkTargetFileExtension;
      }
      if (link.startsWith('/')) {
        return path.relative(
          this.notebookPath.fsPath,
          path.join(this.notebookPath.fsPath, '.' + link),
        );
      } else {
        return path.relative(
          this.notebookPath.fsPath,
          path.join(
            path.dirname(path.join(this.notebookPath.fsPath, note.filePath)),
            link,
          ),
        );
      }
    };

    const addFileProtocol = (link: string) => {
      return Utils.joinPath(this.notebookPath, link).toString();
    };

    const traverse = (
      tokens: Token[],
      parentToken: Token | null,
      results: Reference[],
      level: number,
    ): Reference[] => {
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === 'wikilink') {
          // TODO: Support normal links
          const r = this.processWikilink(token.content);
          const { text } = r;
          const rawLink = r.link; // may include `#heading` and/or `^block`

          if (rawLink.match(/https?:\/\//)) {
            // TODO: Ignore more protocols
            continue;
          }

          // Split the file part from any URL fragment.  Without this
          // step, processWikilink-output like 'README.md#^abc' would
          // get '.md' tacked on by resolveLink (which only checks
          // endsWith('.md')) — producing phantom referenceMap keys
          // like 'README.md#^abc.md' that show up as ghost nodes in
          // the graph view and click-through to nonexistent files.
          const fragmentMarker = rawLink.match(/[#^]/);
          const fileLink = fragmentMarker
            ? rawLink.slice(0, fragmentMarker.index)
            : rawLink;
          const fragment = fragmentMarker
            ? rawLink.slice(fragmentMarker.index)
            : '';

          // Skip non-markdown attachments (images, PDFs, …).  They
          // aren't notes — they shouldn't be graph nodes or appear
          // in the backlinks panel.  Click-through still works
          // because the host extension resolves the wikilink target
          // independently; the indexing layer is what we're filtering
          // here.
          const ext = path.extname(fileLink);
          if (ext && !this.config.markdownFileExtensions.includes(ext)) {
            continue;
          }

          // Resolve to a notebook-relative file path (the index key)
          // and reattach the fragment for the URL embedded in the
          // token content (so the renderer's `<a href>` still
          // navigates to the right heading / block).
          const resolvedFile = resolveLink(fileLink);
          const resolvedFull = resolvedFile + fragment;
          if (this.config.useGitHubStylePipedLink) {
            token.content = `${text} | ${addFileProtocol(resolvedFull)}`;
          } else {
            token.content = `${addFileProtocol(resolvedFull)} | ${text}`;
          }

          results.push({
            elementId: token.attrGet('id') || '',
            text,
            link: resolvedFile, // referenceMap key — bare file path
            parentToken,
            token,
            kind: 'wikilink',
          });
        } else if (token.type === 'tag') {
          // Tags are notebook-global metadata: don't synthesise a fake
          // file path the way wikilinks do.  link='' here; the caller
          // routes by kind into the tagReferenceMap.
          const text = token.content.trim();
          results.push({
            elementId: token.attrGet('id') || '',
            text,
            link: '',
            parentToken,
            token,
            kind: 'tag',
          });
        } else if (
          token.type === 'link_open' &&
          tokens[i + 1] &&
          tokens[i + 1].type === 'text'
        ) {
          if (token.attrs?.length && token.attrs[0][0] === 'href') {
            let link = decodeURI(token.attrs[0][1]);
            const text = tokens[i + 1].content.trim();
            // Accept any of the configured markdownFileExtensions, not
            // just literal `.md` — a notebook using `.markdown` /
            // `.mdx` / `.qmd` should still index its own links.
            const linkExt = path.extname(link).toLowerCase();
            if (
              link.match(/https?:\/\//) ||
              !text.length ||
              !this.config.markdownFileExtensions.includes(linkExt)
            ) {
              // TODO: Ignore more protocols
              continue;
            }

            // Replace the token href
            link = resolveLink(link);
            token.attrs[0][1] = addFileProtocol(link);

            results.push({
              elementId: token.attrGet('id') || '',
              text,
              link,
              parentToken,
              token,
              kind: 'link',
            });
          }
        } else if (token.children && token.children.length) {
          traverse(token.children, token, results, level + 1);
        }
      }
      return results;
    };

    const references = traverse(tokens, null, [], 0);
    const mentions: Mentions = {};
    const oldMentions = note.mentions;

    // Remove old file-level references
    for (const filePath in oldMentions) {
      this.referenceMap.deleteReferences(filePath, note.filePath);
    }
    // Remove old tag references for this note (rebuild from scratch)
    this.tagReferenceMap.deleteReferencesFrom(note.filePath);

    // Handle new references — dispatch by kind:
    //   'tag' → tagReferenceMap (global, not path-relative)
    //   anything else → referenceMap (per-file)
    for (let i = 0; i < references.length; i++) {
      const ref = references[i];
      if (ref.kind === 'tag') {
        this.tagReferenceMap.addReference(ref.text, note.filePath, ref);
        continue;
      }
      const { link } = ref;
      if (!link) continue;
      mentions[link] = true;
      this.referenceMap.addReference(link, note.filePath, ref);
    }

    // Add self to reference map to declare the existence of the file itself
    this.referenceMap.addReference(note.filePath, note.filePath, undefined);

    // Update the mentions
    note.mentions = mentions;
  }

  public async getNote(
    filePath: string,
    refreshNoteRelations: boolean = false,
  ): Promise<Note | null> {
    filePath = this.resolveNoteRelativePath(filePath);
    if (!refreshNoteRelations && filePath in this.notes) {
      return this.notes[filePath];
    }
    const absFilePath = this.resolveNoteAbsolutePath(filePath);
    let stats: FileSystemStats;
    try {
      stats = await this.fs.stat(absFilePath);
    } catch {
      return null;
    }
    if (
      stats.isFile() &&
      this.config.markdownFileExtensions.includes(path.extname(filePath))
    ) {
      // Skip oversized files so a checked-in 50 MB log/data dump
      // with a `.md` extension can't pin its full content (plus a
      // markdown-it token tree several × that size) in memory.
      // The caller can still open the file via wikilink click —
      // it's just not held by the in-memory index.
      const sizeLimit = this.config.maxNoteFileSize ?? 0;
      if (sizeLimit > 0 && stats.size > sizeLimit) {
        return null;
      }
      let markdown = (await this.fs.readFile(absFilePath)) as string;

      // Read the noteConfig, which is like <!-- note {...} --> at the end of the markdown file
      const noteConfig: NoteConfig = {
        createdAt: new Date(stats.ctimeMs),
        modifiedAt: new Date(stats.mtimeMs),
        aliases: [],
      };

      try {
        const data = matter(markdown);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const frontMatter: any = Object.assign({}, data.data);

        // New note config design in beta 3
        if (data.data['created']) {
          noteConfig.createdAt = new Date(data.data['created'] as string);
          delete frontMatter['created'];
        }
        if (data.data['modified']) {
          noteConfig.modifiedAt = new Date(data.data['modified'] as string);
          delete frontMatter['modified'];
        }
        if (data.data['pinned']) {
          noteConfig.pinned = data.data['pinned'] as boolean;
          delete frontMatter['pinned'];
        }
        if (data.data['favorited']) {
          noteConfig.favorited = data.data['favorited'] as boolean;
          delete frontMatter['favorited'];
        }
        if (data.data['icon']) {
          noteConfig.icon = data.data['icon'] as string;
          delete frontMatter['icon'];
        }
        if (data.data['aliases']) {
          const aliases = (data.data['aliases'] || []) as string[] | string;
          if (typeof aliases === 'string') {
            noteConfig.aliases = aliases.split(',').map((x) => x.trim());
          } else {
            noteConfig.aliases = aliases;
          }
          delete frontMatter['aliases'];
        }

        // markdown = matter.stringify(data.content, frontMatter); // <= NOTE: I think gray-matter has bug. Although I delete "note" section from front-matter, it still includes it.
        markdown = matterStringify(data.content, frontMatter);
      } catch {
        // Do nothing
        markdown =
          "Please fix front-matter. (👈 Don't forget to delete this line)\n\n" +
          markdown;
      }

      let oldMentions: Mentions = {};
      const oldNote = this.notes[filePath];
      if (oldNote) {
        oldMentions = oldNote.mentions;
      }

      // Create note
      const note: Note = {
        notebookPath: this.notebookPath,
        filePath: path.relative(this.notebookPath.fsPath, absFilePath),
        title: path.basename(absFilePath).replace(/\.md$/, ''),
        markdown,
        config: noteConfig,
        mentions: oldMentions,
      };

      if (refreshNoteRelations) {
        this.notes[note.filePath] = note;
        this.search.add(note.filePath, note.title, note.config.aliases);
        await this.processNoteMentionsAndMentionedBy(note.filePath);
      }

      return note;
    } else {
      return null;
    }
  }

  public async refreshNotesIfNotLoaded({
    dir = './',
    includeSubdirectories = false,
  }: RefreshNotesIfNotLoaded): Promise<Notes> {
    await this.refreshNotesIfNotLoadedMutex.runExclusive(async () => {
      if (!this.hasLoadedNotes) {
        await this.refreshNotes({
          dir,
          includeSubdirectories,
          refreshRelations: true,
        });
        this.hasLoadedNotes = true;
      }
    });
    return this.notes;
  }

  /** Try to load a .gitignore file from the given absolute directory path. */
  private async loadGitignoreForDir(
    dirAbsPath: string,
  ): Promise<Ignore | null> {
    try {
      const content = await this.fs.readFile(
        path.join(dirAbsPath, '.gitignore'),
      );
      return ignore().add(content);
    } catch {
      // No .gitignore in this directory, or unreadable — that's fine.
      return null;
    }
  }

  public async refreshNotes(args: RefreshNotesArgs): Promise<Notes> {
    return this.refreshNotesMutex.runExclusive(async () => {
      const { refreshRelations = true } = args;
      if (refreshRelations) {
        this.notes = {};
        this.referenceMap = new ReferenceMap();
        this.tagReferenceMap = new TagReferenceMap();
        this.search = new Search();
      }
      await this._refreshNotesInternal({ ...args, refreshRelations: false });
      if (refreshRelations) {
        for (const filePath in this.notes) {
          await this.processNoteMentionsAndMentionedBy(filePath);
        }
      }
      return this.notes;
    });
  }

  private async _refreshNotesInternal({
    dir = './',
    includeSubdirectories = false,
    gitignoreStack = [],
  }: RefreshNotesInternalArgs): Promise<void> {
    const dirAbsPath = path.resolve(this.notebookPath.fsPath, dir);

    // Normalize to a forward-slash path relative to the notebook root
    // (POSIX separators required by the `ignore` package).
    const normalizedDir = path
      .relative(this.notebookPath.fsPath, dirAbsPath)
      .replace(/\\/g, '/');

    // Load .gitignore from this directory and push onto the stack.
    const localIg = await this.loadGitignoreForDir(dirAbsPath);
    const currentStack: Array<{ ig: Ignore; base: string }> = localIg
      ? [...gitignoreStack, { ig: localIg, base: normalizedDir || '.' }]
      : gitignoreStack;

    /**
     * Returns true if `relPath` (relative to notebook root, forward-slash)
     * should be excluded by any .gitignore in the current stack.
     *
     * Each .gitignore instance is checked with the path made relative to its
     * own directory, matching standard git semantics (patterns in a nested
     * .gitignore are relative to that directory, not the repo root).
     */
    const isIgnoredByGitignore = (relPath: string): boolean => {
      for (const { ig, base } of currentStack) {
        const relFromBase =
          base === '.' || base === ''
            ? relPath
            : path.posix.relative(base, relPath);
        // Skip if relPath is outside this .gitignore's directory.
        if (relFromBase.startsWith('..')) {
          continue;
        }
        if (ig.ignores(relFromBase)) {
          return true;
        }
      }
      return false;
    };

    let files: string[];
    try {
      files = await this.fs.readdir(dirAbsPath);
    } catch (error) {
      console.error(error);
      files = [];
    }
    const subdirPromises: Promise<void>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Always skip .git and node_modules regardless of .gitignore.
      if (file.match(/^(node_modules|\.git)$/)) {
        continue;
      }

      const absFilePath = path.resolve(dirAbsPath, file);
      const relFromNotebook = path
        .relative(this.notebookPath.fsPath, absFilePath)
        .replace(/\\/g, '/');

      // Respect .gitignore rules.
      if (currentStack.length > 0 && isIgnoredByGitignore(relFromNotebook)) {
        continue;
      }

      const note = await this.getNote(
        path.relative(this.notebookPath.fsPath, absFilePath),
      );
      if (note) {
        this.notes[note.filePath] = note;
        this.search.add(note.filePath, note.title, note.config.aliases);
      }

      let stats;
      try {
        stats = await this.fs.stat(absFilePath);
      } catch (error) {
        console.error(error);
      }
      if (stats && stats.isDirectory() && includeSubdirectories) {
        subdirPromises.push(
          this._refreshNotesInternal({
            dir: path.relative(this.notebookPath.fsPath, absFilePath),
            includeSubdirectories,
            gitignoreStack: currentStack,
          }),
        );
      }
    }
    await Promise.all(subdirPromises);
  }

  /*
  // NOTE: This function is hidden for now.  
  public async writeNote(
    filePath: string,
    markdown: string,
    noteConfig: NoteConfig,
  ): Promise<Note | null> {
    // noteConfig.modifiedAt = new Date();
    const oMarkdown = markdown;
    try {
      const data = matter(markdown);
      // if (data.data['note'] && data.data['note'] instanceof Object) {
      //   noteConfig = Object.assign({}, noteConfig, data.data['note'] || {});
      // }
      const frontMatter = Object.assign(data.data || {}, noteConfig);
      // delete frontMatter['note'];
      const aliases = frontMatter['aliases'];
      if (!aliases || !aliases.length) {
        delete frontMatter['aliases'];
      }
      markdown = data.content;
      markdown = matterStringify(markdown, frontMatter);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      markdown = matterStringify(markdown, noteConfig as any);
    }

    await this.fs.writeFile(this.resolveNoteAbsolutePath(filePath), markdown);

    const note = await this.getNote(filePath, true);
    if (note) {
      note.markdown = oMarkdown;
    }
    return note;
  }
  */

  public async removeNoteRelations(filePath: string) {
    const note = await this.getNote(filePath);
    if (!note) {
      return;
    }
    // Drop any tag references this note contributed.
    this.tagReferenceMap.deleteReferencesFrom(note.filePath);
    const mentions = note.mentions;
    for (const filePath in mentions) {
      this.referenceMap.deleteReferences(filePath, note.filePath);
    }
    delete this.notes[note.filePath];
  }

  public async deleteNote(filePath: string, alreadyDeleted: boolean = false) {
    const absFilePath = this.resolveNoteAbsolutePath(filePath);
    if (alreadyDeleted || (await this.fs.exists(absFilePath))) {
      await this.fs.unlink(absFilePath);
      await this.removeNoteRelations(filePath);
      this.search.remove(filePath);
    }
  }

  /**
   * // NOTE: This function is hidden for now.
  public async duplicateNote(filePath: string) {
    const oldNote = await this.getNote(filePath);
    if (!oldNote) return;
    const noteConfig = oldNote.config;
    noteConfig.createdAt = new Date();
    noteConfig.modifiedAt = new Date();
    const newFilePath = filePath.replace(/\.md$/, '.copy.md');
    await this.writeNote(newFilePath, oldNote.markdown, noteConfig);
    return await this.getNote(newFilePath, true);
  }
  */

  /**
   * Get the absolute path of the note
   * @param filePath
   * @returns
   */
  public resolveNoteAbsolutePath(filePath: string) {
    if (path.isAbsolute(filePath)) {
      return filePath;
    } else {
      return path.resolve(this.notebookPath.fsPath, filePath);
    }
  }

  /**
   * Get the relative path of the note to the notebook directory
   * @param filePath
   * @returns
   */
  public resolveNoteRelativePath(filePath: string) {
    if (path.isAbsolute(filePath)) {
      return path.relative(this.notebookPath.fsPath, filePath);
    } else {
      return filePath;
    }
  }

  // -------------------------------------------------
  // Functions below are for markdown engine

  public getNoteMarkdownEngine(filePath: string) {
    filePath = this.resolveNoteRelativePath(filePath);
    if (!(filePath in this.markdownEngines)) {
      this.markdownEngines[filePath] = new MarkdownEngine({
        notebook: this,
        filePath: this.resolveNoteAbsolutePath(filePath),
      });
    }
    return this.markdownEngines[filePath];
  }

  public getNoteMarkdownEngines() {
    return this.markdownEngines;
  }

  public clearAllNoteMarkdownEngineCaches() {
    for (const filePath in this.markdownEngines) {
      this.markdownEngines[filePath].clearCaches();
    }
  }

  /**
   * Process wiki link
   * @param content content is string like "Test", "test.md | Test"
   * @returns
   */
  public processWikilink(content: string): {
    text: string;
    link: string;
    hash?: string;
    blockRef?: string;
  } {
    const splits = content.split('|');
    let link: string;
    let text: string;
    if (splits.length === 1) {
      text = splits[0].trim();
      link = text;
    } else {
      if (this.config.useGitHubStylePipedLink) {
        text = splits[0].trim();
        link = splits[1].trim();
      } else {
        text = splits[1].trim();
        link = splits[0].trim();
      }
    }

    // parse hash and block reference from link
    // Support: [[note#heading]], [[note^block-id]], [[note#heading^block-id]]
    const hashIndex = link.lastIndexOf('#');
    const blockRefIndex = link.lastIndexOf('^');
    let hash = '';
    let blockRef = '';
    if (hashIndex >= 0 && blockRefIndex >= 0 && blockRefIndex > hashIndex) {
      hash = link.slice(hashIndex, blockRefIndex);
      blockRef = link.slice(blockRefIndex);
      link = link.slice(0, hashIndex);
    } else if (hashIndex >= 0) {
      hash = link.slice(hashIndex);
      link = link.slice(0, hashIndex);
    } else if (blockRefIndex >= 0) {
      blockRef = link.slice(blockRefIndex);
      link = link.slice(0, blockRefIndex);
    }

    // transform file name if needed
    const parsed = path.parse(link);
    let fileName = parsed.name;
    let fileExtension = parsed.ext;

    // NOTE: The approach below might not work well for
    // link like `0.7.4` as `.4` is detected as the file extension.
    if (fileExtension.match(/^\.\d+$/)) {
      fileName += fileExtension;
      fileExtension = '';
    }

    if (
      this.config.wikiLinkTargetFileNameChangeCase !== 'none' &&
      this.config.wikiLinkTargetFileNameChangeCase in caseAnything
    ) {
      fileName =
        caseAnything[this.config.wikiLinkTargetFileNameChangeCase](fileName);
    }
    if (!fileExtension) {
      fileExtension = this.config.wikiLinkTargetFileExtension;
    }
    link = path.join(parsed.dir, fileName + fileExtension);
    if (hash) {
      link += hash;
    }
    if (blockRef) {
      link += blockRef;
    }

    return { link, text, hash, blockRef };
  }
}
