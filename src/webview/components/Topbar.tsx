import React from 'react';
import WebviewContainer from '../containers/webview';

export function Topbar() {
  const { clickSidebarTocButton } = WebviewContainer.useContainer();

  return (
    <div className="absolute top-0 w-full flex flex-row justify-end">
      <div>
        <span>⬆︎</span>
      </div>
      <div>
        <span>⟳︎</span>
      </div>
      <div onClick={clickSidebarTocButton}>
        <span>§</span>
      </div>
    </div>
  );
}
