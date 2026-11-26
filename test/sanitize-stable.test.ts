import { sanitizeStableHTML } from '../src/markdown-engine/sanitize';
import {
  LONG_MUTATION,
  MUTATIONS,
  readAgain,
  sanitizeOnce,
} from './fixtures/mutating-markup';

/**
 * Reading markup a second time can read it differently from the first: in
 * MathML and SVG, what one reading takes for the text of a `style` element is
 * an element with an event handler in the next. The page that writes such
 * markup back into itself (reveal.js writes the speaker notes of a slide into
 * the window of its speaker view) would get the element; the sanitizer had
 * seen text.
 */

const THREATS = [
  ...MUTATIONS,
  // One reading takes the style for MathML's in every reading, and the image
  // out.
  `<math><mtext><style><img src=x onerror=alert(1)></style></mtext></math>`,
];

describe('markup that a page takes back as HTML', () => {
  test.each(THREATS)(
    'has no event handler in it once it is read again: %s',
    (notes) => {
      expect(readAgain(sanitizeStableHTML(notes))).toEqual([]);
    },
  );

  test.each(MUTATIONS)('is read the same a second time: %s', (notes) => {
    const once = sanitizeStableHTML(notes);

    // What the page reads is what was sanitized: reading it once more
    // changes nothing.
    expect(sanitizeStableHTML(once)).toBe(once);
  });

  test.each(MUTATIONS)('is not made safe by one reading: %s', (notes) => {
    // The mutations are real: unless the markup were read again, the page
    // would read an event handler where the sanitizer read text.
    expect(readAgain(sanitizeOnce(notes))).not.toEqual([]);
  });

  test('takes its MathML and SVG out where three readings are not enough', () => {
    // Forms nested deeper put the handler further away still, so the
    // sanitizer cannot simply go on reading.
    let markup = LONG_MUTATION;
    for (let reading = 0; reading < 3; reading++) {
      markup = sanitizeOnce(markup);
    }
    expect(readAgain(markup)).not.toEqual([]);

    const sanitized = sanitizeStableHTML(LONG_MUTATION);

    expect(sanitized).not.toMatch(/<math|<svg/);
    expect(readAgain(sanitized)).toEqual([]);
  });

  test('reads notes nested in notes once, however deep they are', () => {
    // A chain of sections whose notes hold the next level, none of them
    // closed. Reading each level again inside the one around it took half a
    // minute for notes of this size.
    let notes = '<b>x</b>';
    for (let level = 0; level < 160; level++) {
      notes = `<section data-notes="${notes
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')}">`;
    }

    const started = Date.now();
    const sanitized = sanitizeStableHTML(notes);

    expect(Date.now() - started).toBeLessThan(2000);
    expect(readAgain(sanitized)).toEqual([]);
  });

  test.each([
    [
      'a MathML formula',
      '<span class="katex"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>x</mi><mo>+</mo><mn>2</mn></mrow><annotation encoding="application/x-tex">x+2</annotation></semantics></math></span>',
    ],
    [
      'a diagram',
      '<svg viewBox="0 0 10 10"><style>.a{fill:red}</style><title>Diagram</title><g class="a"><path d="M0 0"></path></g></svg>',
    ],
    ['a note', 'Say it <b>loudly</b>.'],
  ])('keeps %s as it is', (_, html) => {
    expect(sanitizeStableHTML(html)).toBe(html);
  });

  test('takes an event handler out, wherever it is', () => {
    expect(
      sanitizeStableHTML(
        '<b onclick=alert(1)>x</b><input autofocus onfocus=alert(2)>',
      ),
    ).toBe('<b>x</b><input autofocus="">');
  });

  test('reads as the content of an element, which ends where its own end tag is', () => {
    // The page reads it with `innerHTML`: what ends the element it is read
    // into ends what it gets.
    expect(sanitizeStableHTML('</div><input autofocus onfocus=alert(1)>')).toBe(
      '',
    );
  });
});
