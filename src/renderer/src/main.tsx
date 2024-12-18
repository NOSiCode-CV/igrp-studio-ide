import './assets/globals.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/error-boundary'

import '@renderer/localization/i18next.config'
import Loader from './components/loader'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <React.Suspense fallback={<Loader />}>
        <App />
      </React.Suspense>
    </ErrorBoundary>
  </React.StrictMode>
)
