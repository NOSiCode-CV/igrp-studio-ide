import AppRoutes from './routes/Routes';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React, { JSX, useEffect, useState } from 'react';
import rootReducer from './redux';
import { ThemeProvider } from './components/theme-provider';
import { ActiveThemeProvider } from './components/active-theme-provider';
import { ThemeService } from './services/ThemeService';

import '@igrp/framework-process-studio-bpmn-editor/dist/src/styles.css';

import '@igrp/igrp-framework-react-design-system/dist/styles.css';
import { IGRPToasterPrimitive } from '@igrp/igrp-framework-react-design-system';

// Configure Redux store
const store = configureStore({ reducer: rootReducer, devTools: true });

const App = (): JSX.Element => {
    const [activeThemeValue, setActiveThemeValue] = useState<string>('igrp');

    useEffect(() => {
        async function loadTheme(): Promise<void> {
            const savedTheme = await ThemeService.getActiveTheme();
            if (savedTheme) {
                setActiveThemeValue(savedTheme);
            }
        }

        loadTheme();
    }, []);

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
    );
};

export default App;
