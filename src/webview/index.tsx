import React from 'react';
import { createRoot } from 'react-dom/client';
import Webview from './components/Webview';
import WebviewContainer from './containers/webview';

// Clear the existing HTML content
document.body.innerHTML = '<div id="app"></div>';

// Render your React component instead
const root = createRoot(document.body);
root.render(
  <WebviewContainer.Provider>
    <Webview />
  </WebviewContainer.Provider>,
);
