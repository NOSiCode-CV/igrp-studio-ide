import { configureStore } from '@reduxjs/toolkit'
import React, { type JSX, useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { ActiveThemeProvider } from './components/active-theme-provider'
import { ThemeProvider } from './components/theme-provider'
import rootReducer from './redux'
import { subscribeDocsChanged } from './redux/specDocs/thunks'
import { subscribeKBProgress } from './redux/specKB/thunks'
import { subscribePrototypeEvents } from './redux/specPrototype/thunks'
import AppRoutes from './routes/Routes'
import { ThemeService } from './services/ThemeService'

import '@igrp/framework-process-studio-bpmn-editor/dist/src/styles.css'

import '@igrp/igrp-framework-react-design-system/styles'
import { IGRPToasterPrimitive } from '@igrp/igrp-framework-react-design-system'

// Configure Redux store
const store = configureStore({ reducer: rootReducer, devTools: true })

// Subscribe once to spec:kb progress events so KB items refresh in real time.
if (typeof window !== 'undefined' && (window as any).specKB) {
    subscribeKBProgress()(store.dispatch)
}

// Subscribe once to spec:doc changes so the documents tree refreshes when the
// backend reports mutations from any source.
if (typeof window !== 'undefined' && (window as any).specDoc) {
    subscribeDocsChanged(() => store.getState().PageBuilder.basePath)(store.dispatch)
}

// Subscribe once to prototype dev-server logs/status events.
if (typeof window !== 'undefined' && (window as any).specPrototype) {
    subscribePrototypeEvents()(store.dispatch)
}

const App = (): JSX.Element => {
    const [activeThemeValue, setActiveThemeValue] = useState<string>('igrp')

    useEffect(() => {
        async function loadTheme(): Promise<void> {
            const savedTheme = await ThemeService.getActiveTheme()
            if (savedTheme) {
                setActiveThemeValue(savedTheme)
            }
        }

        loadTheme()
    }, [])

    return (
        <Provider store={store}>
            <React.Fragment>
                <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
                    <ActiveThemeProvider initialTheme={activeThemeValue}>
                        <IGRPToasterPrimitive richColors closeButton expand />
                        <AppRoutes />
                    </ActiveThemeProvider>
                </ThemeProvider>
            </React.Fragment>
        </Provider>
    )
}

export default App
