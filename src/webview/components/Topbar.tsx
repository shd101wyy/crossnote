import {
  ArrowPathIcon,
  ChevronUpIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import WebviewContainer from '../containers/webview';

export function Topbar() {
  const { clickSidebarTocButton } = WebviewContainer.useContainer();

  return (
    <div className="fixed top-0 w-full z-50 pr-4">
      <div className=" flex flex-row justify-end items-center">
        <div className="p-2 cursor-pointer hover:scale-110" title="Back to top">
          <ChevronUpIcon className="w-6 h-6"></ChevronUpIcon>
        </div>
        <div
          className="p-2 cursor-pointer hover:scale-105"
          title="Refresh the preview"
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
