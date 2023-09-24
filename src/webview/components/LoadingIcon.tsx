import React, { useEffect, useState } from 'react';
import PreviewContainer from '../containers/preview';

export default function LoadingIcon() {
  const { theme } = PreviewContainer.useContainer();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
  }, [countdown]);

  return (
    <div
      className="markdown-preview fixed top-0 left-0 w-full h-full z-50 select-none"
      style={{
        backgroundColor: getComputedStyle(document.body).backgroundColor,
      }}
      data-theme={theme}
    >
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center">
          <span className="loading loading-bars loading-md"></span>
          {countdown === 0 && (
            <span className="mt-2 text-center">
              Something is wrong.
              <br /> Please close and open the preview again.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
