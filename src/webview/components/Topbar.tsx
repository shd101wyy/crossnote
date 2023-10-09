import {
  ArrowPathIcon,
  ChevronUpIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import PreviewContainer from '../containers/preview';

export function Topbar() {
  const {
    clickSidebarTocButton,
    isMobile,
    isMouseOverPreview,
    isPresentationMode,
    postMessage,
    sourceUri,
    showSidebarToc,
    theme,
  } = PreviewContainer.useContainer();

  const backToTop = useCallback(() => {
    if (isPresentationMode) {
      return window['Reveal'].slide(0);
    } else {
      document.documentElement.scrollTop = 0;
    }
  }, [isPresentationMode]);

  const refreshPreview = useCallback(() => {
    postMessage('refreshPreview', [sourceUri.current]);
  }, [postMessage, sourceUri]);

  return (
    <div
      className={classNames(
        'topbar fixed top-0 w-full z-50 pr-2 bg-transparent select-none',
        isMobile || isMouseOverPreview ? '' : 'hidden',
        // isPresentationMode ? 'hidden' : '',
      )}
      data-theme={theme}
    >
      <div className="flex flex-row justify-end items-center backdrop-blur-xl float-right rounded-md">
        <div
          className="p-2 cursor-pointer hover:text-primary w-5 h-5"
          title="Back to top"
          onClick={backToTop}
        >
          <ChevronUpIcon className="w-5 h-5"></ChevronUpIcon>
        </div>
        <div
          className="p-2 cursor-pointer hover:text-primary w-5 h-5"
          title="Refresh the preview"
          onClick={refreshPreview}
        >
          <ArrowPathIcon className="w-5 h-5"></ArrowPathIcon>
        </div>
        <div
          className={classNames(
            'p-2 cursor-pointer hover:text-primary w-5 h-5',
            showSidebarToc ? 'text-primary font-bold' : '',
          )}
          onClick={clickSidebarTocButton}
          title={'Toggle table of contents'}
        >
          <ListBulletIcon className="w-5 h-5"></ListBulletIcon>
        </div>
      </div>
    </div>
  );
}
