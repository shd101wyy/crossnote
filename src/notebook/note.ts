import { URI } from 'vscode-uri';

export type FilePath = string;

export interface NoteConfigEncryption {
  title: string;
  // method: string;? // Default AES256
}

export interface NoteConfig {
  createdAt: Date;
  modifiedAt: Date;
  pinned?: boolean;
  favorited?: boolean;
  icon?: string;
  aliases?: string[];
}

export type Mentions = Record<string, boolean>;

export interface Note {
  /**
   * Absolute path to the notebook.
   */
  notebookPath: URI;
  /**
   * Relative path to the note file from the notebook.
   */
  filePath: FilePath;
  /**
   * Note title.
   */
  title: string;
  /**
   * Note content.  Optional: the in-memory `Notebook.notes` cache evicts
   * `markdown` after extracting mentions / tags, so a note returned by
   * `Notebook.getNote(...)` may have `markdown` undefined.  Use
   * `Notebook.getNoteMarkdown(filePath)` to lazy-load the body from
   * disk on demand — that's the only call site guaranteed to return
   * the current file content without keeping every note's full text
   * resident.
   */
  markdown?: string;
  /**
   * Note config.
   */
  config: NoteConfig;
  /**
   * @param key: mentioned note file path
   */
  mentions: Mentions;
}

export interface Notes {
  [key: string]: Note;
}

export function getNoteIcon(note: Note) {
  if (note.config.icon) {
    return note.config.icon;
  } else {
    return ':memo:';
  }
}
