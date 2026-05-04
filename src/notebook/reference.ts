import Token from 'markdown-it/lib/token';

/**
 * What kind of source produced this reference.
 *   'wikilink' — `[[Note]]` / `![[Note]]` / `[[Note#H]]` / `[[Note^abc]]`
 *   'link'     — standard markdown link `[text](Note.md)`
 *   'tag'      — Obsidian-style `#tag` mention
 */
export type ReferenceKind = 'wikilink' | 'link' | 'tag';

export interface Reference {
  /**
   * The id of the referenced element
   */
  elementId: string;
  parentToken: Token | null;
  token: Token;
  text: string;
  /**
   * For 'wikilink' / 'link' references: the resolved file path
   * (relative to the notebook root) of the target note.  For 'tag'
   * references: empty string — the tag identity is in `text`.
   */
  link: string;
  kind?: ReferenceKind;
}

export class ReferenceMap {
  public map: { [key: string]: { [key: string]: Reference[] } };
  constructor() {
    this.map = {};
  }

  public addReference(
    noteFilePath: string,
    referredByNoteFilePath: string,
    reference?: Reference,
  ) {
    if (noteFilePath === referredByNoteFilePath && !reference) {
      if (!(noteFilePath in this.map)) {
        this.map[noteFilePath] = {
          [referredByNoteFilePath]: [],
        };
      }
      return;
    }
    if (!reference) {
      return;
    }
    if (noteFilePath in this.map) {
      const mentionedBys = this.map[noteFilePath];
      if (referredByNoteFilePath in mentionedBys) {
        mentionedBys[referredByNoteFilePath].push(reference);
      } else {
        mentionedBys[referredByNoteFilePath] = [reference];
      }
    } else {
      this.map[noteFilePath] = {
        [referredByNoteFilePath]: [reference],
      };
    }
  }

  public deleteReferences(
    noteFilePath: string,
    referredByNoteFilePath: string,
  ) {
    if (noteFilePath === referredByNoteFilePath) {
      delete this.map[noteFilePath];
      return;
    }
    if (noteFilePath in this.map) {
      if (referredByNoteFilePath in this.map[noteFilePath]) {
        delete this.map[noteFilePath][referredByNoteFilePath];
        if (Object.keys(this.map[noteFilePath]).length === 0) {
          delete this.map[noteFilePath];
        }
      }
    }
  }

  public hasRelation(filePath1: string, filePath2: string) {
    return (
      (filePath1 in this.map && filePath2 in this.map[filePath1]) ||
      (filePath2 in this.map && filePath1 in this.map[filePath2]) ||
      filePath1 === filePath2
    );
  }

  public getReferences(
    noteFilePath: string,
    referredByNoteFilePath: string,
  ): Reference[] {
    if (noteFilePath in this.map) {
      if (referredByNoteFilePath in this.map[noteFilePath]) {
        return this.map[noteFilePath][referredByNoteFilePath];
      }
    }
    return [];
  }

  public noteHasReferences(filePath: string): boolean {
    return filePath in this.map;
  }

  public getReferredByNotesCount(noteFilePath: string): number {
    if (noteFilePath in this.map) {
      let length = Object.keys(this.map[noteFilePath]).length;
      if (noteFilePath in this.map[noteFilePath]) {
        length -= 1;
      }
      return length;
    } else {
      return 0;
    }
  }
}

/**
 * Tracks `#tag` mentions across the notebook as global metadata
 * (independent of the file system).
 *
 * Tags are stored case-folded so `#MyTag` and `#mytag` collapse to one
 * entry, matching how most note tools behave.  Original casing is
 * preserved on the Reference token for display.
 *
 * Conceptually parallel to ReferenceMap but with a flat tag → notes
 * shape — there is no "target file" for a tag, only a name.
 */
export class TagReferenceMap {
  // tag (lowercased) → referrer file path → list of references on that line
  public map: Map<string, Map<string, Reference[]>> = new Map();

  public addReference(tag: string, referrerFilePath: string, ref: Reference) {
    const key = tag.toLowerCase();
    let perFile = this.map.get(key);
    if (!perFile) {
      perFile = new Map();
      this.map.set(key, perFile);
    }
    const refs = perFile.get(referrerFilePath);
    if (refs) {
      refs.push(ref);
    } else {
      perFile.set(referrerFilePath, [ref]);
    }
  }

  /**
   * Drop every reference for which `referrerFilePath` is the source —
   * called when re-processing a note after it's been edited.
   */
  public deleteReferencesFrom(referrerFilePath: string) {
    for (const [tag, perFile] of this.map) {
      if (perFile.delete(referrerFilePath) && perFile.size === 0) {
        this.map.delete(tag);
      }
    }
  }

  public getReferrers(tag: string): Map<string, Reference[]> {
    return this.map.get(tag.toLowerCase()) ?? new Map();
  }

  public getAllTags(): string[] {
    return Array.from(this.map.keys());
  }
}
