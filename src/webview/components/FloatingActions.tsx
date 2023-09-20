import { mdiDotsHorizontal } from '@mdi/js';
import Icon from '@mdi/react';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import PreviewContainer from '../containers/preview';

export default function FloatingActions() {
  const { highlightElement } = PreviewContainer.useContainer();

  const onMouseOver = useCallback(() => {
    const highlightLineElements = document.querySelectorAll('.highlight-line');
    highlightLineElements.forEach(element => {
      element.classList.add('highlight-active');
    });
  }, []);

  const onMouseOut = useCallback(() => {
    const highlightLineElements = document.querySelectorAll('.highlight-line');
    highlightLineElements.forEach(element => {
      element.classList.remove('highlight-active');
    });
  }, []);

  if (!highlightElement) {
    return null;
  } else {
    // Put text "hello, world" on top right of the highlightElement
    return createPortal(
      <div
        className={classNames('absolute top-0 right-0 select-none')}
        /*
          style={{
            transform: `translate(${highlightElement.offsetLeft +
              highlightElement.offsetWidth -
              24}px, ${highlightElement.offsetTop}px)`,
          }}
          */
      >
        <button
          className="btn btn-primary btn-circle btn-xs"
          onMouseOver={onMouseOver}
          onMouseOut={onMouseOut}
        >
          <Icon path={mdiDotsHorizontal} size={0.6}></Icon>
        </button>
      </div>,
      highlightElement,
    );
  }
}
