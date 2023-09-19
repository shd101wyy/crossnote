import React from 'react';
import PreviewContainer from '../containers/preview';

export default function RefreshingIcon() {
  const { theme } = PreviewContainer.useContainer();

  return (
    <div className="fixed left-2 bottom-2 select-none" data-theme={theme}>
      <span className="loading loading-bars loading-md"></span>
    </div>
  );
}
