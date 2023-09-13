import classNames from 'classnames';
import React from 'react';
import PreviewContainer from '../containers/preview';
import { getElementBackgroundColor } from '../lib/utility';

export default function SidebarToc() {
  const { sidebarTocElement, showSidebarToc } = PreviewContainer.useContainer();
  return (
    <div
      className={classNames('md-sidebar-toc', showSidebarToc ? '' : 'hidden')}
      ref={sidebarTocElement}
      style={{
        backgroundColor: getElementBackgroundColor(document.body),
      }}
    ></div>
  );
}
