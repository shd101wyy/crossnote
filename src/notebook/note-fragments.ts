/**
 * Pure helpers for navigating wikilink fragments in note content.
 *
 *   - `extractBlockIds(text)`        — find every ` ^id` block marker
 *   - `extractHeadings(text)`        — find every ATX heading + slug
 *   - `findFragmentTargetLine(text, fragment)` — resolve a URL fragment
 *                                       (`^block` or `heading-slug`)
 *                                       to a 0-based line number
 *
 * Originally lived in vscode-markdown-preview-enhanced; moved here so
 * other crossnote hosts (web build, CLI, future integrations) can use
 * the same parsing rules without re-implementing them.  All functions
 * are pure (no I/O, no vscode types) — easy to unit-test.
 */
import HeadingIdGenerator from '../markdown-engine/heading-id-generator';

/**
 * Find every `^id` block marker in `text` and return `{ id, body }`
 * pairs in source order.  `body` is the line content with the trailing
 * ` ^id` stripped (handy for previews).  Duplicate IDs (the user
 * accidentally writing the same `^id` twice) are de-duplicated; only
 * the first occurrence is kept.
 *
 * Marker shape: ` ^[a-zA-Z0-9_-]+` at end of line.  Same form
 * crossnote's transformer produces for `^id` source markers, and the
 * form the host should write when generating new IDs.
 */
export function extractBlockIds(
  text: string,
): Array<{ id: string; body: string }> {
  const out: Array<{ id: string; body: string }> = [];
  const seen = new Set<string>();
  const re = /\s\^([a-zA-Z0-9_-]+)\s*$/;
  for (const line of text.split('\n')) {
    const m = re.exec(line);
    if (!m) continue;
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    out.push({ id: m[1], body: line.slice(0, m.index).trim() });
  }
  return out;
}

/**
 * Extract every ATX heading (`# Title`, `## Subtitle`, …) and return
 * `{ level, text, slug }` triples in source order.  `slug` is what
 * crossnote's HeadingIdGenerator produces — the value the click
 * resolver matches against — so this is what `[[Note#slug]]` should
 * link to and what completion providers should insert.
 *
 * Skips lines inside fenced code blocks (``` … ``` or ~~~ … ~~~) so
 * `# foo` inside a code sample doesn't become a phantom heading.
 *
 * If a heading has a trailing `{#explicit-id}` block-attribute span
 * (the syntax crossnote's curly-bracket-attributes plugin
 * recognises), it's stripped before slugifying so the slug matches
 * the heading text rather than the literal `{...}` block.
 */
export function extractHeadings(
  text: string,
): Array<{ level: number; text: string; slug: string }> {
  const out: Array<{ level: number; text: string; slug: string }> = [];
  const headingIdGenerator = new HeadingIdGenerator();
  const lines = text.split('\n');
  let inFence = false;
  let fenceMarker = '';
  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker[0]; // ` or ~
      } else if (marker[0] === fenceMarker) {
        inFence = false;
        fenceMarker = '';
      }
      continue;
    }
    if (inFence) continue;
    const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!headingMatch) continue;
    const level = headingMatch[1].length;
    const headingText = headingMatch[2].replace(/\s*\{[^}]+\}\s*$/, '').trim();
    if (!headingText) continue;
    const slug = headingIdGenerator.generateId(headingText);
    out.push({ level, text: headingText, slug });
  }
  return out;
}

/**
 * Resolve a wikilink-style URL fragment to a 0-based line number in
 * the given markdown source.  Tries, in order:
 *
 *   1. `^block-id` reference — matched against the LAST `^id` in the
 *      fragment, so combined `Heading^id` fragments still resolve to
 *      the block (block IDs are unique per file, so we ignore the
 *      heading prefix).
 *   2. Explicit `{#custom-id}` block-attribute span on a heading —
 *      mirrors what the curly-bracket-attributes plugin does at
 *      render time (`# Foo {#bar}` emits `<h1 id="bar">`), so a
 *      wikilink to `#bar` resolves to that heading line.
 *   3. Auto-generated heading slug — produced with
 *      HeadingIdGenerator so anchors like `#Setup` line up with how
 *      crossnote renders headings without explicit IDs.
 *
 * Returns -1 if no match.
 */
export function findFragmentTargetLine(text: string, fragment: string): number {
  if (!fragment) return -1;
  const lines = text.split('\n');

  const blockMatch = fragment.match(/\^([a-zA-Z0-9_-]+)$/);
  if (blockMatch) {
    const blockId = blockMatch[1];
    const re = new RegExp(`\\s\\^${blockId}\\s*$`);
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        return i;
      }
    }
  }

  // Explicit `{#id}` pass.  A heading like `## Foo {#bar}` renders as
  // `<h2 id="bar">`; the curly-bracket-attributes plugin extracts
  // `#bar` regardless of position inside `{...}` (works with
  // `{#bar .cls}`, `{.cls #bar}`, `{ #bar }`).  We mirror the same
  // permissive shape here.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.match(/^#+\s+/)) continue;
    const attrMatch = line.match(/\{([^}]+)\}\s*$/);
    if (!attrMatch) continue;
    // `(?:^|\s)#([a-zA-Z][\w-]*)` — `#` at start-of-curly or after
    // whitespace, followed by an identifier.  Avoids matching
    // `key=#value` or other accidental `#` placements.
    const idMatch = attrMatch[1].match(/(?:^|\s)#([a-zA-Z][\w-]*)/);
    if (!idMatch) continue;
    if (idMatch[1] === fragment) {
      return i;
    }
  }

  const headingIdGenerator = new HeadingIdGenerator();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^#+\s+/)) {
      // Strip the heading marker AND any trailing `{#explicit-id …}`
      // attribute span, the same way extractHeadings does.  Without
      // this, `## My Heading {#custom-id}` would slug to
      // `my-heading-custom-id` instead of `my-heading`, and a link to
      // `#my-heading` wouldn't resolve to it.
      const heading = line
        .replace(/^#+\s+/, '')
        .replace(/\s*\{[^}]+\}\s*$/, '')
        .trim();
      const headingId = headingIdGenerator.generateId(heading);
      if (headingId === fragment) {
        return i;
      }
    }
  }
  return -1;
}
