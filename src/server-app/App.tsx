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
  isMarkdownPath,
  resolveHref,
  sendCommand,
} from './lib/api';
import {
  LayoutNode,
  PersistedWorkspace,
  closeFileEverywhere,
  closeTabInPane,
  createPane,
  findPane,
  mapPanes,
  moveTab,
  openFileInPane,
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
  const serverInfo = useMemo<ServerInfo>(() => getServerInfo(), []);
  const storageKey = `crossnote:serve:${serverInfo.rootDirectories.join('|')}`;

  const [layout, setLayout] = useState<LayoutNode | null>(null);
  const [activePaneId, setActivePaneId] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPaneId, setPickerPaneId] = useState('');
  const [zenMode, setZenMode] = useState(false);

  const framesRef = useRef<Map<string, FrameEntry>>(new Map());
  const layoutRef = useRef<LayoutNode | null>(null);
  const activePaneIdRef = useRef('');
  const pickerPaneIdRef = useRef('');
  layoutRef.current = layout;
  activePaneIdRef.current = activePaneId;
  pickerPaneIdRef.current = pickerPaneId;

  useEffect(() => {
    const firstRoot = serverInfo.rootDirectories[0] ?? '';
    document.title = `crossnote — ${basename(firstRoot) || 'preview'}`;
  }, [serverInfo.rootDirectories]);

  // ---- persisted workspace ----------------------------------------------
  useEffect(() => {
    const initialPane = createPane();
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedWorkspace;
        if (parsed.layout) {
          setLayout(parsed.layout);
          setActivePaneId(parsed.activePaneId || initialPane.id);
          setRecents(parsed.recents ?? []);
          return;
        }
      }
    } catch {
      // Corrupted persisted workspace — start fresh.
    }
    setLayout(initialPane);
    setActivePaneId(initialPane.id);
  }, [storageKey]);

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
          lastUpdate: existing?.lastUpdate ?? null,
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
    [],
  );

  const onFrameVisible = useCallback((tabId: string) => {
    const entry = framesRef.current.get(tabId);
    if (entry?.iframe?.contentWindow && entry.lastUpdate) {
      entry.iframe.contentWindow.postMessage(
        entry.lastUpdate,
        window.location.origin,
      );
    }
  }, []);

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
    serverInfo,
  });
  actionsRef.current = {
    openFile,
    closeActiveTab,
    splitPaneAt,
    openPickerForActivePane,
    serverInfo,
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data as WebviewCommandMessage | undefined;
      if (!data || typeof data.command !== 'string') {
        return;
      }
      const actions = actionsRef.current;

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
        case 'showBacklinks':
        case 'clickTag': {
          // No host-side behavior in the standalone server app (yet).
          return;
        }
        default: {
          void sendCommand(file, data.command, args);
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [touchRecents]);

  // ---- server-sent events ---------------------------------------------------
  useEffect(() => {
    const source = new EventSource('/api/events');
    source.onmessage = (event: MessageEvent<string>) => {
      let data: {
        type: string;
        file?: string;
        payload?: UpdateHtmlPayload;
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
      }
    };
    return () => source.close();
  }, [touchRecents]);

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
    }),
    [
      activePaneId,
      recents,
      dragActive,
      serverInfo.rootDirectories,
      serverInfo.vscode,
      openFile,
      splitPaneAt,
      registerFrame,
      onFrameVisible,
      onFrameFocus,
      onTabDragStart,
      onTabDragEnd,
      onTabDrop,
      onPaneBodyDrop,
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
      <FilePicker
        open={pickerOpen}
        recents={recents}
        rootDirectories={serverInfo.rootDirectories}
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
