import React, { useRef, useState } from 'react';
import { Tab } from '../types';
import { basename } from '../lib/api';

export interface TabStripProps {
  tabs: Tab[];
  activeTabId: string | null;
  /** True for an empty pane that is not the last one — it can be closed. */
  canClose?: boolean;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onClosePane: () => void;
  onOpenPicker: () => void;
  onSplit: (direction: 'horizontal' | 'vertical') => void;
  onTabDragStart: (tabId: string) => void;
  onTabDragEnd: () => void;
  onTabDrop: (insertionIndex: number) => void;
}

export default function TabStrip({
  tabs,
  activeTabId,
  canClose,
  onActivate,
  onClose,
  onClosePane,
  onOpenPicker,
  onSplit,
  onTabDragStart,
  onTabDragEnd,
  onTabDrop,
}: TabStripProps) {
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);

  const computeInsertionIndex = (clientX: number): number => {
    const container = tabsRef.current;
    if (!container) {
      return tabs.length;
    }
    const tabElements = Array.from(
      container.querySelectorAll<HTMLElement>(':scope > .cn-tab'),
    );
    for (let index = 0; index < tabElements.length; index++) {
      const rect = tabElements[index].getBoundingClientRect();
      if (clientX < rect.left + rect.width / 2) {
        return index;
      }
    }
    return tabElements.length;
  };

  return (
    <div className="cn-tabstrip" onDoubleClick={onOpenPicker}>
      <div
        className="cn-tabs"
        ref={tabsRef}
        onDragOver={(event: React.DragEvent) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          setInsertionIndex(computeInsertionIndex(event.clientX));
        }}
        onDragLeave={(event: React.DragEvent) => {
          if (!tabsRef.current?.contains(event.relatedTarget as Node)) {
            setInsertionIndex(null);
          }
        }}
        onDrop={(event: React.DragEvent) => {
          event.preventDefault();
          const index = computeInsertionIndex(event.clientX);
          setInsertionIndex(null);
          onTabDrop(index);
        }}
      >
        {tabs.map((tab, index) => (
          <React.Fragment key={tab.id}>
            {insertionIndex === index && <div className="cn-tab-insert" />}
            <div
              className={
                'cn-tab' + (tab.id === activeTabId ? ' cn-tab-active' : '')
              }
              title={tab.file}
              draggable
              onDragStart={(event: React.DragEvent) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', tab.file);
                onTabDragStart(tab.id);
              }}
              onDragEnd={onTabDragEnd}
              onClick={() => onActivate(tab.id)}
              onAuxClick={(event: React.MouseEvent) => {
                // Middle-click closes, like VS Code.
                if (event.button === 1) {
                  onClose(tab.id);
                }
              }}
            >
              <span className="cn-tab-icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="14" height="14">
                  <path
                    fill="currentColor"
                    d="M3 2.5A1.5 1.5 0 0 1 4.5 1h3.379a1.5 1.5 0 0 1 1.06.44l1.621 1.621A1.5 1.5 0 0 0 11.62 3.5H13.5A1.5 1.5 0 0 1 15 5v8.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 13.5v-11Z"
                    opacity="0.85"
                  />
                </svg>
              </span>
              <span className="cn-tab-label">{basename(tab.file)}</span>
              <button
                type="button"
                className="cn-tab-close"
                title="Close (Alt+W)"
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation();
                  onClose(tab.id);
                }}
              >
                <svg viewBox="0 0 16 16" width="12" height="12">
                  <path
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    d="M4 4l8 8M12 4l-8 8"
                  />
                </svg>
              </button>
            </div>
          </React.Fragment>
        ))}
        {insertionIndex === tabs.length && <div className="cn-tab-insert" />}
      </div>
      <div className="cn-tabstrip-actions">
        <button
          type="button"
          className="cn-iconbtn"
          title="Open file (Ctrl/Cmd+P)"
          onClick={onOpenPicker}
        >
          <svg viewBox="0 0 16 16" width="14" height="14">
            <circle
              cx="6.5"
              cy="6.5"
              r="4"
              stroke="currentColor"
              strokeWidth="1.4"
              fill="none"
            />
            <path
              d="M9.5 9.5L13.5 13.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="cn-iconbtn"
          title="Split right (Ctrl/Cmd+\)"
          onClick={() => onSplit('horizontal')}
        >
          <svg viewBox="0 0 16 16" width="14" height="14">
            <rect
              x="2"
              y="3"
              width="5.5"
              height="10"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.3"
              fill="none"
            />
            <rect
              x="8.5"
              y="3"
              width="5.5"
              height="10"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.3"
              fill="none"
            />
          </svg>
        </button>
        {/* An empty pane is just its welcome card — without this button it
          could never be dismissed again after splitting. */}
        {tabs.length === 0 && canClose && (
          <button
            type="button"
            className="cn-iconbtn"
            title="Close pane"
            onClick={onClosePane}
          >
            <svg viewBox="0 0 16 16" width="14" height="14">
              <path
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                d="M4 4l8 8M12 4l-8 8"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
