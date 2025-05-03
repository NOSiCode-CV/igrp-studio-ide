import AppRoutes from './routes/Routes';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React, { useEffect, useState } from 'react';
import rootReducer from './redux';
import { ThemeProvider } from './components/theme-provider';
import { ActiveThemeProvider } from './components/ActiveThemeProvider';
import { ThemeService } from './services/ThemeService';
// Configure Redux store
const store = configureStore({ reducer: rootReducer, devTools: true });

const App = () => {
    const [activeThemeValue, setActiveThemeValue] = useState<string>('igrp');

    useEffect(() => {
        async function loadTheme() {
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
                        <AppRoutes />
                    </ActiveThemeProvider>
                </ThemeProvider>
            </React.Fragment>
        </Provider>
    );
};

export default App;
