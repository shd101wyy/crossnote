import classNames from 'classnames';
import React from 'react';
import PreviewContainer from '../containers/preview';

export default function SidebarToc() {
  const { sidebarTocElement, showSidebarToc } = PreviewContainer.useContainer();
  return (
    <div
      className={classNames('md-sidebar-toc', showSidebarToc ? '' : 'hidden')}
      ref={sidebarTocElement}
    ></div>
  );
}
