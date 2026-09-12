import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MarkdownFileInfo, fetchFiles } from '../lib/api';
import { indexFiles, rankFiles } from '../lib/fuzzy';

export interface FilePickerProps {
  open: boolean;
  recents: string[];
  onClose: () => void;
  onOpenFile: (file: string) => void;
}

const MAX_RESULTS = 60;

/**
 * VS Code–style quick-open picker: fuzzy search over every markdown file in
 * the served directory, keyboard-first (↑/↓/Enter/Esc).
 */
export default function FilePicker({
  open,
  recents,
  onClose,
  onOpenFile,
}: FilePickerProps) {
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<MarkdownFileInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery('');
    setSelectedIndex(0);
    let cancelled = false;
    fetchFiles()
      .then((result) => {
        if (!cancelled) {
          setFiles(result);
        }
      })
      .catch((error: unknown) =>
        console.error('crossnote serve: failed to list files:', error),
      );
    inputRef.current?.focus();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const indexed = useMemo(() => indexFiles(files), [files]);

  const results = useMemo(() => {
    const ranked = rankFiles(query, indexed);
    if (ranked) {
      return ranked.slice(0, MAX_RESULTS);
    }
    // Empty query: recents first, then most recently modified.
    const recentsSet = new Set(recents);
    const byRecency = [...recents]
      .map((file) => files.find((candidate) => candidate.absolutePath === file))
      .filter((file): file is MarkdownFileInfo => !!file);
    const rest = files
      .filter((file) => !recentsSet.has(file.absolutePath))
      .sort((a, b) => b.mtimeMs - a.mtimeMs);
    return [...byRecency, ...rest].slice(0, MAX_RESULTS);
  }, [query, indexed, files, recents]);

  useEffect(() => {
    setSelectedIndex((index) =>
      Math.min(index, Math.max(results.length - 1, 0)),
    );
  }, [results.length]);

  useEffect(() => {
    const selected = listRef.current?.children[selectedIndex];
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) {
    return null;
  }

  const choose = (file: string) => {
    onOpenFile(file);
    onClose();
  };

  const splitPath = (relativePath: string): [string, string] => {
    const index = relativePath.lastIndexOf('/');
    return [relativePath.slice(0, index + 1), relativePath.slice(index + 1)];
  };

  return (
    <div className="cn-picker-backdrop" onMouseDown={onClose}>
      <div
        className="cn-picker"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="cn-picker-input"
          placeholder="Search markdown files by name…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setSelectedIndex((index) =>
                Math.min(index + 1, results.length - 1),
              );
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setSelectedIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              const result = results[selectedIndex];
              if (result) {
                choose(result.absolutePath);
              }
            } else if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
            }
          }}
        />
        <div className="cn-picker-list" ref={listRef}>
          {results.length === 0 && (
            <div className="cn-picker-empty">
              {files.length === 0
                ? 'No markdown files found in this directory.'
                : 'No matching files.'}
            </div>
          )}
          {results.map((result, index) => {
            const [dir, base] = splitPath(result.relativePath);
            return (
              <div
                key={result.absolutePath}
                className={
                  'cn-picker-item' +
                  (index === selectedIndex ? ' cn-picker-item-selected' : '')
                }
                onMouseMove={() => setSelectedIndex(index)}
                onClick={() => choose(result.absolutePath)}
              >
                <span className="cn-picker-base">{base}</span>
                <span className="cn-picker-dir">{dir}</span>
              </div>
            );
          })}
        </div>
        <div className="cn-picker-footer">
          <span>↑↓ to navigate</span>
          <span>↵ to open</span>
          <span>esc to dismiss</span>
        </div>
      </div>
    </div>
  );
}
