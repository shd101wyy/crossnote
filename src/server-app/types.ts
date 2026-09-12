export interface Tab {
  /** Unique id within the app (a file may be open in several panes). */
  id: string;
  /** Absolute path of the markdown file. */
  file: string;
}

export interface PaneNode {
  kind: 'pane';
  id: string;
  tabs: Tab[];
  activeTabId: string | null;
}

export interface SplitNode {
  kind: 'split';
  id: string;
  direction: 'horizontal' | 'vertical';
  /** Flex grow ratios, one per child, normalized to sum ≈ 1. */
  sizes: number[];
  children: LayoutNode[];
}

export type LayoutNode = PaneNode | SplitNode;

export interface PersistedWorkspace {
  layout: LayoutNode;
  activePaneId: string;
  recents: string[];
}

let nextId = 0;

/** Ids must be unique per app run; `file` alone is not enough (split panes). */
export function createId(prefix: string): string {
  nextId += 1;
  return `${prefix}-${Date.now().toString(36)}-${nextId}`;
}

export function createPane(): PaneNode {
  return { kind: 'pane', id: createId('pane'), tabs: [], activeTabId: null };
}

export function findPane(node: LayoutNode, paneId: string): PaneNode | null {
  if (node.kind === 'pane') {
    return node.id === paneId ? node : null;
  }
  for (const child of node.children) {
    const found = findPane(child, paneId);
    if (found) {
      return found;
    }
  }
  return null;
}

export function listPaneIds(node: LayoutNode): string[] {
  if (node.kind === 'pane') {
    return [node.id];
  }
  return node.children.flatMap((child) => listPaneIds(child));
}

export function mapPanes(
  node: LayoutNode,
  map: (pane: PaneNode) => PaneNode,
): LayoutNode {
  if (node.kind === 'pane') {
    return map(node);
  }
  return {
    ...node,
    children: node.children.map((child) => mapPanes(child, map)),
  };
}

/**
 * Open `file` in `paneId` — activates the existing tab when the pane already
 * shows it, otherwise appends a new tab and activates it.
 */
export function openFileInPane(
  node: LayoutNode,
  paneId: string,
  file: string,
): LayoutNode {
  return mapPanes(node, (pane) => {
    if (pane.id !== paneId) {
      return pane;
    }
    const existing = pane.tabs.find((tab) => tab.file === file);
    if (existing) {
      return { ...pane, activeTabId: existing.id };
    }
    const tab: Tab = { id: createId('tab'), file };
    return {
      ...pane,
      tabs: [...pane.tabs, tab],
      activeTabId: tab.id,
    };
  });
}

export function closeTabInPane(
  node: LayoutNode,
  paneId: string,
  tabId: string,
): LayoutNode {
  return mapPanes(node, (pane) => {
    if (pane.id !== paneId) {
      return pane;
    }
    const index = pane.tabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) {
      return pane;
    }
    const tabs = pane.tabs.filter((tab) => tab.id !== tabId);
    let activeTabId = pane.activeTabId;
    if (activeTabId === tabId) {
      const next = tabs[Math.min(index, tabs.length - 1)];
      activeTabId = next ? next.id : null;
    }
    return { ...pane, tabs, activeTabId };
  });
}

/** Close every tab showing `file`, wherever it is open. */
export function closeFileEverywhere(
  node: LayoutNode,
  file: string,
): LayoutNode {
  return mapPanes(node, (pane) => {
    const tabs = pane.tabs.filter((tab) => tab.file !== file);
    if (tabs.length === pane.tabs.length) {
      return pane;
    }
    let activeTabId = pane.activeTabId;
    if (pane.tabs.some((tab) => tab.id === activeTabId && tab.file === file)) {
      activeTabId = tabs.length > 0 ? tabs[tabs.length - 1].id : null;
    }
    return { ...pane, tabs, activeTabId };
  });
}

export function splitPane(
  node: LayoutNode,
  paneId: string,
  direction: 'horizontal' | 'vertical',
  position: 'before' | 'after' = 'after',
): { layout: LayoutNode; newPaneId: string } {
  const newPane = createPane();
  // Replace the target pane with a split containing it plus the new pane.
  const replace = (current: LayoutNode): LayoutNode => {
    if (current.kind === 'pane') {
      if (current.id !== paneId) {
        return current;
      }
      const children =
        position === 'after' ? [current, newPane] : [newPane, current];
      return {
        kind: 'split',
        id: createId('split'),
        direction,
        sizes: [1, 1],
        children,
      };
    }
    return { ...current, children: current.children.map(replace) };
  };
  return { layout: replace(node), newPaneId: newPane.id };
}

/**
 * Move a tab (keeping its id, so its preview iframe keeps scroll/diagram
 * state) from one pane to another, optionally at a specific index.
 */
export function moveTab(
  node: LayoutNode,
  sourcePaneId: string,
  tabId: string,
  targetPaneId: string,
  targetIndex: number | null,
): LayoutNode {
  // Remove from the source pane first (same-pane moves need the adjusted
  // index, so capture the tab and let mapPanes do both edits in order).
  let movedTab: Tab | null = null;
  const withoutTab = mapPanes(node, (pane) => {
    if (pane.id !== sourcePaneId) {
      return pane;
    }
    const tab = pane.tabs.find((candidate) => candidate.id === tabId);
    if (!tab) {
      return pane;
    }
    movedTab = tab;
    const tabs = pane.tabs.filter((candidate) => candidate.id !== tabId);
    let activeTabId = pane.activeTabId;
    if (activeTabId === tabId) {
      activeTabId = tabs.length > 0 ? tabs[tabs.length - 1].id : null;
    }
    return { ...pane, tabs, activeTabId };
  });
  if (!movedTab) {
    return node;
  }
  const tab = movedTab as Tab;
  return mapPanes(withoutTab, (pane) => {
    if (pane.id !== targetPaneId) {
      return pane;
    }
    const tabs = [...pane.tabs];
    const index =
      targetIndex === null
        ? tabs.length
        : Math.max(0, Math.min(targetIndex, tabs.length));
    tabs.splice(index, 0, tab);
    return { ...pane, tabs, activeTabId: tab.id };
  });
}

/**
 * Resize the divider between `childIndex` and `childIndex + 1` of a split so
 * that everything up to and including `childIndex` occupies `ratio` of the
 * split's total size.
 */
export function resizeSplit(
  node: LayoutNode,
  splitId: string,
  childIndex: number,
  ratio: number,
): LayoutNode {
  if (node.kind === 'pane') {
    return node;
  }
  if (node.id === splitId) {
    const sizes = [...node.sizes];
    if (childIndex < 0 || childIndex >= sizes.length - 1) {
      return node;
    }
    const total = sizes.reduce((sum: number, size: number) => sum + size, 0);
    const prefix = sizes
      .slice(0, childIndex)
      .reduce((sum: number, size: number) => sum + size, 0);
    const available = sizes[childIndex] + sizes[childIndex + 1];
    const target = Math.min(
      Math.max(ratio * total - prefix, available * 0.1),
      available * 0.9,
    );
    sizes[childIndex] = target;
    sizes[childIndex + 1] = available - target;
    return { ...node, sizes };
  }
  return {
    ...node,
    children: node.children.map((child) =>
      resizeSplit(child, splitId, childIndex, ratio),
    ),
  };
}
