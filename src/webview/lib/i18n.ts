/**
 * Minimal i18n for the preview webview UI.
 *
 * The host (e.g. the VS Code extension) passes the VS Code UI language
 * via the `locale` field of `WebviewConfig`; unknown locales fall back
 * to English, and unknown keys fall back to the English string (then to
 * the key itself), so a missing translation never breaks the UI.
 *
 * Locale packs live in `src/webview/locales/*.json` — keep every file's
 * key set identical to `en.json` (enforced by test/i18n.test.ts).
 */
import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';
import nl from '../locales/nl.json';
import ptBr from '../locales/pt-br.json';
import tr from '../locales/tr.json';
import zhCn from '../locales/zh-cn.json';
import zhTw from '../locales/zh-tw.json';

const localePacks: Record<string, Record<string, string>> = {
  'en': en as Record<string, string>,
  'es': es as Record<string, string>,
  'fr': fr as Record<string, string>,
  'ja': ja as Record<string, string>,
  'ko': ko as Record<string, string>,
  'nl': nl as Record<string, string>,
  'pt-br': ptBr as Record<string, string>,
  'tr': tr as Record<string, string>,
  'zh-cn': zhCn as Record<string, string>,
  'zh-tw': zhTw as Record<string, string>,
};

const fallbackLocale = 'en';
let currentLocale = fallbackLocale;

/**
 * Set the active locale. Values follow `vscode.env.language`
 * (BCP 47-ish, e.g. `zh-cn`, `pt-br`, `en`); anything unknown —
 * including undefined — falls back to English.
 */
export function setLocale(locale: string | undefined) {
  const normalized = (locale ?? '').toLowerCase();
  currentLocale = normalized in localePacks ? normalized : fallbackLocale;
}

export function getLocale(): string {
  return currentLocale;
}

export function t(key: string): string {
  return (
    localePacks[currentLocale][key] ?? localePacks[fallbackLocale][key] ?? key
  );
}
