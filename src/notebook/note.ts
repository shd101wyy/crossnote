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

export type Mentions = { [key: string]: boolean };

export interface Note {
  /**
   * Absolute path to the notebook
   */
  notebookPath: string;
  /**
   * Relative path to the note file
   */
  filePath: FilePath;
  /**
   * Note title
   */
  title: string;
  /**
   * Note content
   */
  markdown: string;
  /**
   * Note config
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
