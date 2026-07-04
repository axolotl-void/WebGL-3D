import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Global Debug Console Error Overlay
const debugContainer = document.createElement('div');
debugContainer.id = 'debug-error-log';
debugContainer.style.cssText = 'position:fixed;top:10px;left:10px;z-index:99999;color:red;background:rgba(0,0,0,0.85);padding:10px;font-family:monospace;font-size:12px;max-height:80vh;overflow-y:auto;pointer-events:none;border:1px solid red;';
document.body.appendChild(debugContainer);

window.addEventListener('error', (event) => {
  debugContainer.innerHTML += `<div>Error: ${event.message} at ${event.filename}:${event.lineno}</div>`;
});

window.addEventListener('unhandledrejection', (event) => {
  debugContainer.innerHTML += `<div>Rejection: ${event.reason}</div>`;
});

const originalConsoleError = console.error;
console.error = (...args) => {
  debugContainer.innerHTML += `<div style="margin-bottom:5px;">Console Error: ${args.map(a => typeof a === 'object' ? (a instanceof Error ? a.message : JSON.stringify(a)) : String(a)).join(' ')}</div>`;
  originalConsoleError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
