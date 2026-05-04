/**
 * @jest-environment jsdom
 */
import { classifyAnchorClick } from '../src/webview/lib/anchor-routing';

function makeAnchor(html: string): HTMLAnchorElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstChild as HTMLAnchorElement;
}

describe('classifyAnchorClick', () => {
  it('routes a class="tag" anchor to a tag click using data-tag', () => {
    const a = makeAnchor(
      '<a class="tag" data-tag="my-tag" href="tag://my-tag">#my-tag</a>',
    );
    const action = classifyAnchorClick(a, a.getAttribute('href') ?? '');
    expect(action).toEqual({ kind: 'tag', tag: 'my-tag' });
  });

  it('routes a tag:// scheme anchor without class="tag" to a tag click', () => {
    // Defensive case: host extension might inject `tag://` without the class.
    const a = makeAnchor('<a href="tag://hello">hello</a>');
    const action = classifyAnchorClick(a, a.getAttribute('href') ?? '');
    expect(action).toEqual({ kind: 'tag', tag: 'hello' });
  });

  it('decodes percent-encoded slashes in nested tag hrefs', () => {
    const a = makeAnchor(
      '<a class="tag" data-tag="parent/child" href="tag://parent%2Fchild">#parent/child</a>',
    );
    const action = classifyAnchorClick(a, a.getAttribute('href') ?? '');
    // data-tag wins (more readable); both are equivalent here.
    expect(action).toEqual({ kind: 'tag', tag: 'parent/child' });
  });

  it('falls back to href-derived tag name when data-tag is missing', () => {
    const a = makeAnchor('<a class="tag" href="tag://standalone">x</a>');
    const action = classifyAnchorClick(a, a.getAttribute('href') ?? '');
    expect(action).toEqual({ kind: 'tag', tag: 'standalone' });
  });

  it('routes # hrefs to in-page anchor scrolling', () => {
    const a = makeAnchor('<a href="#section-2">Jump</a>');
    const action = classifyAnchorClick(a, a.getAttribute('href') ?? '');
    expect(action).toEqual({ kind: 'in-page-anchor', targetId: 'section-2' });
  });

  it('routes file links to external (host-handled) clicks', () => {
    const a = makeAnchor('<a href="other-note.md">Other</a>');
    const action = classifyAnchorClick(a, a.getAttribute('href') ?? '');
    expect(action).toEqual({ kind: 'external', href: 'other-note.md' });
  });

  it('routes http(s) links to external clicks', () => {
    const a = makeAnchor('<a href="https://example.com/x">Ex</a>');
    const action = classifyAnchorClick(a, a.getAttribute('href') ?? '');
    expect(action).toEqual({
      kind: 'external',
      href: 'https://example.com/x',
    });
  });

  it('returns null for malformed percent-encoding (matches old try/catch behavior)', () => {
    const a = makeAnchor('<a href="%E0%A4%A">bad</a>');
    const action = classifyAnchorClick(a, a.getAttribute('href') ?? '');
    expect(action).toBeNull();
  });

  it('does not misclassify an in-page anchor that happens to contain "tag"', () => {
    // Defensive: only a *prefix* match on tag:// counts, and the class
    // check is exact.
    const a = makeAnchor('<a href="#tag-section">Tag section</a>');
    const action = classifyAnchorClick(a, a.getAttribute('href') ?? '');
    expect(action).toEqual({
      kind: 'in-page-anchor',
      targetId: 'tag-section',
    });
  });
});
