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
  // The note body lives on disk, not in this struct.  Use
  // `Notebook.getNoteMarkdown(filePath)` to fetch it on demand.  The
  // in-memory `Notebook.notes` cache holds metadata (title, aliases,
  // config) and the reference graph; the body would dominate cache
  // RSS for prose-heavy notebooks, so we read it lazily instead.
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
