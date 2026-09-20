import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { LayoutNode, PaneNode, SplitNode } from '../types';
import PreviewFrame from './PreviewFrame';
import TabStrip from './TabStrip';
import Welcome from './Welcome';

export type DropZone = 'left' | 'right' | 'top' | 'bottom' | 'center';

export interface LayoutActions {
  activePaneId: string;
  rootDirectories: string[];
  vscode: boolean;
  recents: string[];
  /** Wiki mode: number of notes in the embedded payload (drives Welcome). */
  wikiNoteCount?: number;
  /** A tab drag is in flight; pane bodies are covered by drop guards. */
  dragActive: boolean;
  onFocusPane: (paneId: string) => void;
  onActivateTab: (paneId: string, tabId: string) => void;
  onCloseTab: (paneId: string, tabId: string) => void;
  /** Whether this (empty) pane can be closed — false for the last pane. */
  canClosePane: (paneId: string) => boolean;
  onClosePane: (paneId: string) => void;
  onOpenPicker: (paneId: string) => void;
  onOpenFile: (paneId: string, file: string) => void;
  onSplitPane: (paneId: string, direction: 'horizontal' | 'vertical') => void;
  onResizeSplit: (splitId: string, childIndex: number, ratio: number) => void;
  registerFrame: (
    tabId: string,
    file: string,
    iframe: HTMLIFrameElement | null,
    reload: (() => void) | null,
  ) => void;
  onFrameVisible: (tabId: string) => void;
  onFrameFocus: (tabId: string) => void;
  onTabDragStart: (paneId: string, tabId: string) => void;
  onTabDragEnd: () => void;
  onTabDrop: (paneId: string, insertionIndex: number) => void;
  onPaneBodyDrop: (paneId: string, zone: DropZone) => void;
  /**
   * Wiki mode: returns the assembled srcdoc for a file (sandboxed frame),
   * or undefined in serve mode (frames load `/preview?file=…` instead).
   */
  frameDocument?: (file: string) => string | undefined;
}

const LayoutActionsContext = createContext<LayoutActions | null>(null);

export function useLayoutActions(): LayoutActions {
  const actions = useContext(LayoutActionsContext);
  if (!actions) {
    throw new Error('useLayoutActions must be used inside LayoutView');
  }
  return actions;
}

export default function LayoutView({
  node,
  actions,
}: {
  node: LayoutNode;
  actions: LayoutActions;
}) {
  return (
    <LayoutActionsContext.Provider value={actions}>
      <NodeView node={node} />
    </LayoutActionsContext.Provider>
  );
}

function NodeView({ node }: { node: LayoutNode }): ReactNode {
  if (node.kind === 'pane') {
    return <PaneView pane={node} />;
  }
  return <SplitView split={node} />;
}

function PaneView({ pane }: { pane: PaneNode }): ReactNode {
  const actions = useLayoutActions();
  const isActive = actions.activePaneId === pane.id;
  return (
    <section
      className={'cn-pane' + (isActive ? ' cn-pane-active' : '')}
      onMouseDownCapture={() => actions.onFocusPane(pane.id)}
    >
      <TabStrip
        tabs={pane.tabs}
        activeTabId={pane.activeTabId}
        canClose={actions.canClosePane(pane.id)}
        onActivate={(tabId: string) => actions.onActivateTab(pane.id, tabId)}
        onClose={(tabId: string) => actions.onCloseTab(pane.id, tabId)}
        onClosePane={() => actions.onClosePane(pane.id)}
        onOpenPicker={() => actions.onOpenPicker(pane.id)}
        onSplit={(direction: 'horizontal' | 'vertical') =>
          actions.onSplitPane(pane.id, direction)
        }
        onTabDragStart={(tabId: string) =>
          actions.onTabDragStart(pane.id, tabId)
        }
        onTabDragEnd={actions.onTabDragEnd}
        onTabDrop={(insertionIndex: number) =>
          actions.onTabDrop(pane.id, insertionIndex)
        }
      />
      <div className="cn-pane-body">
        {actions.dragActive && (
          <PaneDropGuard
            paneId={pane.id}
            empty={pane.tabs.length === 0}
            onDrop={actions.onPaneBodyDrop}
          />
        )}
        {pane.tabs.length === 0 ? (
          <Welcome
            rootDirectories={actions.rootDirectories}
            vscode={actions.vscode}
            recents={actions.recents}
            wikiNoteCount={actions.wikiNoteCount}
            onOpenFile={(file: string) => actions.onOpenFile(pane.id, file)}
            onOpenPicker={() => actions.onOpenPicker(pane.id)}
          />
        ) : (
          pane.tabs.map((tab) => (
            <PreviewFrame
              key={tab.id}
              tabId={tab.id}
              file={tab.file}
              visible={pane.activeTabId === tab.id}
              documentProvider={actions.frameDocument}
              onRegister={actions.registerFrame}
              onBecameVisible={actions.onFrameVisible}
              onFrameFocus={actions.onFrameFocus}
            />
          ))
        )}
      </div>
    </section>
  );
}

function SplitView({ split }: { split: SplitNode }): ReactNode {
  const actions = useLayoutActions();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const totalSize = useRef(0);
  const dragIndex = useRef(0);

  const onPointerDown = useCallback(
    (event: React.PointerEvent, childIndex: number) => {
      event.preventDefault();
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      totalSize.current =
        split.direction === 'horizontal' ? rect.width : rect.height;
      dragIndex.current = childIndex;
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    },
    [split.direction],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (totalSize.current <= 0) {
        return;
      }
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      const position =
        split.direction === 'horizontal'
          ? event.clientX - rect.left
          : event.clientY - rect.top;
      const ratio = position / totalSize.current;
      if (ratio > 0 && ratio < 1) {
        actions.onResizeSplit(split.id, dragIndex.current, ratio);
      }
    },
    [actions, split.direction, split.id],
  );

  const onPointerUp = useCallback((event: React.PointerEvent) => {
    totalSize.current = 0;
    (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
  }, []);

  return (
    <div
      ref={containerRef}
      className={
        'cn-split ' +
        (split.direction === 'horizontal'
          ? 'cn-split-horizontal'
          : 'cn-split-vertical')
      }
    >
      {split.children.map((child: LayoutNode, index: number) => (
        <React.Fragment key={child.id}>
          <div
            className="cn-split-child"
            style={{ flexGrow: split.sizes[index] ?? 1, flexBasis: 0 }}
          >
            <NodeView node={child} />
          </div>
          {index < split.children.length - 1 && (
            <div
              className={
                'cn-splitter ' +
                (split.direction === 'horizontal'
                  ? 'cn-splitter-vertical'
                  : 'cn-splitter-horizontal')
              }
              onPointerDown={(event: React.PointerEvent) =>
                onPointerDown(event, index)
              }
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

const DROP_ZONE_SIZE = 0.3;

function zoneFromPoint(
  rect: DOMRect,
  clientX: number,
  clientY: number,
): DropZone {
  const relX = (clientX - rect.left) / rect.width;
  const relY = (clientY - rect.top) / rect.height;
  if (relX < DROP_ZONE_SIZE) {
    return 'left';
  }
  if (relX > 1 - DROP_ZONE_SIZE) {
    return 'right';
  }
  if (relY < DROP_ZONE_SIZE) {
    return 'top';
  }
  if (relY > 1 - DROP_ZONE_SIZE) {
    return 'bottom';
  }
  return 'center';
}

/**
 * Covers the pane body while a tab is being dragged. HTML5 drag events
 * don't cross iframe boundaries, so without this layer a preview iframe
 * would swallow every dragover/drop aimed at its pane.
 */
function PaneDropGuard({
  paneId,
  empty,
  onDrop,
}: {
  paneId: string;
  empty: boolean;
  onDrop: (paneId: string, zone: DropZone) => void;
}): ReactNode {
  const guardRef = useRef<HTMLDivElement | null>(null);
  const [zone, setZone] = useState<DropZone | null>(null);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const rect = guardRef.current?.getBoundingClientRect();
    if (rect) {
      setZone(zoneFromPoint(rect, event.clientX, event.clientY));
    }
  };

  const zoneClass =
    zone && !empty
      ? `cn-drop-hint cn-drop-hint-${zone}`
      : zone === 'center' || (empty && zone)
        ? 'cn-drop-hint cn-drop-hint-center'
        : null;

  return (
    <div
      ref={guardRef}
      className="cn-drop-guard"
      onDragOver={handleDragOver}
      onDragLeave={(event: React.DragEvent) => {
        if (!guardRef.current?.contains(event.relatedTarget as Node)) {
          setZone(null);
        }
      }}
      onDrop={(event: React.DragEvent) => {
        event.preventDefault();
        const rect = guardRef.current?.getBoundingClientRect();
        const droppedZone = rect
          ? zoneFromPoint(rect, event.clientX, event.clientY)
          : 'center';
        setZone(null);
        // An empty pane can only accept a center drop; edge zones would
        // split a pane that has nothing to show.
        onDrop(paneId, empty ? 'center' : droppedZone);
      }}
    >
      {zoneClass && <div className={zoneClass} />}
    </div>
  );
}
