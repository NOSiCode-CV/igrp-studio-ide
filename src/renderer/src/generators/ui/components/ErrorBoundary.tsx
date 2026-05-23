import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import { captureRendererException } from '@renderer/init-sentry'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import React from 'react'

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
    errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ComponentType<{ error: Error; onRetry: () => void }>
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
    error: Error
    onRetry: () => void
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
            <p className="text-red-600 text-center mb-4 max-w-md">
                {error.message || 'An unexpected error occurred while rendering this component.'}
            </p>
            <div className="flex gap-2">
                <IGRPButtonPrimitive
                    onClick={onRetry}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </IGRPButtonPrimitive>
                <IGRPButtonPrimitive onClick={() => window.location.reload()} variant="default">
                    Reload Page
                </IGRPButtonPrimitive>
            </div>
            {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left w-full max-w-md">
                    <summary className="cursor-pointer text-sm text-red-600 font-medium">
                        Error Details (Development)
                    </summary>
                    <pre className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto">
                        {error.stack}
                    </pre>
                </details>
            )}
        </div>
    )
}

export class ComponentErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        }
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error
        }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({
            error,
            errorInfo
        })

        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Component Error Boundary caught an error:', error, errorInfo)
        }

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo)
        }

        // Send error to analytics/monitoring service
        this.reportError(error, errorInfo)
    }

    private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
        captureRendererException(error, {
            componentStack: errorInfo.componentStack,
            boundary: 'component'
        })
        try {
            if (
                (window as unknown as { analytics?: { track: (e: string, p: object) => void } })
                    .analytics
            ) {
                ;(
                    window as unknown as { analytics: { track: (e: string, p: object) => void } }
                ).analytics.track('error_boundary_caught', {
                    error: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack,
                    timestamp: new Date().toISOString()
                })
            }
        } catch (reportingError) {
            // Silently fail if error reporting fails
            console.warn('Failed to report error:', reportingError)
        }
    }

    private handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })
    }

    render() {
        if (this.state.hasError && this.state.error) {
            const FallbackComponent = this.props.fallback || DefaultErrorFallback

            return <FallbackComponent error={this.state.error} onRetry={this.handleRetry} />
        }

        return this.props.children
    }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
    const WrappedComponent = (props: P) => (
        <ComponentErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ComponentErrorBoundary>
    )

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

    return WrappedComponent
}

// Hook for functional components to handle errors
export const useErrorHandler = () => {
    const handleError = React.useCallback((error: Error, context?: any) => {
        console.error('Error caught by useErrorHandler:', error, context)

        // Report error to analytics
        if ((window as any).analytics) {
            ;(window as any).analytics.track('error_occurred', {
                message: error.message,
                stack: error.stack,
                context,
                timestamp: new Date().toISOString()
            })
        }
    }, [])

    return { handleError }
}
