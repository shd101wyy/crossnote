import { previewThemeMode } from '../../src/server-app/lib/preview-theme';

describe('previewThemeMode', () => {
  test('classifies the light and dark theme families', () => {
    for (const theme of [
      'atom-light.css',
      'github-light.css',
      'gothic.css',
      'medium.css',
      'newsprint.css',
      'one-light.css',
      'solarized-light.css',
      'vue.css',
    ]) {
      expect(previewThemeMode(theme)).toBe('light');
    }
    for (const theme of [
      'atom-dark.css',
      'atom-material.css',
      'github-dark.css',
      'monokai.css',
      'night.css',
      'one-dark.css',
      'solarized-dark.css',
    ]) {
      expect(previewThemeMode(theme)).toBe('dark');
    }
  });

  test('themes without an opinion fall through to the system scheme', () => {
    expect(previewThemeMode('none.css')).toBeNull();
    expect(previewThemeMode('made-up.css')).toBeNull();
    expect(previewThemeMode(undefined)).toBeNull();
  });
});
