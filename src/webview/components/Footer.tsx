import { Bars3Icon, LinkIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import React from 'react';
import PreviewContainer from '../containers/preview';
export default function Footer() {
  const {
    showContextMenu,
    isMobile,
    isMouseOverPreview,
    isPresentationMode,
    setShowBacklinks,
  } = PreviewContainer.useContainer();
  return (
    <div
      className={classNames(
        'fixed bottom-0 w-full z-50 pr-2',
        isMobile || isMouseOverPreview ? '' : 'hidden',
        isPresentationMode ? 'hidden' : '',
      )}
    >
      <div className="flex flex-row justify-end items-center backdrop-blur-xl float-right rounded-md">
        <div
          className="p-2 cursor-pointer hover:scale-105"
          title="Show backlinks"
          onClick={() => {
            setShowBacklinks(x => !x);
          }}
        >
          <LinkIcon className="w-6 h-6"></LinkIcon>
        </div>
        <div
          className="p-2 cursor-pointer hover:scale-105"
          title={'Open menu'}
          onClick={event => {
            showContextMenu({
              event,
            });
          }}
        >
          <Bars3Icon className="w-6 h-6"></Bars3Icon>
        </div>
      </div>
    </div>
  );
}
