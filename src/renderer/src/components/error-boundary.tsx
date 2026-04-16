import logo from '@renderer/assets/images/igrp-green.svg'
import { captureRendererException } from '@renderer/init-sentry'
import { ROUTES } from '@renderer/routes/routeConstants'
import { AlertCircle, Check, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    errorMessage?: string
    errorStack?: string
    componentStack?: string
    copied?: boolean
    showDetails?: boolean
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, showDetails: false }
    }

    // Update state if an error is thrown
    static getDerivedStateFromError(): Pick<State, 'hasError'> {
        return { hasError: true }
    }

    // Log error details
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('Error caught by ErrorBoundary:', error, errorInfo)
        captureRendererException(error, {
            componentStack: errorInfo.componentStack,
            boundary: 'root'
        })
        if (window.electron?.reportError) {
            window.electron.reportError(error)
        }

        this.setState({
            errorMessage: error?.message ?? String(error),
            errorStack: error?.stack,
            componentStack: errorInfo?.componentStack ?? undefined
        })
    }

    buildErrorText = (): string => {
        const lines: string[] = []
        lines.push('IGRP Studio — Renderer Error')
        if (this.state.errorMessage) lines.push(`Message: ${this.state.errorMessage}`)
        if (this.state.errorStack) {
            lines.push('')
            lines.push('Stack:')
            lines.push(this.state.errorStack)
        }
        if (this.state.componentStack) {
            lines.push('')
            lines.push('Component stack:')
            lines.push(this.state.componentStack)
        }
        return lines.join('\n')
    }

    copyError = async () => {
        const text = this.buildErrorText()
        try {
            await navigator.clipboard.writeText(text)
            this.setState({ copied: true })
            window.setTimeout(() => this.setState({ copied: false }), 1200)
        } catch {
            // Fallback (older Electron / permissions)
            const textarea = document.createElement('textarea')
            textarea.value = text
            textarea.style.position = 'fixed'
            textarea.style.left = '-9999px'
            textarea.style.top = '-9999px'
            document.body.appendChild(textarea)
            textarea.focus()
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
            this.setState({ copied: true })
            window.setTimeout(() => this.setState({ copied: false }), 1200)
        }
    }

    openPage = () => {
        window.location.hash = ROUTES.HOME
        window.setTimeout(() => {
            window.location.reload()
        }, 800)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 dark:bg-gray-800">
                    <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-md dark:bg-gray-700">
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={this.openPage}
                                className="cursor-pointer"
                                aria-label="Return home"
                            >
                                <img src={logo} alt="IGRP" className="h-12" />
                            </button>
                            <AlertCircle className="mt-4 h-12 w-12 text-red-500" />
                            <h2 className="mt-3 text-center text-2xl font-bold text-black dark:text-white">
                                Something went wrong
                            </h2>
                            <p className="mt-1 text-center text-gray-500 dark:text-gray-300">
                                Click the logo to return home, or copy the error details and share them with
                                the team.
                            </p>
                        </div>

                        <div className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-4 text-left dark:border-gray-600 dark:bg-gray-800">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        this.setState((prev) => ({
                                            showDetails: !prev.showDetails
                                        }))
                                    }
                                    aria-label={
                                        this.state.showDetails
                                            ? 'Collapse error details'
                                            : 'Expand error details'
                                    }
                                    title={this.state.showDetails ? 'Collapse' : 'Expand'}
                                    className="flex flex-1 items-center justify-between rounded-md bg-transparent px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-600"
                                >
                                    <span>Error details</span>
                                    {this.state.showDetails ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </button>
                                <div className="flex items-center">
                                    <button
                                        type="button"
                                        onClick={this.copyError}
                                        aria-label={this.state.copied ? 'Copied' : 'Copy error details'}
                                        title={this.state.copied ? 'Copied' : 'Copy'}
                                        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100"
                                    >
                                        {this.state.copied ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {this.state.showDetails && (
                                <pre className="max-h-64 overflow-auto whitespace-pre-wrap wrap-break-word text-xs text-gray-700 dark:text-gray-200">
                                    {this.buildErrorText()}
                                </pre>
                            )}
                        </div>

                        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="w-full rounded-md bg-transparent px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 sm:w-auto"
                            >
                                Reload
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        // Render children if no error
        return this.props.children
    }
}

export default ErrorBoundary
