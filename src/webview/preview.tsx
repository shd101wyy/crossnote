import React from 'react';
import { createRoot } from 'react-dom/client';
import Preview from './components/Preview';
import PreviewContainer from './containers/preview';
import './index.css';

// Clear the existing HTML content
document.body.innerHTML = '<div id="app"></div>';

// Render your React component instead
const root = createRoot(document.body);
root.render(
  <PreviewContainer.Provider>
    <Preview />
  </PreviewContainer.Provider>,
);
