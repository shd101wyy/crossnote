import { mdiPencil } from '@mdi/js';
import Icon from '@mdi/react';
import React, { useCallback } from 'react';
import PreviewContainer from '../containers/preview';

export default function FloatingActions() {
  const { highlightElement } = PreviewContainer.useContainer();

  const onMouseOver = useCallback(() => {
    if (highlightElement) {
      highlightElement.classList.add('highlight-line');
    }
  }, [highlightElement]);

  const onMouseOut = useCallback(() => {
    if (highlightElement) {
      highlightElement.classList.remove('highlight-line');
    }
  }, [highlightElement]);

  if (!highlightElement) {
    return null;
  } else {
    // Put text "hello, world" on top right of the highlightElement
    return (
      <div
        className="absolute top-0 right-0"
        style={{
          transform: `translate(-32px, ${highlightElement.offsetTop}px)`,
        }}
      >
        <button
          className="btn btn-primary btn-circle btn-xs"
          onMouseOver={onMouseOver}
          onMouseOut={onMouseOut}
        >
          <Icon path={mdiPencil} size={0.6}></Icon>
        </button>
      </div>
    );
  }
}
