/**
 * Classification of crossnote's preview themes into light/dark, so the
 * serve/wiki shell chrome (titlebar, tabs, panes, welcome) can match the
 * tone of the notes it hosts. Kept in sync with the light/dark groups of
 * the webview's context-menu theme picker.
 */

const LIGHT_PREVIEW_THEMES = new Set([
  'atom-light.css',
  'github-light.css',
  'gothic.css',
  'medium.css',
  'newsprint.css',
  'one-light.css',
  'solarized-light.css',
  'vue.css',
]);

const DARK_PREVIEW_THEMES = new Set([
  'atom-dark.css',
  'atom-material.css',
  'github-dark.css',
  'monokai.css',
  'night.css',
  'one-dark.css',
  'solarized-dark.css',
]);

/**
 * The mode a preview theme paints the page in, or `null` when it carries no
 * opinion of its own (`none.css` follows the host, unknown names shouldn't
 * guess) — callers then fall back to the system color scheme.
 */
export function previewThemeMode(
  theme: string | undefined,
): 'light' | 'dark' | null {
  if (!theme) {
    return null;
  }
  if (LIGHT_PREVIEW_THEMES.has(theme)) {
    return 'light';
  }
  if (DARK_PREVIEW_THEMES.has(theme)) {
    return 'dark';
  }
  return null;
}
