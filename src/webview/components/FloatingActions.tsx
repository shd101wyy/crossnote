import {
  mdiClose,
  mdiContentCopy,
  mdiDotsHorizontal,
  mdiPencil,
} from '@mdi/js';
import Icon from '@mdi/react';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import PreviewContainer from '../containers/preview';

export default function FloatingActions() {
  const {
    highlightElement,
    getHighlightElementLineRange,
    markdown,
    highlightElementBeingEdited,
    setHighlightElementBeingEdited,
  } = PreviewContainer.useContainer();
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showCopiedTooltip, setShowCopiedTooltip] = useState<
    string | undefined
  >(undefined);

  const onMouseOver = useCallback(() => {
    const highlightLineElements = document.querySelectorAll('.highlight-line');
    highlightLineElements.forEach((element) => {
      element.classList.add('highlight-active');
    });
  }, []);

  const onMouseOut = useCallback(() => {
    const highlightLineElements = document.querySelectorAll('.highlight-line');
    highlightLineElements.forEach((element) => {
      element.classList.remove('highlight-active');
    });
    setShowCopiedTooltip(undefined);
  }, []);

  const copyToClipboard = useCallback(() => {
    if (!highlightElement) {
      return;
    }
    const range = getHighlightElementLineRange(highlightElement);
    if (!range) {
      return;
    }

    const [start, end] = range;
    const lines = markdown.split('\n');
    const copiedLines = lines.slice(start, end);

    const textArea = document.createElement('textarea');
    textArea.value = copiedLines.join('\n');
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    setShowCopiedTooltip(`Markdown copied!`);

    setTimeout(() => {
      setShowCopiedTooltip(undefined);
    }, 1000);
  }, [highlightElement, getHighlightElementLineRange, markdown]);

  if (!highlightElement || !!highlightElementBeingEdited) {
    return null;
  } else {
    // Put text "hello, world" on top right of the highlightElement
    return createPortal(
      <div
        className={classNames(
          'absolute top-0 right-0 select-none floating-action flex flex-col items-end',
        )}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
      >
        <button
          className="btn btn-primary btn-circle btn-xs"
          onClick={() => setShowMoreActions(!showMoreActions)}
        >
          {showMoreActions ? (
            <Icon path={mdiClose} size={0.6}></Icon>
          ) : (
            <Icon path={mdiDotsHorizontal} size={0.6}></Icon>
          )}
        </button>
        {showMoreActions && (
          <div className="flex flex-row items-center mt-1">
            <div
              className={classNames(
                'ml-1 flex',
                showCopiedTooltip ? 'tooltip tooltip-open' : '',
              )}
              data-tip={showCopiedTooltip}
            >
              <button
                className="btn btn-primary btn-circle btn-xs"
                title={'Copy the part of markdown'}
                onClick={copyToClipboard}
              >
                <Icon path={mdiContentCopy} size={0.6}></Icon>
              </button>
            </div>
            <div className="ml-1 flex">
              <button
                className="btn btn-primary btn-circle btn-xs"
                title={'Edit the part of markdown'}
                onClick={() => setHighlightElementBeingEdited(highlightElement)}
              >
                <Icon path={mdiPencil} size={0.6}></Icon>
              </button>
            </div>
          </div>
        )}
      </div>,
      highlightElement,
    );
  }
}
