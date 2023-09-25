// const loadLanguages = require("prismjs/components/");
// loadLanguages(["python"]);

import { JsonObject } from 'type-fest';
import * as YAML from 'yaml';

export const TagStopRegExp = /[@#,.!$%^&*()[\]-_+=~`<>?\\，。]/g;
export function getTags(markdown: string): string[] {
  const tags = new Set(
    markdown.match(
      /(#([^#]+?)#[\s@#,.!$%^&*()[\]-_+=~`<>?\\，。])|(#[^\s@#,.!$%^&*()[\]-_+=~`<>?\\，。]+)/g,
    ) || [],
  );
  return Array.from(tags).map(
    (tag) => tag.replace(TagStopRegExp, '').trim(), // Don't remove \s here
  );
}

export function sanitizeTag(tagName: string): string {
  const tag = tagName.trim() || '';
  return tag
    .replace(/\s+/g, ' ')
    .replace(TagStopRegExp, '')
    .split('/')
    .map((t) => t.trim())
    .filter((x) => x.length > 0)
    .join('/');
}

export function sanitizeNoteTitle(noteTitle: string): string {
  return sanitizeTag(noteTitle);
}

export interface MatterOutput {
  data: JsonObject;
  content: string;
}

export function matter(markdown: string): MatterOutput {
  let endFrontMatterOffset = 0;
  let frontMatter = {};
  if (
    markdown.startsWith('---') &&
    /* tslint:disable-next-line:no-conditional-assignment */
    (endFrontMatterOffset = markdown.indexOf('\n---')) > 0
  ) {
    const frontMatterString = markdown.slice(3, endFrontMatterOffset);
    try {
      frontMatter = YAML.parse(frontMatterString);
    } catch {
      frontMatter = {};
    }
    markdown = markdown
      .slice(endFrontMatterOffset + 4)
      .replace(/^[ \t]*\n/, '');
  }
  return {
    data: frontMatter,
    content: markdown,
  };
}

export function matterStringify(markdown: string, frontMatter: JsonObject) {
  frontMatter = frontMatter || {};
  const yamlStr = YAML.stringify(frontMatter).trim();
  if (yamlStr === '{}' || !yamlStr) {
    return markdown;
  } else {
    return `---
${yamlStr}
---
${markdown}`;
  }
}
