import {
  Bars3Icon,
  LinkIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import readingTime from 'reading-time/lib/reading-time';
import PreviewContainer from '../containers/preview';
import { getElementBackgroundColor } from '../lib/utility';

export default function Footer() {
  const {
    showContextMenu,
    setShowBacklinks,
    isPresentationMode,
    isMouseOverPreview,
    isMobile,
    showBacklinks,
    theme,
    markdown,
    enablePreviewZenMode,
    postMessage,
    sourceUri,
    zoomIn,
    zoomOut,
  } = PreviewContainer.useContainer();
  const [readingTimeEstimation, setReadingTimeEstimation] = useState<
    | {
        minutes: number;
        words: number;
        text: string;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    const readingTimeEstimation = readingTime(markdown);
    setReadingTimeEstimation(readingTimeEstimation);
  }, [markdown]);

  return (
    <div
      className={classNames(
        'footer fixed bottom-0 w-full z-50 pr-2 bg-transparent select-none h-7',
        isPresentationMode ? 'hidden' : '',
      )}
      data-theme={theme}
    >
      <div
        className={
          'w-full flex flex-row items-center backdrop-blur-xl ' +
          (enablePreviewZenMode ? 'justify-end' : 'justify-between')
        }
        style={{
          backgroundColor: getElementBackgroundColor(document.body),
        }}
      >
        {!enablePreviewZenMode && readingTimeEstimation && (
          <div className={classNames('p-1 ml-2 text-xs')}>
            {readingTimeEstimation.text}
          </div>
        )}
        <div
          className={classNames(
            'flex flex-row justify-end items-center',
            isMobile || isMouseOverPreview ? '' : 'invisible',
          )}
        >
          <div
            className="p-1 cursor-pointer hover:text-primary w-5 h-5"
            title="Open graph view"
            onClick={() => {
              postMessage('openGraphView', [sourceUri.current]);
            }}
          >
            <ShareIcon className="w-5 h-5"></ShareIcon>
          </div>
          <div
            className={classNames(
              'p-1 cursor-pointer hover:text-primary w-5 h-5',
              showBacklinks ? 'text-primary font-bold' : '',
            )}
            title="Toggle backlinks"
            onClick={() => {
              setShowBacklinks((x) => !x);
            }}
          >
            <LinkIcon className="w-5 h-5"></LinkIcon>
          </div>
          <div
            className="p-1 cursor-pointer hover:text-primary w-5 h-5"
            title="Zoom out"
            onClick={() => zoomOut()}
          >
            <MagnifyingGlassMinusIcon className="w-5 h-5"></MagnifyingGlassMinusIcon>
          </div>
          <div
            className="p-1 cursor-pointer hover:text-primary w-5 h-5"
            title="Zoom in"
            onClick={() => zoomIn()}
          >
            <MagnifyingGlassPlusIcon className="w-5 h-5"></MagnifyingGlassPlusIcon>
          </div>
          <div
            className="p-1 cursor-pointer hover:text-primary w-5 h-5"
            title={'Open menu'}
            onClick={(event) => {
              showContextMenu({
                event,
              });
            }}
          >
            <Bars3Icon className="w-5 h-5"></Bars3Icon>
          </div>
        </div>
      </div>
    </div>
  );
}
