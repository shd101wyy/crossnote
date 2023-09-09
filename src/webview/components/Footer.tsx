import { Bars3Icon } from '@heroicons/react/24/outline';
import React from 'react';
import WebviewContainer from '../containers/webview';
export default function Footer() {
  const { showContextMenu } = WebviewContainer.useContainer();
  return (
    <div className="fixed bottom-0 w-full z-50 pr-4">
      <div className="flex flex-row justify-end">
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
