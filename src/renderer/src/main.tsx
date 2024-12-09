import './assets/globals.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/error-boundary'
import Loader from './components/loader'

import '@renderer/localization/i18next.config'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <React.Suspense fallback={<Loader />}>
        <App />
      </React.Suspense>
    </ErrorBoundary>
  </React.StrictMode>
)
