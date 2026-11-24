import React from 'react';
import { createRoot } from 'react-dom/client';
import PreviewContainer from '../../src/webview/containers/preview';

/**
 * Minimal mount of the real preview container so browser tests can drive
 * `updateHtml` / `initEvents` / `renderMathJax` without the full preview UI
 * (monaco, context menu, …).
 */
function Harness() {
  const { hiddenPreviewElement, previewElement } =
    PreviewContainer.useContainer();
  return (
    <>
      <div
        className="crossnote markdown-preview hidden-preview"
        data-fore="preview"
        ref={hiddenPreviewElement}
      />
      <div
        className="crossnote markdown-preview"
        data-for="preview"
        ref={previewElement}
      />
    </>
  );
}

const mount = document.createElement('div');
document.body.appendChild(mount);
createRoot(mount).render(
  <PreviewContainer.Provider>
    <Harness />
  </PreviewContainer.Provider>,
);
