import { Mutex } from 'async-mutex';
import * as caseAnything from 'case-anything';
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
import useMarkdownAdmonition from '../custom-markdown-it-features/admonition';
import useMarkdownItCodeFences from '../custom-markdown-it-features/code-fences';
import useMarkdownItCriticMarkup from '../custom-markdown-it-features/critic-markup';
import useMarkdownItCurlyBracketAttributes from '../custom-markdown-it-features/curly-bracket-attributes';
import useMarkdownItEmoji from '../custom-markdown-it-features/emoji';
import useMarkdownItHTML5Embed from '../custom-markdown-it-features/html5-embed';
import useMarkdownItMath from '../custom-markdown-it-features/math';
import useMarkdownItSourceMap from '../custom-markdown-it-features/sourcemap';
import useMarkdownItWidget from '../custom-markdown-it-features/widget';
import useMarkdownItWikilink from '../custom-markdown-it-features/wikilink';
import { MarkdownEngine } from '../markdown-engine';
import { replaceVariablesInString } from '../utility';
import { loadConfigsInDirectory, wrapNodeFSAsApi } from './config-helper';
import { matter, matterStringify } from './markdown';
import { FilePath, Mentions, Note, NoteConfig, Notes } from './note';
import { Reference, ReferenceMap } from './reference';
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

export class Notebook {
  public notebookPath: URI;
  public config: NotebookConfig;
  public fs: FileSystemApi;

  public notes: Notes = {};
  public hasLoadedNotes: boolean = false;
  public referenceMap: ReferenceMap = new ReferenceMap();
  private refreshNotesIfNotLoadedMutex: Mutex = new Mutex();

  private search: Search = new Search();

  public md: MarkdownIt;
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
    useMarkdownItCurlyBracketAttributes(md);
    useMarkdownItCriticMarkup(md, this);
    useMarkdownItEmoji(md, this);
    useMarkdownItHTML5Embed(md, this);
    useMarkdownItMath(md, this);
    useMarkdownItWikilink(md, this);
    useMarkdownAdmonition(md);
    useMarkdownItSourceMap(md);
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
    this.config.plantumlJarPath = replaceVariablesInString(
      this.config.plantumlJarPath,
      replacements,
    );
  }

  public async getBacklinkedNotes(filePath: string): Promise<Notes> {
    filePath = this.resolveNoteRelativePath(filePath);
    if (filePath in this.referenceMap.map) {
      const map = this.referenceMap.map[filePath];
      const notes: Notes = {};
      for (const rFilePath in map) {
        if (rFilePath === filePath) {
          // Don't include self
          continue;
        }
        const note = await this.getNote(rFilePath);
        if (note) {
          notes[rFilePath] = note;
        }
      }
      return notes;
    } else {
      return {};
    }
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
      if (!link.endsWith('.md')) {
        link = link + '.md';
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
          let { link } = r;

          if (link.match(/https?:\/\//)) {
            // TODO: Ignore more protocols
            continue;
          }

          // Replace the token content
          link = resolveLink(link);
          if (this.config.useGitHubStylePipedLink) {
            token.content = `${text} | ${addFileProtocol(link)}`;
          } else {
            token.content = `${addFileProtocol(link)} | ${text}`;
          }

          // console.log("find link token: ", token, parentToken);
          results.push({
            elementId: token.attrGet('id') || '',
            text,
            link, // resolveLink(link),
            parentToken,
            token,
          });
        } else if (token.type === 'tag') {
          const text = token.content.trim();
          const link = token.content.trim();
          // console.log("find link token: ", token, parentToken);
          results.push({
            elementId: token.attrGet('id') || '',
            text,
            link: resolveLink(link),
            parentToken,
            token,
          });
        } else if (
          token.type === 'link_open' &&
          tokens[i + 1] &&
          tokens[i + 1].type === 'text'
        ) {
          if (token.attrs?.length && token.attrs[0][0] === 'href') {
            let link = decodeURI(token.attrs[0][1]);
            const text = tokens[i + 1].content.trim();
            if (
              link.match(/https?:\/\//) ||
              !text.length ||
              !link.endsWith('.md')
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
            });
          }
        } else if (token.children && token.children.length) {
          traverse(token.children, token, results, level + 1);
        }
      }
      return results;
    };

    const references = traverse(tokens, null, [], 0);
    const mentions: Mentions = new Set<FilePath>();
    const oldMentions = note.mentions;

    // Remove old references
    for (const filePath in oldMentions) {
      this.referenceMap.deleteReferences(filePath, note.filePath);
    }

    // Handle new references
    for (let i = 0; i < references.length; i++) {
      const { link } = references[i];
      mentions[link] = true;
      this.referenceMap.addReference(link, note.filePath, references[i]);
    }

    // Add self to reference map to declare the existence of the file itself
    this.referenceMap.addReference(note.filePath, note.filePath, undefined);

    // Update the mentions
    note.mentions = mentions;
  }

  public async getNote(
    filePath: string,
    refreshNoteRelations = false,
  ): Promise<Note | null> {
    filePath = this.resolveNoteRelativePath(filePath);
    if (!refreshNoteRelations && filePath in this.notes) {
      return this.notes[filePath];
    }
    const absFilePath = this.resolveNoteAbsolutePath(filePath);
    let stats: FileSystemStats;
    try {
      stats = await this.fs.stat(absFilePath);
    } catch (error) {
      return null;
    }
    if (
      stats.isFile() &&
      this.config.markdownFileExtensions.includes(path.extname(filePath))
    ) {
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
      } catch (error) {
        // Do nothing
        markdown =
          "Please fix front-matter. (👈 Don't forget to delete this line)\n\n" +
          markdown;
      }

      let oldMentions: Mentions = new Set<FilePath>();
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

  public async refreshNotes({
    dir = './',
    includeSubdirectories = false,
    refreshRelations = true,
  }: RefreshNotesArgs): Promise<Notes> {
    if (refreshRelations) {
      this.notes = {};
      this.referenceMap = new ReferenceMap();
      this.search = new Search();
    }
    let files: string[] = [];
    try {
      files = await this.fs.readdir(
        path.resolve(this.notebookPath.fsPath, dir),
      );
    } catch (error) {
      console.error(error);
      files = [];
    }
    const refreshNotesPromises: Promise<Notes>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // TODO: Check .gitignore
      // ignore several directories
      if (file.match(/^(node_modules|\.git)$/)) {
        continue;
      }

      const absFilePath = path.resolve(this.notebookPath.fsPath, dir, file);
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
        refreshNotesPromises.push(
          this.refreshNotes({
            dir: path.relative(this.notebookPath.fsPath, absFilePath),
            includeSubdirectories,
            refreshRelations: false,
          }),
        );
      }
    }
    await Promise.all(refreshNotesPromises);

    if (refreshRelations) {
      for (const filePath in this.notes) {
        await this.processNoteMentionsAndMentionedBy(filePath);
      }
    }

    return this.notes;
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
    const mentions = note.mentions;
    for (const filePath in mentions) {
      this.referenceMap.deleteReferences(filePath, note.filePath);
    }
    delete this.notes[note.filePath];
  }

  public async deleteNote(filePath: string, alreadyDeleted = false) {
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
  public processWikilink(content: string): { text: string; link: string } {
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

    // parse hash from link
    const hashIndex = link.lastIndexOf('#');
    let hash = '';
    if (hashIndex >= 0) {
      hash = link.slice(hashIndex);
      link = link.slice(0, hashIndex);
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

    return { link, text };
  }
}
