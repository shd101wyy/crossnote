import React from 'react';
import { Tab } from '../types';
import { basename } from '../lib/api';

export interface TabStripProps {
  tabs: Tab[];
  activeTabId: string | null;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onOpenPicker: () => void;
  onSplit: (direction: 'horizontal' | 'vertical') => void;
}

export default function TabStrip({
  tabs,
  activeTabId,
  onActivate,
  onClose,
  onOpenPicker,
  onSplit,
}: TabStripProps) {
  return (
    <div className="cn-tabstrip" onDoubleClick={onOpenPicker}>
      <div className="cn-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={
              'cn-tab' + (tab.id === activeTabId ? ' cn-tab-active' : '')
            }
            title={tab.file}
            onClick={() => onActivate(tab.id)}
            onAuxClick={(event) => {
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
              onClick={(event) => {
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
        ))}
      </div>
      <div className="cn-tabstrip-actions">
        <button
          type="button"
          className="cn-iconbtn"
          title="Open file (Ctrl/Cmd+P)"
          onClick={onOpenPicker}
        >
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path
              stroke="currentColor"
              strokeWidth="1.4"
              fill="none"
              d="M8 2v8M4 6l4 4 4-4M3 13h10"
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
      </div>
    </div>
  );
}
