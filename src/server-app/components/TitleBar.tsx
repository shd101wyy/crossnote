import React from 'react';
import { basename } from '../lib/api';
import logo from '../assets/logo.svg';

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
        <img
          className="cn-titlebar-logo"
          src={logo}
          width="20"
          height="20"
          alt=""
          aria-hidden="true"
        />
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
            cx="6.5"
            cy="6.5"
            r="4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M9.5 9.5L13.5 13.5"
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
