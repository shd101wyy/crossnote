import classNames from 'classnames';
import React from 'react';
import WebviewContainer from '../containers/webview';

export default function SidebarToc() {
  const { sidebarTocElement, showSidebarToc } = WebviewContainer.useContainer();
  return (
    <div
      className={classNames('md-sidebar-toc', showSidebarToc ? '' : 'hidden')}
      ref={sidebarTocElement}
    ></div>
  );
}
