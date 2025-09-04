import './assets/globals.css'
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/error-boundary'

import '@renderer/localization/i18next.config'
import LoaderComponent from './components/loader'

loader.config({ monaco });

window.addEventListener('error', (event) => {
  event.preventDefault();
  console.error('Unhandled Error:', event.error);
  window.electron.reportError(event.error);
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <React.Suspense fallback={<LoaderComponent />}>
        <App />
      </React.Suspense>
    </ErrorBoundary>
  </React.StrictMode>
)
