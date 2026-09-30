const COLOR_SCHEME_QUERY =
  /^\s*\(\s*prefers-color-scheme\s*:\s*(light|dark)\s*\)\s*$/i;

/**
 * Make GitHub-style theme images follow the preview's own color scheme.
 *
 * READMEs mark theme variants with
 * `<picture><source media="(prefers-color-scheme: dark)" srcset="…">`, and
 * GitHub shows the one matching the page's theme. Inside the preview the media
 * query instead reports the system color scheme, which can differ from the
 * preview theme (a dark preview theme on a light system got the light image on
 * a dark background). Each `<source>` whose `media` is exactly a
 * `prefers-color-scheme` query is switched to `all` or `not all` to match
 * `scheme`; the original query is kept in `data-crossnote-media` so a later
 * theme change can re-evaluate it. Other media queries are left alone.
 */
export function applyColorSchemeToPictures(
  root: ParentNode,
  scheme: 'light' | 'dark',
): void {
  root.querySelectorAll('picture > source[media]').forEach((source) => {
    const media =
      source.getAttribute('data-crossnote-media') ??
      source.getAttribute('media') ??
      '';
    const match = media.match(COLOR_SCHEME_QUERY);
    if (!match) {
      return;
    }
    source.setAttribute('data-crossnote-media', media);
    source.setAttribute(
      'media',
      match[1].toLowerCase() === scheme ? 'all' : 'not all',
    );
  });
}
