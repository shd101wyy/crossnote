/**
 * Client app of the standalone wiki file (`crossnote build-wiki`). Inlined
 * into the shell document at build time; renders the file list, filters it
 * fuzzily, and shows one pre-rendered note document at a time inside a
 * sandboxed iframe.
 *
 * Everything is read-only: note documents arrive fully rendered and carry no
 * write channel — the only messages they can send are `wiki-navigate` relays
 * from the script `buildWiki` injects into them.
 */
import { indexFiles, rankFiles } from '../server-app/lib/fuzzy';
import { resolveHref } from '../server-app/lib/api';
import './wiki.css';

interface WikiFileMeta {
  path: string;
  root: string;
  title: string;
  html: string;
}

interface WikiData {
  rootDirectories: string[];
  files: WikiFileMeta[];
}

declare global {
  interface Window {
    __CROSSNOTE_WIKI__?: WikiData;
  }
}

const data: WikiData = window.__CROSSNOTE_WIKI__ ?? {
  rootDirectories: [],
  files: [],
};

/** Posix-normalized identity of a note path (the wiki's lookup key). */
function keyOf(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

const filesByKey = new Map<string, WikiFileMeta>(
  data.files.map((file) => [keyOf(file.path), file]),
);
const multiRoot = data.rootDirectories.length > 1;

function rootName(root: string): string {
  const parts = root.replace(/[\\/]+$/, '').split(/[\\/]/);
  return parts[parts.length - 1] || root;
}

/** Directory/base split of a note's label, relative to its root. */
function labelFor(file: WikiFileMeta): { base: string; dir: string } {
  const key = keyOf(file.path);
  const rootKey = keyOf(file.root);
  const relative = key.startsWith(rootKey)
    ? key.slice(rootKey.length).replace(/^\//, '')
    : key;
  const separator = relative.lastIndexOf('/');
  const dir = separator === -1 ? '' : relative.slice(0, separator + 1);
  return {
    base: relative.slice(separator + 1),
    dir: multiRoot ? `${rootName(file.root)}/${dir}` : dir,
  };
}

const storageKey = `crossnote-wiki:${data.rootDirectories.join('|')}`;

function loadStoredFile(): string | null {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function storeStoredFile(file: string | null): void {
  try {
    if (file === null) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, file);
    }
  } catch {
    // Storage unavailable (sandboxed/opaque origin) — best effort only.
  }
}

// ---- DOM ----------------------------------------------------------------

const root = document.getElementById('root') as HTMLElement;
root.innerHTML = `
  <div class="wiki-app">
    <header class="wiki-topbar">
      <button type="button" class="wiki-sidebar-toggle" title="Toggle file list">☰</button>
      <span class="wiki-title">wiki</span>
      <input type="search" class="wiki-search" placeholder="Filter notes" aria-label="Filter notes" />
      <span class="wiki-count"></span>
    </header>
    <div class="wiki-body">
      <nav class="wiki-sidebar"><div class="wiki-list"></div></nav>
      <main class="wiki-main">
        <iframe class="wiki-frame" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" title="note"></iframe>
        <div class="wiki-welcome"></div>
        <div class="wiki-toast" hidden></div>
      </main>
    </div>
  </div>
`;

const listElement = root.querySelector('.wiki-list') as HTMLElement;
const searchElement = root.querySelector('.wiki-search') as HTMLInputElement;
const countElement = root.querySelector('.wiki-count') as HTMLElement;
const frameElement = root.querySelector('.wiki-frame') as HTMLIFrameElement;
const welcomeElement = root.querySelector('.wiki-welcome') as HTMLElement;
const toastElement = root.querySelector('.wiki-toast') as HTMLElement;
const sidebarElement = root.querySelector('.wiki-sidebar') as HTMLElement;

let activeFile: string | null = loadStoredFile();
if (activeFile && !filesByKey.has(activeFile)) {
  activeFile = null;
}

let toastTimer: number | undefined;
function showToast(message: string): void {
  toastElement.textContent = message;
  toastElement.hidden = false;
  if (toastTimer !== undefined) {
    clearTimeout(toastTimer);
  }
  toastTimer = window.setTimeout(() => {
    toastElement.hidden = true;
  }, 5000);
}

// ---- file list ------------------------------------------------------------

function renderList(): void {
  const query = searchElement.value;
  const entries = data.files.map((file) => ({
    absolutePath: file.path,
    relativePath: multiRoot
      ? `${rootName(file.root)}/${labelFor(file).base}`
      : labelFor(file).base,
  }));
  const ranked = rankFiles(query, indexFiles(entries));
  const visible = ranked
    ? ranked
        .map((result) => filesByKey.get(keyOf(result.absolutePath)))
        .filter((file): file is WikiFileMeta => !!file)
    : data.files;

  countElement.textContent = `${visible.length}${ranked ? '/' : ''}${ranked ? data.files.length : ''}`;

  listElement.innerHTML = '';
  let currentRoot: string | null = null;
  for (const file of visible) {
    if (multiRoot && file.root !== currentRoot) {
      currentRoot = file.root;
      const heading = document.createElement('div');
      heading.className = 'wiki-list-heading';
      heading.textContent = rootName(file.root);
      listElement.appendChild(heading);
    }
    const { base, dir } = labelFor(file);
    const item = document.createElement('button');
    item.type = 'button';
    item.className =
      'wiki-list-item' +
      (keyOf(file.path) === activeFile ? ' wiki-active' : '');
    item.title = file.path;
    const baseSpan = document.createElement('span');
    baseSpan.className = 'wiki-list-base';
    baseSpan.textContent = base;
    const dirSpan = document.createElement('span');
    dirSpan.className = 'wiki-list-dir';
    dirSpan.textContent = dir;
    item.appendChild(dirSpan);
    item.appendChild(baseSpan);
    item.addEventListener('click', () => openFile(file.path));
    listElement.appendChild(item);
  }
  if (visible.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'wiki-list-empty';
    empty.textContent = 'No notes match.';
    listElement.appendChild(empty);
  }
}

function openFile(filePath: string): void {
  const key = keyOf(filePath);
  const file = filesByKey.get(key);
  if (!file) {
    return;
  }
  activeFile = key;
  storeStoredFile(key);
  // Re-setting srcdoc reloads the frame; the pre-rendered document then
  // initializes its own diagrams/math (mermaid, Reveal, …) while visible.
  frameElement.srcdoc = file.html;
  frameElement.hidden = false;
  welcomeElement.hidden = true;
  renderList();
}

function showWelcome(): void {
  frameElement.hidden = true;
  frameElement.removeAttribute('srcdoc');
  welcomeElement.hidden = false;
  welcomeElement.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'wiki-welcome-card';
  const heading = document.createElement('h1');
  heading.textContent = 'crossnote wiki';
  const sub = document.createElement('p');
  sub.textContent =
    data.files.length === 1
      ? 'This wiki contains 1 note.'
      : `This wiki contains ${data.files.length} notes. Pick one from the file list.`;
  card.appendChild(heading);
  card.appendChild(sub);
  welcomeElement.appendChild(card);
  renderList();
}

// ---- iframe message relay ---------------------------------------------------

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== frameElement.contentWindow) {
    return;
  }
  const datum = event.data as { command?: string; href?: string } | null;
  if (!datum || datum.command !== 'wiki-navigate' || !datum.href) {
    return;
  }
  if (!activeFile) {
    return;
  }
  let href = datum.href;
  try {
    href = decodeURIComponent(href);
  } catch {
    // Leave as-is when it isn't valid percent-encoding.
  }
  const target = resolveHref(data.rootDirectories, activeFile, href);
  if (filesByKey.has(target)) {
    openFile(target);
  } else {
    showToast(`"${href}" is not part of this wiki.`);
  }
});

// ---- chrome -----------------------------------------------------------------

root.querySelector('.wiki-sidebar-toggle')?.addEventListener('click', () => {
  sidebarElement.classList.toggle('wiki-collapsed');
});

searchElement.addEventListener('input', renderList);
searchElement.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    // Open the best match and keep the filter for reference.
    const first = listElement.querySelector(
      '.wiki-list-item',
    ) as HTMLButtonElement | null;
    first?.click();
  } else if (event.key === 'Escape') {
    searchElement.value = '';
    renderList();
    searchElement.blur();
  }
});

window.addEventListener('keydown', (event) => {
  const mod = event.metaKey || event.ctrlKey;
  if (mod && !event.altKey && event.key.toLowerCase() === 'p') {
    event.preventDefault();
    searchElement.focus();
    searchElement.select();
  }
});

// ---- boot --------------------------------------------------------------------

if (activeFile) {
  openFile(activeFile);
} else {
  showWelcome();
}
