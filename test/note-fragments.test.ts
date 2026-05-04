/**
 * Tests for the pure note-fragment helpers.
 *
 * Originally lived in vscode-markdown-preview-enhanced; consolidated
 * here when the helpers moved to crossnote so they're tested at the
 * library boundary instead of (only) at each host.
 */
import {
  extractBlockIds,
  extractHeadings,
  findFragmentTargetLine,
} from '../src/notebook/note-fragments';

describe('extractBlockIds', () => {
  it('returns [] for content with no block ids', () => {
    expect(extractBlockIds('Just some prose.\nNothing.')).toEqual([]);
  });

  it('finds a block id at end of paragraph', () => {
    const text = '# H\n\nFirst paragraph. ^abc\n\nNext.';
    expect(extractBlockIds(text)).toEqual([
      { id: 'abc', body: 'First paragraph.' },
    ]);
  });

  it('preserves source order', () => {
    const text = [
      'Line one. ^one',
      'Middle.',
      'Line two. ^two',
      'Line three. ^three',
    ].join('\n');
    expect(extractBlockIds(text).map((b) => b.id)).toEqual([
      'one',
      'two',
      'three',
    ]);
  });

  it('dedupes ids that appear more than once', () => {
    const text = 'First. ^abc\nSecond.\nThird. ^abc';
    const out = extractBlockIds(text);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({ id: 'abc', body: 'First.' });
  });

  it('does not match an inline ^id with non-whitespace before/after', () => {
    const text = 'Mention of ^abc in middle.\nReal block. ^abc';
    const out = extractBlockIds(text);
    expect(out).toHaveLength(1);
    expect(out[0].body).toBe('Real block.');
  });

  it('handles ids with hyphens, underscores and digits', () => {
    expect(extractBlockIds('Block. ^my-block_123')).toEqual([
      { id: 'my-block_123', body: 'Block.' },
    ]);
  });
});

describe('extractHeadings', () => {
  it('returns [] when there are no headings', () => {
    expect(extractHeadings('Just prose, no #.')).toEqual([]);
  });

  it('extracts ATX headings with text + slug', () => {
    const text = ['# Setup Guide', '', 'Body.', '', '## Configuration'].join(
      '\n',
    );
    expect(extractHeadings(text)).toEqual([
      { level: 1, text: 'Setup Guide', slug: 'setup-guide' },
      { level: 2, text: 'Configuration', slug: 'configuration' },
    ]);
  });

  it('strips trailing {#id} attribute spans before slugifying', () => {
    const out = extractHeadings('# Custom ID heading {#my-id}');
    expect(out).toHaveLength(1);
    expect(out[0].text).toBe('Custom ID heading');
  });

  it('disambiguates duplicate headings the way HeadingIdGenerator does', () => {
    const text = '# Setup\n\n# Setup\n\n# Setup';
    expect(extractHeadings(text).map((h) => h.slug)).toEqual([
      'setup',
      'setup-1',
      'setup-2',
    ]);
  });

  it('skips lines inside fenced code blocks', () => {
    const text = [
      '# Real heading',
      '',
      '```js',
      '# not a heading',
      '## also not',
      '```',
      '',
      '## Another real heading',
    ].join('\n');
    expect(extractHeadings(text).map((h) => h.text)).toEqual([
      'Real heading',
      'Another real heading',
    ]);
  });

  it('handles all 6 heading levels', () => {
    const text = '# h1\n## h2\n### h3\n#### h4\n##### h5\n###### h6';
    expect(extractHeadings(text).map((h) => h.level)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
  });

  it('does not treat 7+ leading hashes as a heading', () => {
    expect(extractHeadings('####### too many')).toEqual([]);
  });
});

describe('findFragmentTargetLine', () => {
  it('returns -1 for an empty fragment', () => {
    expect(findFragmentTargetLine('hello\nworld', '')).toBe(-1);
  });

  it('finds a paragraph by ^block-id', () => {
    const text = ['# Heading', '', 'First paragraph. ^abc', '', 'Second.'].join(
      '\n',
    );
    expect(findFragmentTargetLine(text, '^abc')).toBe(2);
  });

  it('finds the line for a combined Heading^block fragment via the block', () => {
    // The resolver matches on the LAST `^id` only — block IDs are
    // unique per file so we ignore the heading prefix.
    const text = [
      '# Setup',
      'A line.',
      'Pinned line. ^my-block',
      '# Other',
    ].join('\n');
    expect(findFragmentTargetLine(text, 'Setup^my-block')).toBe(2);
  });

  it('returns -1 when ^block-id is not present', () => {
    expect(
      findFragmentTargetLine('# Heading\n\nNo block here.', '^missing'),
    ).toBe(-1);
  });

  it('falls through to heading-slug match when fragment has no caret', () => {
    const text = '# Setup\n\nBody.\n\n## Configuration\n\nMore.';
    expect(findFragmentTargetLine(text, 'setup')).toBe(0);
    expect(findFragmentTargetLine(text, 'configuration')).toBe(4);
  });

  it('does not falsely match a block-id substring inside a paragraph', () => {
    const text = ['Some prose mentioning ^abc inline.', 'Another. ^abc'].join(
      '\n',
    );
    expect(findFragmentTargetLine(text, '^abc')).toBe(1);
  });

  it('handles ^block-id with hyphens and underscores', () => {
    expect(findFragmentTargetLine('Para. ^my-block_123', '^my-block_123')).toBe(
      0,
    );
  });

  it('returns -1 when the fragment matches neither a block nor a heading', () => {
    expect(findFragmentTargetLine('# Setup\n\nBody.', 'NoSuchAnchor')).toBe(-1);
  });

  it('strips trailing {#explicit-id} before slugifying the heading', () => {
    // Without the strip, "## My Heading {#custom-id}" would slug to
    // "my-heading-custom-id" instead of "my-heading", and a link to
    // `#my-heading` would never resolve.
    const text = '## My Heading {#custom-id}\n\nBody.';
    expect(findFragmentTargetLine(text, 'my-heading')).toBe(0);
  });
});
