import {
  ArrowPathIcon,
  ChevronUpIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import WebviewContainer from '../containers/webview';

export function Topbar() {
  const {
    clickSidebarTocButton,
    isMobile,
    isMouseOverPreview,
    previewElement,
    isPresentationMode,
    postMessage,
    sourceUri,
  } = WebviewContainer.useContainer();

  const backToTop = useCallback(() => {
    if (isPresentationMode) {
      return window['Reveal'].slide(0);
    } else if (previewElement.current) {
      previewElement.current.scrollTop = 0;
    }
  }, [isPresentationMode, previewElement]);

  const refreshPreview = useCallback(() => {
    postMessage('refreshPreview', [sourceUri.current]);
  }, [postMessage, sourceUri]);

  return (
    <div
      className={classNames(
        'fixed top-0 w-full z-50 pr-2',
        isMobile || isMouseOverPreview ? '' : 'hidden',
      )}
    >
      <div className="flex flex-row justify-end items-center backdrop-blur-xl float-right rounded-md">
        <div
          className="p-2 cursor-pointer hover:scale-110"
          title="Back to top"
          onClick={backToTop}
        >
          <ChevronUpIcon className="w-6 h-6"></ChevronUpIcon>
        </div>
        <div
          className="p-2 cursor-pointer hover:scale-105"
          title="Refresh the preview"
          onClick={refreshPreview}
        >
          <ArrowPathIcon className="w-5 h-5"></ArrowPathIcon>
        </div>
        <div
          className="p-2 cursor-pointer hover:scale-105"
          onClick={clickSidebarTocButton}
          title={'Toggle table of contents'}
        >
          <ListBulletIcon className="w-6 h-6"></ListBulletIcon>
        </div>
      </div>
    </div>
  );
}
