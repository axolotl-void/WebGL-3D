import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ponytail: this is a scroll-driven single-page experience. Disable the
// browser's scroll restoration so a reload always starts at the top instead of
// restoring a stale scroll position (which desyncs the camera vs overlays).
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
