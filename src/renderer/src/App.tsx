import AppRoutes from './routes/Routes'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import React from 'react'

import rootReducer from './redux'

const store = configureStore({ reducer: rootReducer, devTools: true })

import { ThemeProvider } from './components/theme-provider'

const App = () => {
  return (
    <Provider store={store}>
      <React.Fragment>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <AppRoutes />
        </ThemeProvider>
      </React.Fragment>
    </Provider>
  )
}

export default App
