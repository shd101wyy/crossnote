import classNames from 'classnames';
import React from 'react';
import PreviewContainer from '../containers/preview';
import Backlinks from './Backlinks';
import ContextMenu from './ContextMenu';
import FloatingActions from './FloatingActions';
import Footer from './Footer';
import ImageHelper from './ImageHelper';
import LoadingIcon from './LoadingIcon';
import MarkdownEditor from './MarkdownEditor';
import RefreshingIcon from './RefreshingIcon';
import SidebarToc from './SidebarToc';
import { Topbar } from './Topbar';

export default function Preview() {
  const {
    hiddenPreviewElement,
    isPresentationMode,
    isLoadingPreview,
    isRefreshingPreview,
    previewElement,
    setIsMouseOverPreview,
    showContextMenu,
    showBacklinks,
    highlightElementBeingEdited,
  } = PreviewContainer.useContainer();

  return (
    <div
      onMouseEnter={() => {
        setIsMouseOverPreview(true);
      }}
      onMouseLeave={() => {
        setIsMouseOverPreview(false);
      }}
      className={classNames(
        'w-full min-h-screen',
        isPresentationMode ? 'h-full' : 'h-auto',
      )}
      onContextMenu={(event) => {
        showContextMenu({
          event,
        });
      }}
    >
      {/** Background */}
      <div className="crossnote markdown-preview w-full h-full fixed top-0 left-0 select-none"></div>
      {/** Top bar */}
      <Topbar></Topbar>
      {/** The hidden preview */}
      <div
        className="crossnote markdown-preview hidden-preview fixed invisible select-none"
        data-fore="preview"
        ref={hiddenPreviewElement}
        style={{ zIndex: 0 }}
      />
      {/** The real preview
       * NOTE: the className only accepts `crossnote markdown-preview`
       */}
      <div
        className={'crossnote markdown-preview'}
        data-for="preview"
        ref={previewElement}
      ></div>
      {/** Backlinks */}
      {showBacklinks && !isPresentationMode && <Backlinks></Backlinks>}
      {/** Footer */}
      <Footer></Footer>
      {/** Sidebar TOC */}
      <SidebarToc></SidebarToc>
      {/** Loading Preview */}
      {isLoadingPreview && <LoadingIcon></LoadingIcon>}
      {/** Refreshing Preview */}
      {isRefreshingPreview && <RefreshingIcon></RefreshingIcon>}
      {/** Image helper */}
      <ImageHelper></ImageHelper>
      {/** Context menu */}
      <ContextMenu></ContextMenu>
      {/** Floating Actions */}
      <FloatingActions></FloatingActions>
      {/** Markdown Editor */}
      {highlightElementBeingEdited && <MarkdownEditor></MarkdownEditor>}
    </div>
  );
}
