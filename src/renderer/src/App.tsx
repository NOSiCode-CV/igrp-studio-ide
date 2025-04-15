import AppRoutes from './routes/Routes';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React, { useEffect } from 'react';
import rootReducer from './redux';
import { ThemeProvider } from './components/theme-provider';
import { ENV_TYPES } from './constants/appConstants';

// Configure Redux store
const store = configureStore({ reducer: rootReducer, devTools: true });

const App = () => {
    useEffect(() => {
        const registry = async () => {
            await window.engine.registry(ENV_TYPES.NEXTJS);
        };

        registry();
    }, []);

    return (
        <Provider store={store}>
            <React.Fragment>
                <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
                    <AppRoutes />
                </ThemeProvider>
            </React.Fragment>
        </Provider>
    );
};

export default App;
