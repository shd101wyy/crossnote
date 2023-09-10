import classNames from 'classnames';
import React from 'react';
import PreviewContainer from '../containers/preview';
import Backlinks from './Backlinks';
import ContextMenu from './ContextMenu';
import Footer from './Footer';
import ImageHelper from './ImageHelper';
import RefreshingIcon from './RefreshingIcon';
import SidebarToc from './SidebarToc';
import { Topbar } from './Topbar';

export default function Preview() {
  const {
    hiddenPreviewElement,
    isPresentationMode,
    isRefreshingPreview,
    previewElement,
    setIsMouseOverPreview,
    showContextMenu,
    showBacklinks,
  } = PreviewContainer.useContainer();

  return (
    <div
      onMouseEnter={() => {
        setIsMouseOverPreview(true);
      }}
      onMouseLeave={() => {
        setIsMouseOverPreview(false);
      }}
    >
      {/** top bar */}
      <Topbar></Topbar>
      {/** The hidden preview */}
      <div
        className="crossnote markdown-preview hidden-preview"
        data-fore="preview"
        ref={hiddenPreviewElement}
        style={{ zIndex: 0 }}
      />
      {/** The real preview */}
      <div
        className={classNames(
          'crossnote markdown-preview ',
          isPresentationMode ? '!p-0' : '',
        )}
        data-for="preview"
        ref={previewElement}
        onContextMenu={event => {
          showContextMenu({
            event,
          });
        }}
      ></div>
      {/** Backlinks */}
      {showBacklinks && <Backlinks></Backlinks>}

      <Footer></Footer>
      {/** Sidebar TOC */}
      <SidebarToc></SidebarToc>
      {/** Some other components */}
      {isRefreshingPreview && <RefreshingIcon></RefreshingIcon>}
      {/** Image helper */}
      <ImageHelper></ImageHelper>
      {/** Context menu */}
      <ContextMenu></ContextMenu>
      {/* <div className="markdown-spinner"> Loading Markdown\u2026 </div> */}
    </div>
  );
}
