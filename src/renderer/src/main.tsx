import './assets/globals.css'
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

import React from 'react'
import ReactDOM from 'react-dom/client'
import AppWithI18n from './components/app-with-i18n'
import ErrorBoundary from './components/error-boundary'

import '@renderer/localization/i18next.config'
import LoaderComponent from './components/loader'

loader.config({ monaco })

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <React.Suspense fallback={<LoaderComponent />}>
        <AppWithI18n />
      </React.Suspense>
    </ErrorBoundary>
  </React.StrictMode>
)
