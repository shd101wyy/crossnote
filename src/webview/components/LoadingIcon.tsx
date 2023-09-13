import React from 'react';
import PreviewContainer from '../containers/preview';

export default function LoadingIcon() {
  const { theme } = PreviewContainer.useContainer();
  return (
    <div
      className="markdown-preview fixed top-0 left-0 w-full h-full z-50"
      style={{
        backgroundColor: getComputedStyle(document.body).backgroundColor,
      }}
      data-theme={theme}
    >
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="loading loading-bars loading-md"></span>
      </div>
    </div>
  );
}
