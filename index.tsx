import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { registerSW } from 'virtual:pwa-register';

// Register the PWA service worker so the app can be installed and work offline (as configured)
registerSW({ immediate: true });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
