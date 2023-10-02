import { Bars3Icon, LinkIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { readingTime } from 'reading-time-estimator';
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
    markdown,
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
        'fixed bottom-0 w-full z-50 pr-2 bg-transparent select-none',
        isMobile || isMouseOverPreview ? '' : 'hidden',
        isPresentationMode ? 'hidden' : '',
      )}
      data-theme={theme}
    >
      <div className="w-full flex flex-row justify-between items-center backdrop-blur-xl rounded-md">
        {readingTimeEstimation && (
          <div className="p-2 ml-2 text-xs">{readingTimeEstimation.text}</div>
        )}
        <div className="flex flex-row justify-end items-center">
          <div
            className={classNames(
              'p-2 cursor-pointer hover:text-primary w-5 h-5',
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
            className="p-2 cursor-pointer hover:text-primary w-5 h-5"
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
