/**
 * @jest-environment jsdom
 */
import {
  buildDomTextIndex,
  buildSourceTextIndex,
  domOffsetAt,
  domOffsetAtBoundary,
  findCorrespondingOffsets,
  sourceOffsetAt,
  sourceRangeToOffsets,
} from '../src/webview/lib/source-text-map';

describe('sourceRangeToOffsets', () => {
  const index = buildSourceTextIndex('alpha **beta**\n\ngamma');

  it('covers the visible characters inside the range', () => {
    const offsets = sourceRangeToOffsets(
      index,
      { line: 0, character: 6 },
      { line: 2, character: 3 },
    );
    expect(offsets).not.toBeNull();
    const [first, last] = offsets!;
    expect(index.text.slice(first, last + 1)).toBe('betagam');
  });

  it('returns null for a range without visible text', () => {
    expect(
      sourceRangeToOffsets(
        index,
        { line: 0, character: 5 },
        { line: 0, character: 8 },
      ),
    ).toBeNull();
  });
});

describe('domOffsetAtBoundary', () => {
  const root = document.createElement('div');
  root.innerHTML = '<p>one <b>two</b></p><p>three</p>';
  const index = buildDomTextIndex(root);

  it('handles text-node boundaries', () => {
    const one = root.querySelector('p')!.firstChild!;
    expect(domOffsetAtBoundary(index, root, one, 1)).toBe(1);
  });

  it('handles element boundaries before and after children', () => {
    const [first, second] = Array.from(root.querySelectorAll('p'));
    // Before <b>: the first visible character of "two".
    expect(domOffsetAtBoundary(index, root, first, 1)).toBe('one'.length);
    // After the first paragraph's last child: the start of "three".
    expect(domOffsetAtBoundary(index, root, first, 2)).toBe('onetwo'.length);
    // After everything.
    expect(domOffsetAtBoundary(index, root, second, 1)).toBe(
      'onetwothree'.length,
    );
  });
});

describe('buildSourceTextIndex', () => {
  it('keeps letters and digits with their source positions', () => {
    const index = buildSourceTextIndex('# Ab 1\n\nCd');
    expect(index.text).toBe('ab1cd');
    expect(Array.from(index.lines)).toEqual([0, 0, 0, 2, 2]);
    expect(Array.from(index.columns)).toEqual([2, 3, 5, 0, 1]);
  });

  it('drops markup that does not render as text', () => {
    const index = buildSourceTextIndex(
      [
        '**Owner** [shall](https://example.com) &nbsp;provide',
        '<td style="width: 10px">Cell</td>',
        '<!-- hidden',
        'still hidden -->shown',
        '![alt text](image.png) after',
        '1. first',
        '- [x] done',
        '[ref]: https://example.com',
      ].join('\n'),
    );
    expect(index.text).toBe('ownershallprovidecellshownafterfirstdone');
  });

  it('keeps HTML inside code fences but drops the fence lines', () => {
    const index = buildSourceTextIndex('```html\n<b>x</b>\n```\ny');
    expect(index.text).toBe('bxby');
  });
});

describe('sourceOffsetAt', () => {
  const index = buildSourceTextIndex('alpha beta\n\ngamma');

  it('finds the first visible character at or after the column', () => {
    expect(index.text[sourceOffsetAt(index, 0, 5)]).toBe('b');
    expect(index.text[sourceOffsetAt(index, 2, 0)]).toBe('g');
  });

  it('clamps past the end of the line to its last character', () => {
    expect(sourceOffsetAt(index, 0, 100)).toBe('alphabeta'.length - 1);
  });

  it('returns -1 for a line without visible text', () => {
    expect(sourceOffsetAt(index, 1, 0)).toBe(-1);
  });
});

describe('buildDomTextIndex / domOffsetAt', () => {
  it('maps caret positions in text nodes to visible-text offsets', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>Hello <b>big</b> world</p><script>skip()</script>';
    const index = buildDomTextIndex(root);
    expect(index.text).toBe('hellobigworld');

    const world = root.querySelector('p')!.lastChild!;
    expect(domOffsetAt(index, world, 1)).toBe('hellobig'.length);
    expect(domOffsetAt(index, document.createTextNode('x'), 0)).toBe(-1);
  });
});

describe('findCorrespondingOffsets', () => {
  it('finds the matching point using the surrounding text', () => {
    const from = 'theownershallprovidesurveydata';
    const to = 'introtheownershallprovidesurveydataend';
    const at = from.indexOf('provide');
    expect(findCorrespondingOffsets(from, at, to)).toEqual([
      to.indexOf('provide'),
    ]);
  });

  it('narrows the context when the full context differs', () => {
    const from = 'xxxxxxxxxxxxxxxxxxxxxxxxtheownershallprovide';
    const to = 'theownershallprovide';
    const at = from.indexOf('shall');
    expect(findCorrespondingOffsets(from, at, to)).toEqual([
      to.indexOf('shall'),
    ]);
  });

  it('returns every occurrence of a repeated phrase', () => {
    const to = 'ownershallpayaaaaownershallpay';
    expect(findCorrespondingOffsets('ownershallpay', 5, to)).toEqual([5, 22]);
  });

  it('returns nothing when no context matches', () => {
    expect(findCorrespondingOffsets('abcdefgh', 3, 'zzzzzzzz')).toEqual([]);
  });
});
