import React from 'react';
import { basename, dirname } from '../lib/api';

export interface WelcomeProps {
  rootDirectories: string[];
  vscode: boolean;
  recents: string[];
  /**
   * Wiki mode: set when the app runs from a standalone wiki file. The card
   * then describes the snapshot instead of a server and never shows the
   * absolute paths of the machine the wiki was exported on.
   */
  wikiNoteCount?: number;
  onOpenFile: (file: string) => void;
  onOpenPicker: () => void;
}

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export default function Welcome({
  rootDirectories,
  vscode,
  recents,
  wikiNoteCount,
  onOpenFile,
  onOpenPicker,
}: WelcomeProps) {
  const modKey = isMac ? '⌘' : 'Ctrl';
  const isWiki = wikiNoteCount !== undefined;
  return (
    <div className="cn-welcome">
      <div className="cn-welcome-card">
        <svg className="cn-logo" viewBox="0 0 64 64" width="72" height="72">
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#95c258" />
          <path
            d="M40.5 22.5a12.5 12.5 0 1 0 0 19"
            stroke="#1e1e1e"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <h1>{isWiki ? 'crossnote wiki' : 'crossnote'}</h1>
        {isWiki ? (
          <p className="cn-welcome-sub">
            A read-only snapshot of {wikiNoteCount}{' '}
            {wikiNoteCount === 1 ? 'note' : 'notes'}
            {rootDirectories.length > 0 && (
              <>
                {' '}
                from{' '}
                <code className="cn-welcome-path">
                  {' '}
                  {basename(rootDirectories[0])}{' '}
                </code>
              </>
            )}
            — this file works anywhere, no server needed.
          </p>
        ) : (
          <p className="cn-welcome-sub">
            Markdown preview server —{' '}
            {rootDirectories.length > 1
              ? `${rootDirectories.length} folders are served:`
              : 'this workspace is served from'}
            {rootDirectories.map((root) => (
              <span key={root}>
                {' '}
                <code className="cn-welcome-path"> {root} </code>
              </span>
            ))}
            (
            {vscode
              ? 'VS Code + global + workspace config'
              : 'global + workspace config'}
            ).
          </p>
        )}
        <button
          type="button"
          className="cn-welcome-open"
          onClick={onOpenPicker}
        >
          Open a markdown file
          <span className="cn-kbd-group">
            <kbd>{modKey}</kbd>
            <kbd>P</kbd>
          </span>
        </button>
        {recents.length > 0 && (
          <div className="cn-welcome-recents">
            <div className="cn-welcome-section">Recent</div>
            {recents.slice(0, 8).map((file) => (
              <button
                type="button"
                key={file}
                className="cn-recent-file"
                onClick={() => onOpenFile(file)}
                title={file}
              >
                <span className="cn-recent-base">{basename(file)}</span>
                <span className="cn-recent-dir">{dirname(file)}/</span>
              </button>
            ))}
          </div>
        )}
        <div className="cn-welcome-shortcuts">
          <div className="cn-welcome-section">Shortcuts</div>
          <ul>
            <li>
              <span className="cn-kbd-group">
                <kbd>{modKey}</kbd>
                <kbd>P</kbd>
              </span>
              open file
            </li>
            <li>
              <span className="cn-kbd-group">
                <kbd>Alt</kbd>
                <kbd>W</kbd>
              </span>
              close tab
            </li>
            <li>
              <span className="cn-kbd-group">
                <kbd>{modKey}</kbd>
                <kbd>\</kbd>
              </span>
              split pane right
            </li>
            <li>
              <span className="cn-kbd-group">
                <kbd>Esc</kbd>
              </span>
              exit zen mode
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
