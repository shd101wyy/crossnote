import React, { useEffect, useRef, useState } from 'react';
import { graphAnchorFile, isGraphTab } from '../lib/api';

export interface PreviewFrameProps {
  tabId: string;
  file: string;
  visible: boolean;
  /**
   * Wiki mode: returns the assembled srcdoc for the file. Undefined in serve
   * mode, where frames load `/preview?file=…` pages from the server.
   */
  documentProvider?: (file: string) => string | undefined;
  onRegister: (
    tabId: string,
    file: string,
    iframe: HTMLIFrameElement | null,
    reload: (() => void) | null,
  ) => void;
  onBecameVisible: (tabId: string) => void;
  onFrameFocus: (tabId: string) => void;
}

/**
 * One preview = one iframe serving the unmodified crossnote webview page.
 * Inactive tabs keep their iframe mounted (scroll + diagram state survives)
 * but hidden; on reactivation the app re-sends the last `updateHtml` so
 * layout-dependent rendering (mermaid, math) recomputes.
 *
 * Wiki frames get their document via `srcdoc` from the embedded payload and
 * are sandboxed (the wiki file may be opened from anywhere — the shell only
 * trusts postMessage traffic it can attribute to one of its frames).
 */
export default function PreviewFrame({
  tabId,
  file,
  visible,
  documentProvider,
  onRegister,
  onBecameVisible,
  onFrameFocus,
}: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const wikiDocument = documentProvider?.(file);

  // Iframes swallow mouse/keyboard events, so the pane can't be activated
  // from the parent document. The preview is same-origin — hook its document
  // once loaded and report focus clicks back to the app.
  const handleIframeLoad = () => {
    try {
      const document = iframeRef.current?.contentDocument;
      document?.addEventListener('mousedown', () => onFrameFocus(tabId), {
        capture: true,
      });
    } catch {
      // Cross-origin or already navigated away — focus tracking is optional.
    }
  };

  useEffect(() => {
    onRegister(tabId, file, iframeRef.current, () =>
      setReloadKey((key) => key + 1),
    );
    return () => onRegister(tabId, file, null, null);
    // reloadKey: a wiki reload remounts the iframe (key change), so the new
    // element must be re-registered; a serve reload just navigates in place.
  }, [tabId, file, onRegister, reloadKey]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    // Let the browser lay the iframe out before rehydrating content.
    const timer = setTimeout(() => onBecameVisible(tabId), 80);
    return () => clearTimeout(timer);
  }, [visible, tabId, onBecameVisible]);

  if (documentProvider) {
    if (wikiDocument === undefined) {
      // The note isn't part of this wiki (e.g. a stale restored tab).
      return null;
    }
    // `key` remounts the iframe for a reload — re-assigning the same srcdoc
    // string would be a no-op.
    return (
      <iframe
        key={`wiki-${reloadKey}`}
        ref={iframeRef}
        srcDoc={wikiDocument}
        sandbox="allow-scripts"
        title={file}
        className="cn-frame"
        style={{ display: visible ? 'block' : 'none' }}
        onLoad={handleIframeLoad}
      />
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={
        isGraphTab(file)
          ? `/graph-view?file=${encodeURIComponent(graphAnchorFile(file))}&r=${reloadKey}`
          : `/preview?file=${encodeURIComponent(file)}&r=${reloadKey}`
      }
      title={file}
      className="cn-frame"
      style={{ display: visible ? 'block' : 'none' }}
      onLoad={handleIframeLoad}
    />
  );
}
