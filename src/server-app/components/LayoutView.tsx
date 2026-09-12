import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from 'react';
import { LayoutNode, PaneNode, SplitNode } from '../types';
import PreviewFrame from './PreviewFrame';
import TabStrip from './TabStrip';
import Welcome from './Welcome';

export interface LayoutActions {
  activePaneId: string;
  rootDirectory: string;
  vscode: boolean;
  recents: string[];
  onFocusPane: (paneId: string) => void;
  onActivateTab: (paneId: string, tabId: string) => void;
  onCloseTab: (paneId: string, tabId: string) => void;
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
        onActivate={(tabId: string) => actions.onActivateTab(pane.id, tabId)}
        onClose={(tabId: string) => actions.onCloseTab(pane.id, tabId)}
        onOpenPicker={() => actions.onOpenPicker(pane.id)}
        onSplit={(direction: 'horizontal' | 'vertical') =>
          actions.onSplitPane(pane.id, direction)
        }
      />
      <div className="cn-pane-body">
        {pane.tabs.length === 0 ? (
          <Welcome
            rootDirectory={actions.rootDirectory}
            vscode={actions.vscode}
            recents={actions.recents}
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
