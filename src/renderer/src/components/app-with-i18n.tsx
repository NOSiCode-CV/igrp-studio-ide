import { JSX, useEffect, useState } from 'react'
import i18n from '@renderer/localization/i18next.config'
import {
  IGRPCardPrimitive,
  IGRPCardContentPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { RefreshCw, Globe } from 'lucide-react'
import App from '@renderer/App'

const LoadingScreen = (): JSX.Element => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <IGRPCardPrimitive className="w-96">
      <IGRPCardContentPrimitive className="flex flex-col items-center justify-center p-8">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-8 w-8 text-primary animate-pulse" />
          <h2 className="text-lg font-semibold">Initializing Application</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading translations...</span>
        </div>
      </IGRPCardContentPrimitive>
    </IGRPCardPrimitive>
  </div>
)

const ErrorScreen = ({ onRetry }: { onRetry: () => void }): JSX.Element => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <IGRPCardPrimitive className="w-96">
      <IGRPCardContentPrimitive className="flex flex-col items-center justify-center p-8">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-8 w-8 text-destructive" />
          <h2 className="text-lg font-semibold">Initialization Error</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Failed to initialize the application. Please try again.
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </IGRPCardContentPrimitive>
    </IGRPCardPrimitive>
  </div>
)

const AppWithI18n = (): JSX.Element => {
  const [i18nReady, setI18nReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const checkI18n = (): void => {
      try {
        if (i18n.isInitialized) {
          setI18nReady(true)
          setHasError(false)
        } else {
          // Check again in 100ms
          setTimeout(checkI18n, 100)
        }
      } catch (error) {
        console.error('i18n initialization error:', error)
        setHasError(true)
      }
    }

    // Start checking after a short delay to allow i18n to start initializing
    const timeoutId = setTimeout(checkI18n, 50)

    // Set a maximum timeout to prevent infinite loading
    const maxTimeoutId = setTimeout(() => {
      if (!i18n.isInitialized) {
        console.warn('i18n initialization timeout')
        setHasError(true)
      }
    }, 10000) // 10 second timeout

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(maxTimeoutId)
    }
  }, [retryCount])

  const handleRetry = (): void => {
    setHasError(false)
    setI18nReady(false)
    setRetryCount((prev) => prev + 1)
  }

  if (hasError) {
    return <ErrorScreen onRetry={handleRetry} />
  }

  if (!i18nReady) {
    return <LoadingScreen />
  }

  return <App />
}

export default AppWithI18n
