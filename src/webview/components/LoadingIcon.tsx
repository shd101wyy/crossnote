import React from 'react';

export default function LoadingIcon() {
  return (
    <div
      className="markdown-preview fixed top-0 left-0 w-full h-full z-50"
      style={{
        backgroundColor: getComputedStyle(document.body).backgroundColor,
      }}
    >
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="loading loading-bars loading-md"></span>
      </div>
    </div>
  );
}
