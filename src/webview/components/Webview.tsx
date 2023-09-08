import React, { useEffect, useRef } from 'react';
import WebviewContainer from '../containers/webview';
import ContextMenu from './ContextMenu';
import Footer from './Footer';
import ImageHelper from './ImageHelper';
import RefreshingIcon from './RefreshingIcon';
import { Topbar } from './Topbar';

export default function Webview() {
  const {
    setPreviewElement,
    setHiddenPreviewElement,
  } = WebviewContainer.useContainer();
  const previewElementRef = useRef<HTMLDivElement>(null);
  const hiddenPreviewElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewElementRef.current && hiddenPreviewElementRef.current) {
      setPreviewElement(previewElementRef.current);
      setHiddenPreviewElement(hiddenPreviewElementRef.current);
    }
  }, [
    previewElementRef,
    hiddenPreviewElementRef,
    setPreviewElement,
    setHiddenPreviewElement,
  ]);

  return (
    <div>
      {/** top bar */}
      <Topbar></Topbar>
      {/** The hidden preview */}
      <div
        className="crossnote markdown-preview hidden-preview"
        data-fore="preview"
        ref={hiddenPreviewElementRef}
        style={{ zIndex: 0 }}
      />
      {/** The real preview */}
      <div
        className={'crossnote markdown-preview '}
        data-for="preview"
        ref={previewElementRef}
      ></div>
      <Footer></Footer>

      {/** Some other components */}
      <RefreshingIcon></RefreshingIcon>
      {/** Image helper */}
      <ImageHelper></ImageHelper>
      {/** Context menu */}
      <ContextMenu></ContextMenu>
      {/* <div className="markdown-spinner"> Loading Markdown\u2026 </div> */}
    </div>
  );
}
