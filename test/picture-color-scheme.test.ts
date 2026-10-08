/**
 * @jest-environment jsdom
 */

import { applyColorSchemeToPictures } from '../src/webview/lib/picture-color-scheme';

function render(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

const githubPicture = `
<picture>
  <source id="dark" media="(prefers-color-scheme: dark)" srcset="dark.svg">
  <source id="light" media="(prefers-color-scheme: light)" srcset="light.svg">
  <img src="light.svg">
</picture>`;

describe('applyColorSchemeToPictures', () => {
  test('a dark preview selects the dark source', () => {
    const root = render(githubPicture);
    applyColorSchemeToPictures(root, 'dark');
    expect(root.querySelector('#dark')?.getAttribute('media')).toBe('all');
    expect(root.querySelector('#light')?.getAttribute('media')).toBe('not all');
  });

  test('a light preview selects the light source', () => {
    const root = render(githubPicture);
    applyColorSchemeToPictures(root, 'light');
    expect(root.querySelector('#dark')?.getAttribute('media')).toBe('not all');
    expect(root.querySelector('#light')?.getAttribute('media')).toBe('all');
  });

  test('a theme change re-evaluates the original query', () => {
    const root = render(githubPicture);
    applyColorSchemeToPictures(root, 'dark');
    applyColorSchemeToPictures(root, 'light');
    const dark = root.querySelector('#dark');
    expect(dark?.getAttribute('media')).toBe('not all');
    expect(dark?.getAttribute('data-crossnote-media')).toBe(
      '(prefers-color-scheme: dark)',
    );
  });

  test('accepts spacing and case variations', () => {
    const root = render(
      '<picture><source id="s" media=" ( Prefers-Color-Scheme :DARK ) " srcset="d.svg"><img src="l.svg"></picture>',
    );
    applyColorSchemeToPictures(root, 'dark');
    expect(root.querySelector('#s')?.getAttribute('media')).toBe('all');
  });

  test('leaves other media queries and non-picture sources alone', () => {
    const root = render(`
      <picture>
        <source id="wide" media="(min-width: 800px)" srcset="wide.png">
        <source id="combined" media="(prefers-color-scheme: dark) and (min-width: 800px)" srcset="d.png">
        <img src="n.png">
      </picture>
      <video><source id="video" media="(prefers-color-scheme: dark)" src="v.mp4"></video>`);
    applyColorSchemeToPictures(root, 'dark');
    expect(root.querySelector('#wide')?.getAttribute('media')).toBe(
      '(min-width: 800px)',
    );
    expect(root.querySelector('#combined')?.getAttribute('media')).toBe(
      '(prefers-color-scheme: dark) and (min-width: 800px)',
    );
    expect(root.querySelector('#video')?.getAttribute('media')).toBe(
      '(prefers-color-scheme: dark)',
    );
  });
});
