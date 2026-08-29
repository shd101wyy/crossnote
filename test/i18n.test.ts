import { getLocale, setLocale, t } from '../src/webview/lib/i18n';
import en from '../src/webview/locales/en.json';
import es from '../src/webview/locales/es.json';
import fr from '../src/webview/locales/fr.json';
import ja from '../src/webview/locales/ja.json';
import ko from '../src/webview/locales/ko.json';
import nl from '../src/webview/locales/nl.json';
import ptBr from '../src/webview/locales/pt-br.json';
import tr from '../src/webview/locales/tr.json';
import zhCn from '../src/webview/locales/zh-cn.json';
import zhTw from '../src/webview/locales/zh-tw.json';

const LOCALES: Array<[string, Record<string, string>]> = [
  ['en', en as Record<string, string>],
  ['zh-cn', zhCn as Record<string, string>],
  ['zh-tw', zhTw as Record<string, string>],
  ['ja', ja as Record<string, string>],
  ['ko', ko as Record<string, string>],
  ['es', es as Record<string, string>],
  ['fr', fr as Record<string, string>],
  ['nl', nl as Record<string, string>],
  ['pt-br', ptBr as Record<string, string>],
  ['tr', tr as Record<string, string>],
];

describe('webview i18n', () => {
  afterEach(() => {
    setLocale(undefined);
  });

  test('every locale ships the exact same key set as en', () => {
    const enKeys = Object.keys(en).sort();
    for (const [name, pack] of LOCALES) {
      expect(Object.keys(pack).sort()).toEqual(enKeys);
      // no empty translations
      for (const [key, value] of Object.entries(pack)) {
        if (!value.trim()) {
          throw new Error(`${name} has an empty translation for ${key}`);
        }
      }
    }
  });

  test('setLocale translates known keys', () => {
    setLocale('zh-cn');
    expect(getLocale()).toBe('zh-cn');
    expect(t('contextMenu.copy')).toBe('复制');
    expect(t('contextMenu.zoomIn')).toBe('放大');

    setLocale('ja');
    expect(t('contextMenu.copy')).toBe('コピー');
  });

  test('setLocale is case-insensitive and rejects unknown locales', () => {
    setLocale('ZH-CN');
    expect(getLocale()).toBe('zh-cn');
    expect(t('contextMenu.copy')).toBe('复制');

    setLocale('de');
    expect(getLocale()).toBe('en');
    expect(t('contextMenu.copy')).toBe('Copy');

    setLocale(undefined);
    expect(getLocale()).toBe('en');
  });

  test('unknown keys fall back to English, then to the key itself', () => {
    setLocale('zh-cn');
    expect(t('contextMenu.doesNotExist')).toBe('contextMenu.doesNotExist');
  });
});
