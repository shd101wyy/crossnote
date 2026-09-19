import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import FilePicker from './components/FilePicker';
import LayoutView, { LayoutActions } from './components/LayoutView';
import TitleBar from './components/TitleBar';
import {
  ServerInfo,
  UpdateHtmlPayload,
  WebviewCommandMessage,
  basename,
  filePathToFilesUrl,
  getServerInfo,
  getWikiData,
  isMarkdownPath,
  resolveHref,
  sendCommand,
} from './lib/api';
import {
  assembleWikiDocument,
  createWikiIndex,
  readWikiThemeSelection,
  resolveWikiHref,
  wikiFileList,
  wikiKeyOf,
  writeWikiThemeSelection,
  type WikiThemeSelection,
} from './lib/wiki';
import {
  LayoutNode,
  PersistedWorkspace,
  closeFileEverywhere,
  closeTabInPane,
  createPane,
  findPane,
  listPaneIds,
  mapPanes,
  moveTab,
  openFileInPane,
  removePane,
  resizeSplit,
  splitPane,
} from './types';
import type { DropZone } from './components/LayoutView';

interface FrameEntry {
  file: string;
  iframe: HTMLIFrameElement | null;
  reload: (() => void) | null;
  lastUpdate: (UpdateHtmlPayload & { command: 'updateHtml' }) | null;
  jsAndCssFiles: string[] | null;
}

const EXTERNAL_LINK_URLS: Record<string, string> = {
  openChangelog:
    'https://github.com/shd101wyy/vscode-markdown-preview-enhanced/releases',
  openDocumentation: 'https://shd101wyy.github.io/markdown-preview-enhanced/',
  openIssues:
    'https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues',
  openSponsors: 'https://github.com/sponsors/shd101wyy/',
};

export default function App() {
  // Wiki mode: the page carries the whole workspace as an embedded payload
  // (`crossnote build-wiki`) instead of talking to a serve server. Same UI,
  // read-only data source.
  const wikiData = useMemo(() => getWikiData(), []);
  const wikiIndex = useMemo(
    () => (wikiData ? createWikiIndex(wikiData) : null),
    [wikiData],
  );
  // The wiki's theme selection (context-menu picker), persisted to
  // localStorage. `null` = use the themes the file was built with.
  const [wikiThemes, setWikiThemes] = useState<WikiThemeSelection | null>(() =>
    wikiData ? readWikiThemeSelection(wikiData, localStorage) : null,
  );
  const wikiDocumentCache = useRef<Map<string, string>>(new Map());
  const frameDocument = useCallback(
    (file: string): string | undefined => {
      if (!wikiData) {
        return undefined;
      }
      const key = `${wikiKeyOf(file)}\n${wikiThemes ? JSON.stringify(wikiThemes) : ''}`;
      const cached = wikiDocumentCache.current.get(key);
      if (cached !== undefined) {
        return cached;
      }
      const entry = wikiIndex?.get(wikiKeyOf(file));
      if (!entry) {
        return undefined;
      }
      const documentHtml = assembleWikiDocument(
        wikiData,
        entry,
        wikiThemes ?? undefined,
      );
      wikiDocumentCache.current.set(key, documentHtml);
      return documentHtml;
    },
    [wikiData, wikiIndex, wikiThemes],
  );

  const serverInfo = useMemo<ServerInfo>(
    () =>
      wikiData
        ? {
            rootDirectories: wikiData.rootDirectories,
            vscode: false,
            url: '',
          }
        : getServerInfo(),
    [wikiData],
  );
  const storageKey = `crossnote:${wikiData ? 'wiki' : 'serve'}:${serverInfo.rootDirectories.join('|')}`;
  // Wiki frames are sandboxed (opaque origin), so messages to them must use
  // '*' as target origin; serve frames are same-origin.
  const frameTargetOrigin = wikiData ? '*' : window.location.origin;

  const [layout, setLayout] = useState<LayoutNode | null>(null);
  const [activePaneId, setActivePaneId] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPaneId, setPickerPaneId] = useState('');
  const [zenMode, setZenMode] = useState(false);
  const [toast, setToast] = useState<{
    level: 'info' | 'error';
    message: string;
  } | null>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);

  const showToast = useCallback(
    (toast: { level: 'info' | 'error'; message: string }) => {
      setToast(toast);
      if (toastTimerRef.current !== undefined) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => setToast(null), 6000);
    },
    [],
  );

  const framesRef = useRef<Map<string, FrameEntry>>(new Map());
  const layoutRef = useRef<LayoutNode | null>(null);
  const activePaneIdRef = useRef('');
  const pickerPaneIdRef = useRef('');
  layoutRef.current = layout;
  activePaneIdRef.current = activePaneId;
  pickerPaneIdRef.current = pickerPaneId;

  useEffect(() => {
    const firstRoot = serverInfo.rootDirectories[0] ?? '';
    document.title = `${wikiData ? 'wiki' : 'crossnote'} — ${basename(firstRoot) || 'preview'}`;
  }, [serverInfo.rootDirectories, wikiData]);

  // ---- persisted workspace ----------------------------------------------
  useEffect(() => {
    const initialPane = createPane();
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedWorkspace;
        if (parsed.layout) {
          let restored = parsed.layout;
          const restoredRecents = parsed.recents ?? [];
          if (wikiIndex) {
            // The wiki payload is immutable — drop restored tabs and recents
            // for notes that didn't make it into this file.
            restoredRecents.forEach((file) => {
              if (!wikiIndex.has(wikiKeyOf(file))) {
                restored = closeFileEverywhere(restored, file);
              }
            });
            setRecents(
              restoredRecents.filter((file) => wikiIndex.has(wikiKeyOf(file))),
            );
          } else {
            setRecents(restoredRecents);
          }
          setLayout(restored);
          setActivePaneId(parsed.activePaneId || initialPane.id);
          return;
        }
      }
    } catch {
      // Corrupted persisted workspace — start fresh.
    }
    setLayout(initialPane);
    setActivePaneId(initialPane.id);
  }, [storageKey, wikiIndex]);

  useEffect(() => {
    if (!layout) {
      return;
    }
    const payload: PersistedWorkspace = { layout, activePaneId, recents };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Storage full/blocked — persistence is best-effort.
    }
  }, [layout, activePaneId, recents, storageKey]);

  const touchRecents = useCallback((file: string) => {
    setRecents((previous) =>
      [file, ...previous.filter((candidate) => candidate !== file)].slice(
        0,
        20,
      ),
    );
  }, []);

  // ---- pane actions ------------------------------------------------------
  const openFile = useCallback(
    (paneId: string, file: string) => {
      setLayout((current) =>
        current ? openFileInPane(current, paneId, file) : current,
      );
      setActivePaneId(paneId);
      touchRecents(file);
    },
    [touchRecents],
  );

  const closeActiveTab = useCallback(() => {
    const current = layoutRef.current;
    if (!current) {
      return;
    }
    const pane = findPane(current, activePaneIdRef.current);
    if (pane?.activeTabId) {
      setLayout(closeTabInPane(current, pane.id, pane.activeTabId));
    }
  }, []);

  /** Remove an empty pane (its welcome card) — never the last one. */
  const closePane = useCallback((paneId: string) => {
    const current = layoutRef.current;
    if (!current) {
      return;
    }
    const { layout, removed } = removePane(current, paneId);
    if (!removed) {
      return;
    }
    setLayout(layout);
    if (activePaneIdRef.current === paneId) {
      setActivePaneId(listPaneIds(layout)[0] ?? '');
    }
  }, []);

  const canClosePane = useCallback((paneId: string): boolean => {
    const current = layoutRef.current;
    return (
      !!current &&
      listPaneIds(current).length > 1 &&
      (findPane(current, paneId)?.tabs.length ?? 1) === 0
    );
  }, []);

  const splitPaneAt = useCallback(
    (paneId: string, direction: 'horizontal' | 'vertical') => {
      const current = layoutRef.current;
      if (!current) {
        return;
      }
      const pane = findPane(current, paneId);
      if (!pane?.activeTabId) {
        // Splitting an empty pane has no effect.
        return;
      }
      const activeTab = pane.tabs.find((tab) => tab.id === pane.activeTabId);
      if (!activeTab) {
        return;
      }
      const { layout: split, newPaneId } = splitPane(
        current,
        paneId,
        direction,
      );
      const moved = mapPanes(split, (candidate) => {
        if (candidate.id !== paneId) {
          return candidate;
        }
        const remainingTabs = candidate.tabs.filter(
          (tab) => tab.id !== activeTab.id,
        );
        return {
          ...candidate,
          tabs: remainingTabs,
          activeTabId: remainingTabs[remainingTabs.length - 1]?.id ?? null,
        };
      });
      const withTab = openFileInPane(moved, newPaneId, activeTab.file);
      setLayout(withTab);
      setActivePaneId(newPaneId);
    },
    [],
  );

  const openPickerForActivePane = useCallback(() => {
    setPickerPaneId(activePaneIdRef.current);
    setPickerOpen(true);
  }, []);

  // ---- tab drag & drop -----------------------------------------------------
  const [dragActive, setDragActive] = useState(false);
  const dragInfoRef = useRef<{ paneId: string; tabId: string } | null>(null);

  const clearDrag = useCallback(() => {
    dragInfoRef.current = null;
    setDragActive(false);
  }, []);

  const onTabDragStart = useCallback((paneId: string, tabId: string) => {
    dragInfoRef.current = { paneId, tabId };
    setDragActive(true);
  }, []);

  const onTabDragEnd = useCallback(() => {
    clearDrag();
  }, [clearDrag]);

  const onTabDrop = useCallback(
    (targetPaneId: string, insertionIndex: number) => {
      const drag = dragInfoRef.current;
      const current = layoutRef.current;
      if (!drag || !current) {
        clearDrag();
        return;
      }
      let index = insertionIndex;
      if (drag.paneId === targetPaneId) {
        // The index was computed against the list that still contains the
        // dragged tab.
        const targetPane = findPane(current, targetPaneId);
        const sourceIndex =
          targetPane?.tabs.findIndex((tab) => tab.id === drag.tabId) ?? -1;
        if (sourceIndex !== -1 && sourceIndex < insertionIndex) {
          index -= 1;
        }
      }
      setLayout(moveTab(current, drag.paneId, drag.tabId, targetPaneId, index));
      setActivePaneId(targetPaneId);
      clearDrag();
    },
    [clearDrag],
  );

  const onPaneBodyDrop = useCallback(
    (paneId: string, zone: DropZone) => {
      const drag = dragInfoRef.current;
      const current = layoutRef.current;
      if (!drag || !current) {
        clearDrag();
        return;
      }
      if (zone === 'center') {
        setLayout(moveTab(current, drag.paneId, drag.tabId, paneId, null));
        setActivePaneId(paneId);
      } else {
        const direction: 'horizontal' | 'vertical' =
          zone === 'left' || zone === 'right' ? 'horizontal' : 'vertical';
        const position: 'before' | 'after' =
          zone === 'left' || zone === 'top' ? 'before' : 'after';
        const { layout: split, newPaneId } = splitPane(
          current,
          paneId,
          direction,
          position,
        );
        setLayout(moveTab(split, drag.paneId, drag.tabId, newPaneId, null));
        setActivePaneId(newPaneId);
      }
      clearDrag();
    },
    [clearDrag],
  );

  // ---- iframe registry ----------------------------------------------------
  const registerFrame = useCallback(
    (
      tabId: string,
      file: string,
      iframe: HTMLIFrameElement | null,
      reload: (() => void) | null,
    ) => {
      if (iframe) {
        const existing = framesRef.current.get(tabId);
        framesRef.current.set(tabId, {
          file,
          iframe,
          reload,
          lastUpdate:
            existing?.lastUpdate ??
            // Wiki frames get their content from the embedded payload —
            // seed it so visibility rehydration works like in serve.
            (wikiIndex
              ? (() => {
                  const note = wikiIndex.get(wikiKeyOf(file));
                  return note
                    ? ({ command: 'updateHtml', ...note.update } as const)
                    : null;
                })()
              : null),
          jsAndCssFiles: existing?.jsAndCssFiles ?? null,
        });
      } else {
        const entry = framesRef.current.get(tabId);
        if (entry && entry.file === file && entry.reload === null) {
          framesRef.current.delete(tabId);
        } else if (entry) {
          entry.iframe = null;
          entry.reload = null;
        }
      }
    },
    [wikiIndex],
  );

  const onFrameVisible = useCallback(
    (tabId: string) => {
      const entry = framesRef.current.get(tabId);
      if (entry?.iframe?.contentWindow && entry.lastUpdate) {
        entry.iframe.contentWindow.postMessage(
          entry.lastUpdate,
          frameTargetOrigin,
        );
      }
    },
    [frameTargetOrigin],
  );

  const onFrameFocus = useCallback((tabId: string) => {
    const current = layoutRef.current;
    if (!current) {
      return;
    }
    const paneId = findPaneOfTab(current, tabId);
    if (paneId) {
      setActivePaneId(paneId);
    }
  }, []);

  // ---- webview message routing --------------------------------------------
  const actionsRef = useRef({
    openFile,
    closeActiveTab,
    splitPaneAt,
    openPickerForActivePane,
    openWikiFile,
    serverInfo,
  });
  actionsRef.current = {
    openFile,
    closeActiveTab,
    splitPaneAt,
    openPickerForActivePane,
    openWikiFile,
    serverInfo,
  };

  /**
   * Wiki-mode link target: opens the note if it is part of the payload,
   * otherwise explains that the file didn't travel with the wiki. Returns
   * whether the note was opened.
   */
  const isWikiTargetRef = useRef(!!wikiData);
  isWikiTargetRef.current = !!wikiData;
  function openWikiFile(
    paneId: string,
    noteKey: string,
    href: string,
  ): boolean {
    if (!wikiIndex || !wikiIndex.has(wikiKeyOf(noteKey))) {
      showToast({
        level: 'info',
        message: isEchoableHref(href)
          ? `"${href}" is not part of this wiki.`
          : 'This link’s target is not part of the wiki.',
      });
      return false;
    }
    openFile(paneId, noteKey);
    return true;
  }

  /**
   * Embedded data URIs (e.g. a link pointing straight at an image) and asset
   * tokens are unreadably large — they get a generic message instead.
   */
  function isEchoableHref(href: string): boolean {
    return (
      href.length <= 200 &&
      !href.startsWith('data:') &&
      !href.startsWith('crossnote-wiki-asset:')
    );
  }

  // The graph view opens as a separate browser tab; it relays node clicks
  // back through this window reference.
  const graphWindowRef = useRef<Window | null>(null);
  const openGraphView = useCallback((file: string) => {
    graphWindowRef.current = window.open(
      `/graph-view?file=${encodeURIComponent(file)}`,
      'crossnote-graph-view',
    );
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data as WebviewCommandMessage | undefined;
      if (!data || typeof data.command !== 'string') {
        return;
      }
      const actions = actionsRef.current;

      // Node click in the graph view tab — same-origin popup, verified by
      // its window reference (it is not one of the preview iframes).
      if (
        data.command === '__serverAppOpenFile' &&
        event.origin === window.location.origin &&
        event.source === graphWindowRef.current
      ) {
        const sourceFile = String(data.args?.[0] ?? '');
        const relativePath = String(data.args?.[1] ?? '');
        const absolutePath = resolveHref(
          actions.serverInfo.rootDirectories,
          sourceFile,
          `/${relativePath.replace(/^\/+/, '')}`,
        );
        if (isMarkdownPath(absolutePath)) {
          actions.openFile(activePaneIdRef.current, absolutePath);
        }
        return;
      }

      if (data.command === '__serverAppShortcut') {
        const action = Array.isArray(data.args) ? String(data.args[0]) : '';
        if (action === 'open-file-picker') {
          actions.openPickerForActivePane();
        } else if (action === 'close-tab') {
          actions.closeActiveTab();
        } else if (action === 'split-pane') {
          actions.splitPaneAt(activePaneIdRef.current, 'horizontal');
        }
        return;
      }

      let file: string | null = null;
      for (const entry of framesRef.current.values()) {
        if (entry.iframe?.contentWindow === event.source) {
          file = entry.file;
          break;
        }
      }
      if (!file) {
        return;
      }

      const args = Array.isArray(data.args) ? data.args : [];
      switch (data.command) {
        case 'webviewFinishLoading': {
          touchRecents(file);
          if (isWikiTargetRef.current) {
            // No server to ask for a refresh — replay the embedded payload,
            // exactly like the SSE update the serve app would receive.
            const note = wikiIndex?.get(wikiKeyOf(file));
            if (note) {
              const update: UpdateHtmlPayload & { command: 'updateHtml' } = {
                command: 'updateHtml',
                ...note.update,
              };
              for (const frameEntry of framesRef.current.values()) {
                if (frameEntry.file === file) {
                  frameEntry.lastUpdate = update;
                  frameEntry.iframe?.contentWindow?.postMessage(
                    update,
                    frameTargetOrigin,
                  );
                }
              }
            }
            return;
          }
          // The initial data-html is only a first paint — the webview binds
          // click events (links, task checkboxes) when the first updateHtml
          // arrives, exactly like the VS Code extension's updateMarkdown call
          // in its own webviewFinishLoading handler.
          void sendCommand(file, 'refreshPreview', [file]);
          return;
        }
        case 'clickTagA': {
          const info = args[0] as { href?: string } | undefined;
          const href = decodeURIComponent(info?.href ?? '');
          if (/^(https?:|mailto:|tel:)/i.test(href)) {
            window.open(href, '_blank', 'noopener');
          } else if (href && !href.startsWith('#')) {
            if (isWikiTargetRef.current && wikiData) {
              // Wiki note paths are relative keys — no /files/ mount, no
              // absolute paths anywhere in the file.
              const noteKey = resolveWikiHref(wikiData, file, href);
              actions.openWikiFile(activePaneIdRef.current, noteKey, href);
              return;
            }
            const absolutePath = resolveHref(
              actions.serverInfo.rootDirectories,
              file,
              href,
            );
            if (isMarkdownPath(absolutePath)) {
              actions.openFile(activePaneIdRef.current, absolutePath);
            } else {
              const url = filePathToFilesUrl(
                actions.serverInfo.rootDirectories,
                absolutePath,
              );
              if (url) {
                window.open(url, '_blank', 'noopener');
              }
            }
          }
          return;
        }
        case 'openGraphView': {
          // The serve server hosts the graph view page; the wiki has none
          // (the button is hidden there).
          if (!isWikiTargetRef.current) {
            openGraphView(file);
          }
          return;
        }
        case 'setPreviewTheme':
        case 'setCodeBlockTheme':
        case 'setRevealjsTheme': {
          // args: [sourceUri, theme]
          const slot =
            data.command === 'setPreviewTheme'
              ? 'preview'
              : data.command === 'setCodeBlockTheme'
                ? 'codeBlock'
                : 'reveal';
          if (isWikiTargetRef.current && wikiData) {
            const theme = String(args[1] ?? '');
            const known =
              theme === 'auto.css' || theme in wikiData.themes[slot];
            if (!known) {
              return;
            }
            const next: WikiThemeSelection = {
              preview: wikiThemes?.preview ?? wikiData.themes.build.preview,
              codeBlock:
                wikiThemes?.codeBlock ?? wikiData.themes.build.codeBlock,
              reveal: wikiThemes?.reveal ?? wikiData.themes.build.reveal,
              [slot]: theme,
            };
            writeWikiThemeSelection(wikiData, localStorage, next);
            setWikiThemes(next);
            // The changed frameDocument re-assembles every open tab with the
            // new stylesheet and re-sets its srcdoc — a reload, exactly the
            // behavior of the serve server's configChanged.
            return;
          }
          void sendCommand(file, data.command, args);
          return;
        }
        case 'togglePreviewZenMode': {
          setZenMode((value) => !value);
          return;
        }
        case 'openChangelog':
        case 'openDocumentation':
        case 'openIssues':
        case 'openSponsors': {
          const url = EXTERNAL_LINK_URLS[data.command];
          if (url) {
            window.open(url, '_blank', 'noopener');
          }
          return;
        }
        case 'revealLine':
        case 'setZoomLevel':
        case 'escPressed':
        case 'clickTag': {
          // No host-side behavior in the standalone server app (yet).
          return;
        }
        case 'showBacklinks': {
          // Handled server-side (the note index lives there); the result
          // comes back as an `iframeMessage` SSE event below.
          if (!isWikiTargetRef.current) {
            void sendCommand(file, data.command, args);
          }
          return;
        }
        default: {
          // The wiki has no server to relay commands to — everything the
          // read-only webview might still send is dropped here.
          if (!isWikiTargetRef.current) {
            void sendCommand(file, data.command, args);
          }
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [
    touchRecents,
    wikiIndex,
    wikiData,
    wikiThemes,
    frameTargetOrigin,
    openGraphView,
  ]);

  // ---- server-sent events ---------------------------------------------------
  useEffect(() => {
    if (wikiData) {
      // A wiki has no server — content arrives from the embedded payload.
      return;
    }
    const source = new EventSource('/api/events');
    source.onmessage = (event: MessageEvent<string>) => {
      let data: {
        type: string;
        file?: string;
        payload?: UpdateHtmlPayload;
        level?: 'info' | 'error';
        message?: string;
        /** A webview message (e.g. `backlinks`) to deliver into a frame. */
        iframeMessage?: Record<string, unknown>;
      };
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type === 'updateHtml' && data.file && data.payload) {
        const update = { ...data.payload, command: 'updateHtml' as const };
        for (const entry of framesRef.current.values()) {
          if (entry.file !== data.file) {
            continue;
          }
          const jsAndCssFiles = data.payload?.jsAndCssFiles ?? null;
          const needsReload =
            entry.jsAndCssFiles !== null &&
            JSON.stringify(entry.jsAndCssFiles) !==
              JSON.stringify(jsAndCssFiles);
          entry.lastUpdate = update;
          entry.jsAndCssFiles = jsAndCssFiles;
          if (needsReload) {
            // New @import scripts/styles require a fresh page, like the
            // extension's iframe restart.
            entry.reload?.();
          } else if (entry.iframe?.contentWindow) {
            entry.iframe.contentWindow.postMessage(
              update,
              window.location.origin,
            );
          }
        }
      } else if (
        data.type === 'iframeMessage' &&
        data.file &&
        data.iframeMessage
      ) {
        // A host-computed webview message (e.g. backlinks) — deliver it into
        // every frame showing that file, like the extension's
        // postMessageToPreview.
        for (const entry of framesRef.current.values()) {
          if (entry.file === data.file) {
            entry.iframe?.contentWindow?.postMessage(
              data.iframeMessage,
              window.location.origin,
            );
          }
        }
      } else if (data.type === 'fileDeleted' && data.file) {
        const deletedFile = data.file;
        setLayout((current) =>
          current ? closeFileEverywhere(current, deletedFile) : current,
        );
        setRecents((previous) =>
          previous.filter((candidate) => candidate !== deletedFile),
        );
      } else if (data.type === 'noteSaved' && data.file) {
        touchRecents(data.file);
      } else if (data.type === 'configChanged') {
        // Preview styles live in each iframe page's <head>; a config change
        // (e.g. switching the preview theme) needs fresh pages. The
        // webviewFinishLoading → refreshPreview flow rehydrates content.
        for (const entry of framesRef.current.values()) {
          entry.jsAndCssFiles = null;
          entry.lastUpdate = null;
          entry.reload?.();
        }
      } else if (data.type === 'notification' && data.message) {
        showToast({
          level: data.level === 'error' ? 'error' : 'info',
          message: data.message,
        });
      }
    };
    return () => source.close();
  }, [touchRecents, showToast, wikiData]);

  // ---- global keyboard shortcuts --------------------------------------------
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (mod && !event.altKey && key === 'p') {
        event.preventDefault();
        actionsRef.current.openPickerForActivePane();
      } else if (event.altKey && key === 'w') {
        event.preventDefault();
        actionsRef.current.closeActiveTab();
      } else if (mod && !event.altKey && key === '\\') {
        event.preventDefault();
        actionsRef.current.splitPaneAt(activePaneIdRef.current, 'horizontal');
      } else if (event.key === 'Escape') {
        if (pickerOpen) {
          setPickerOpen(false);
        } else if (zenMode) {
          setZenMode(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pickerOpen, zenMode]);

  // ---- layout actions bundle -------------------------------------------------
  const layoutActions = useMemo<LayoutActions>(
    () => ({
      activePaneId,
      rootDirectories: serverInfo.rootDirectories,
      vscode: serverInfo.vscode,
      recents,
      dragActive,
      onFocusPane: (paneId: string) => setActivePaneId(paneId),
      onActivateTab: (paneId: string, tabId: string) => {
        setLayout((current) =>
          current
            ? mapPanes(current, (pane) =>
                pane.id === paneId ? { ...pane, activeTabId: tabId } : pane,
              )
            : current,
        );
        setActivePaneId(paneId);
      },
      onCloseTab: (paneId: string, tabId: string) => {
        setLayout((current) =>
          current ? closeTabInPane(current, paneId, tabId) : current,
        );
      },
      canClosePane,
      onClosePane: closePane,
      onOpenPicker: (paneId: string) => {
        setPickerPaneId(paneId);
        setPickerOpen(true);
      },
      onOpenFile: openFile,
      onSplitPane: splitPaneAt,
      onResizeSplit: (splitId: string, childIndex: number, ratio: number) => {
        setLayout((current) =>
          current ? resizeSplit(current, splitId, childIndex, ratio) : current,
        );
      },
      registerFrame,
      onFrameVisible,
      onFrameFocus,
      onTabDragStart,
      onTabDragEnd,
      onTabDrop,
      onPaneBodyDrop,
      // Wiki mode only: the frame's document comes from the embedded
      // payload. In serve mode frames load /preview pages from the server.
      frameDocument: wikiData ? frameDocument : undefined,
      wikiNoteCount: wikiData ? wikiData.files.length : undefined,
    }),
    [
      activePaneId,
      recents,
      dragActive,
      serverInfo.rootDirectories,
      serverInfo.vscode,
      openFile,
      splitPaneAt,
      canClosePane,
      closePane,
      registerFrame,
      onFrameVisible,
      onFrameFocus,
      onTabDragStart,
      onTabDragEnd,
      onTabDrop,
      onPaneBodyDrop,
      frameDocument,
      wikiData,
    ],
  );

  if (!layout) {
    return null;
  }

  return (
    <div className={zenMode ? 'cn-app cn-app-zen' : 'cn-app'}>
      {!zenMode && (
        <TitleBar
          rootDirectories={serverInfo.rootDirectories}
          vscode={serverInfo.vscode}
          onOpenPicker={openPickerForActivePane}
        />
      )}
      {zenMode && (
        <button
          type="button"
          className="cn-zen-exit"
          title="Exit zen mode (Esc)"
          onClick={() => setZenMode(false)}
        >
          Exit zen mode
        </button>
      )}
      <main className="cn-main">
        <LayoutView node={layout} actions={layoutActions} />
      </main>
      {toast && (
        <div
          className={
            toast.level === 'error' ? 'cn-toast cn-toast-error' : 'cn-toast'
          }
          role="status"
        >
          {toast.message}
        </div>
      )}
      <FilePicker
        open={pickerOpen}
        recents={recents}
        rootDirectories={serverInfo.rootDirectories}
        embeddedFiles={wikiData ? wikiFileList(wikiData) : undefined}
        onClose={() => setPickerOpen(false)}
        onOpenFile={(file: string) =>
          openFile(pickerPaneIdRef.current || activePaneIdRef.current, file)
        }
      />
    </div>
  );
}

function findPaneOfTab(node: LayoutNode, tabId: string): string | null {
  if (node.kind === 'pane') {
    return node.tabs.some((tab) => tab.id === tabId) ? node.id : null;
  }
  for (const child of node.children) {
    const found = findPaneOfTab(child, tabId);
    if (found) {
      return found;
    }
  }
  return null;
}
