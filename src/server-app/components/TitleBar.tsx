import React from 'react';
import { basename } from '../lib/api';
import logo from '../assets/logo.svg';

export interface TitleBarProps {
  rootDirectories: string[];
  vscode: boolean;
  /** Current shell light/dark mode (drives the toggle's icon). */
  shellTheme: 'light' | 'dark';
  onToggleShellTheme: () => void;
  onOpenPicker: () => void;
}

export default function TitleBar({
  rootDirectories,
  vscode,
  shellTheme,
  onToggleShellTheme,
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
      <div className="cn-titlebar-right">
        <button
          type="button"
          className="cn-iconbtn cn-titlebar-theme"
          onClick={onToggleShellTheme}
          title={
            shellTheme === 'light'
              ? 'Switch to dark theme'
              : 'Switch to light theme'
          }
        >
          {shellTheme === 'light' ? (
            // Moon
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path
                d="M9.5 2.5a5.5 5.5 0 1 0 4 8.5A6 6 0 0 1 9.5 2.5z"
                fill="currentColor"
              />
            </svg>
          ) : (
            // Sun
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <circle cx="8" cy="8" r="3.2" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M8 1.2v1.8" />
                <path d="M8 13v1.8" />
                <path d="M1.2 8h1.8" />
                <path d="M13 8h1.8" />
                <path d="M3.2 3.2l1.3 1.3" />
                <path d="M11.5 11.5l1.3 1.3" />
                <path d="M12.8 3.2l-1.3 1.3" />
                <path d="M4.5 11.5l-1.3 1.3" />
              </g>
            </svg>
          )}
        </button>
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
      </div>
    </header>
  );
}
