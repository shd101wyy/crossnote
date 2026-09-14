import React, { useEffect, useRef, useState } from 'react';

export interface PreviewFrameProps {
  tabId: string;
  file: string;
  visible: boolean;
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
 */
export default function PreviewFrame({
  tabId,
  file,
  visible,
  onRegister,
  onBecameVisible,
  onFrameFocus,
}: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
  }, [tabId, file, onRegister]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    // Let the browser lay the iframe out before rehydrating content.
    const timer = setTimeout(() => onBecameVisible(tabId), 80);
    return () => clearTimeout(timer);
  }, [visible, tabId, onBecameVisible]);

  return (
    <iframe
      ref={iframeRef}
      src={`/preview?file=${encodeURIComponent(file)}&r=${reloadKey}`}
      title={file}
      className="cn-frame"
      style={{ display: visible ? 'block' : 'none' }}
      onLoad={handleIframeLoad}
    />
  );
}
