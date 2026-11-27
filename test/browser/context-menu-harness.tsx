import React from 'react';
import { createRoot } from 'react-dom/client';
import ContextMenu from '../../src/webview/components/ContextMenu';
import PreviewContainer from '../../src/webview/containers/preview';

/**
 * Mounts the real context menu under the real preview container, without the
 * rest of the preview UI. A right-click on the preview shows the menu, as it
 * does in `Preview`.
 */
function Harness() {
  const { previewElement, showContextMenu } = PreviewContainer.useContainer();
  return (
    <>
      <div
        className="crossnote markdown-preview"
        data-for="preview"
        ref={previewElement}
        onContextMenu={(event) => showContextMenu({ event })}
        style={{ minHeight: '100vh' }}
      >
        <p>Text</p>
      </div>
      <ContextMenu />
    </>
  );
}

createRoot(document.body).render(
  <PreviewContainer.Provider>
    <Harness />
  </PreviewContainer.Provider>,
);
