import React from 'react';
import { createRoot } from 'react-dom/client';
import GraphViewComponent from './components/GraphViewComponent';
import './index.css';

document.body.innerHTML = '<div id="app"></div>';

const root = createRoot(document.body);
root.render(<GraphViewComponent />);
