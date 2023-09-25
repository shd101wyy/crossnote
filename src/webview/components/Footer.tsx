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
    showBacklinks,
    theme,
  } = PreviewContainer.useContainer();
  return (
    <div
      className={classNames(
        'fixed bottom-0 w-full z-50 pr-2 bg-transparent select-none',
        isMobile || isMouseOverPreview ? '' : 'hidden',
        isPresentationMode ? 'hidden' : '',
      )}
      data-theme={theme}
    >
      <div className="flex flex-row justify-end items-center backdrop-blur-xl float-right rounded-md">
        <div
          className={classNames(
            'p-2 cursor-pointer hover:scale-105',
            showBacklinks ? 'text-primary font-bold' : '',
          )}
          title="Toggle backlinks"
          onClick={() => {
            setShowBacklinks((x) => !x);
          }}
        >
          <LinkIcon className="w-6 h-6"></LinkIcon>
        </div>
        <div
          className="p-2 cursor-pointer hover:scale-105"
          title={'Open menu'}
          onClick={(event) => {
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
