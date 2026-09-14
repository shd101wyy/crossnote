import React from 'react';
import { basename } from '../lib/api';

export interface TitleBarProps {
  rootDirectories: string[];
  vscode: boolean;
  onOpenPicker: () => void;
}

export default function TitleBar({
  rootDirectories,
  vscode,
  onOpenPicker,
}: TitleBarProps) {
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  return (
    <header className="cn-titlebar">
      <div className="cn-titlebar-left">
        <svg viewBox="0 0 64 64" width="18" height="18" aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#95c258" />
          <path
            d="M40.5 22.5a12.5 12.5 0 1 0 0 19"
            stroke="#1e1e1e"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <span className="cn-titlebar-title">crossnote</span>
        <span className="cn-titlebar-sep" aria-hidden="true">
          /
        </span>
        <span className="cn-titlebar-root" title={rootDirectories.join('\n')}>
          {basename(rootDirectories[0] ?? '') ||
            rootDirectories[0] ||
            'no folder'}
          {rootDirectories.length > 1 && (
            <span className="cn-titlebar-count">
              {' '}
              +{rootDirectories.length - 1}
            </span>
          )}
        </span>
        {vscode && (
          <span
            className="cn-titlebar-badge"
            title="Config: VS Code settings + ~/.crossnote + workspace .crossnote"
          >
            vscode config
          </span>
        )}
      </div>
      <button
        type="button"
        className="cn-titlebar-open"
        onClick={onOpenPicker}
        title={`Open file (${isMac ? '⌘' : 'Ctrl+'}P)`}
      >
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
          <circle
            cx="7"
            cy="7"
            r="4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M10.5 10.5L14 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Open file
        <span className="cn-kbd-group">
          <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
          <kbd>P</kbd>
        </span>
      </button>
    </header>
  );
}
