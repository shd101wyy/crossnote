import { Mutex } from 'async-mutex';
import MarkdownIt from 'markdown-it';
import Token from 'markdown-it/lib/token.js';
import * as path from 'path';
import { matter, matterStringify } from './markdown.js';
import { Mentions, Note, NoteConfig, Notes } from './note';
import { Reference, ReferenceMap } from './reference';
import Search from './search';
import { FileSystemApi, IS_NODE } from './types';

export * from './types';

const md = new MarkdownIt();

interface CrossnoteConfig {
  _: string;
}

interface CrossnoteArgs {
  notebookPath: string;
  config: CrossnoteConfig;
  fs?: FileSystemApi;
}

interface RefreshNotesArgs {
  /**
   * Relative path to the notebook
   */
  dir: string;
  includeSubdirectories?: boolean;
  refreshRelations?: boolean;
}

export class Notebook {
  private notebookPath: string;
  // private config: CrossnoteConfig;
  private fs: FileSystemApi;

  public notes: Notes = {};
  public hasLoadedNotes: boolean = false;
  public referenceMap: ReferenceMap = new ReferenceMap();
  public search: Search = new Search();
  private refreshNotesIfNotLoadedMutex: Mutex = new Mutex();

  private constructor() {}

  private async init({ notebookPath, fs }: CrossnoteArgs) {
    // Check if workspaceFolder is absolute path
    if (!path.isAbsolute(notebookPath)) {
      throw new Error('`workspaceFolder` must be an absolute path');
    }
    this.notebookPath = notebookPath;
    // this.config = config;

    await this.initFs(fs);
  }

  public static async init(args: CrossnoteArgs) {
    const crossnote = new Notebook();
    await crossnote.init(args);
    return crossnote;
  }

  async initFs(_fs?: FileSystemApi) {
    if (_fs) {
      this.fs = _fs;
    } else {
      if (IS_NODE) {
        const fs = await import('fs');
        const fsPromises = fs.promises;
        this.fs = {
          readFile: async (
            _path: string,
            encoding: BufferEncoding = 'utf-8',
          ) => {
            return (await fsPromises.readFile(_path, encoding)).toString();
          },
          writeFile: async (
            _path: string,
            content: string,
            encoding: BufferEncoding = 'utf8',
          ) => {
            return await fsPromises.writeFile(_path, content, encoding);
          },
          mkdir: async (_path: string) => {
            await fsPromises.mkdir(_path, { recursive: true });
          },
          exists: async (_path: string) => {
            return fs.existsSync(_path);
          },
          stat: async (_path: string) => {
            return await fsPromises.stat(_path);
          },
          readdir: async (_path: string) => {
            return await fsPromises.readdir(_path);
          },
          unlink: async (_path: string) => {
            return await fsPromises.unlink(_path);
          },
        };
      } else {
        throw new Error('`fs` is required');
      }
    }
  }

  public async getBacklinkedNotes(filePath: string): Promise<Notes> {
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

  public async getReferences(
    noteFilePath: string,
    backlinkedNoteFilePath: string,
  ) {
    return this.referenceMap.getReferences(
      noteFilePath,
      backlinkedNoteFilePath,
    );
  }

  async processNoteMentionsAndMentionedBy(filePath: string) {
    const note = await this.getNote(filePath);
    if (!note) {
      return;
    }
    // Get mentions
    const tokens = md.parse(note.markdown, {});
    const resolveLink = (link: string) => {
      if (!link.endsWith('.md')) {
        link = link + '.md';
      }
      if (link.startsWith('/')) {
        return path.relative(
          this.notebookPath,
          path.join(this.notebookPath, '.' + link),
        );
      } else {
        return path.relative(
          this.notebookPath,
          path.join(
            path.dirname(path.join(this.notebookPath, note.filePath)),
            link,
          ),
        );
      }
    };
    const traverse = function(
      tokens: Token[],
      parentToken: Token | null,
      results: Reference[],
      level: number,
    ): Reference[] {
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === 'wikilink') {
          // TODO: Support normal links
          const arr = token.content.split('|');
          const text = (arr.length > 1 ? arr[1] : arr[0]).trim();
          const link = arr[0].trim();
          if (link.match(/https?:\/\//)) {
            // TODO: Ignore more protocols
            continue;
          }
          // console.log("find link token: ", token, parentToken);
          results.push({
            elementId: token.attrGet('id') || '',
            text,
            link: resolveLink(link),
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
            const link = decodeURI(token.attrs[0][1]);
            const text = tokens[i + 1].content.trim();
            if (
              link.match(/https?:\/\//) ||
              !text.length ||
              !link.endsWith('.md')
            ) {
              // TODO: Ignore more protocols
              continue;
            }
            results.push({
              elementId: token.attrGet('id') || '',
              text,
              link: resolveLink(link),
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
    const mentions: Mentions = {};
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
    if (!refreshNoteRelations && filePath in this.notes) {
      return this.notes[filePath];
    }
    const absFilePath = path.resolve(this.notebookPath, filePath);
    let stats;
    try {
      stats = await this.fs.stat(absFilePath);
    } catch (error) {
      return null;
    }
    if (stats.isFile() && filePath.endsWith('.md')) {
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
            noteConfig.aliases = aliases.split(',').map(x => x.trim());
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

      let oldMentions = {};
      const oldNote = this.notes[filePath];
      if (oldNote) {
        oldMentions = oldNote.mentions;
      }

      // Create note
      const note: Note = {
        notebookPath: this.notebookPath,
        filePath: path.relative(this.notebookPath, absFilePath),
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
  }: RefreshNotesArgs): Promise<Notes> {
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
      files = await this.fs.readdir(path.resolve(this.notebookPath, dir));
    } catch (error) {
      console.error(error);
      files = [];
    }
    const refreshNotesPromises: Promise<Notes>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // ignore several directories
      if (file.match(/^(node_modules|\.git)$/)) {
        continue;
      }

      const absFilePath = path.resolve(this.notebookPath, dir, file);
      const note = await this.getNote(
        path.relative(this.notebookPath, absFilePath),
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
            dir: path.relative(this.notebookPath, absFilePath),
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

  public async writeNote(
    filePath: string,
    markdown: string,
    noteConfig: NoteConfig,
  ): Promise<Note | null> {
    noteConfig.modifiedAt = new Date();
    const oMarkdown = markdown;
    try {
      const data = matter(markdown);
      if (data.data['note'] && data.data['note'] instanceof Object) {
        noteConfig = Object.assign({}, noteConfig, data.data['note'] || {});
      }
      const frontMatter = Object.assign(data.data || {}, noteConfig);
      delete frontMatter['note'];
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

    await this.fs.writeFile(
      path.resolve(this.notebookPath, filePath),
      markdown,
    );

    const note = await this.getNote(filePath, true);
    if (note) {
      note.markdown = oMarkdown;
    }
    return note;
  }

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

  public async deleteNote(filePath: string) {
    if (await this.fs.exists(path.resolve(this.notebookPath, filePath))) {
      await this.fs.unlink(path.resolve(this.notebookPath, filePath));
      await this.removeNoteRelations(filePath);
      this.search.remove(filePath);
    }
  }

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
}
