// logger.ts
import { app, ipcMain } from 'electron'
import * as Sentry from '@sentry/electron/main'
import { v4 as uuidv4 } from 'uuid'

// Initialize the logger
const sessionId: string = uuidv4()
let isInitialized = false
let isSentryInitialized = false

interface ErrorPayload {
  errorId: string
  timestamp: string
  message: string
  stack?: string
  name: string
  platform: NodeJS.Platform
  osVersion: string
  electronVersion: string
  processType: string
  appVersion: string
  sessionId: string
  additionalAttributes: Record<string, unknown>
}

// Configuration interface
interface LoggerConfig {
  endpoint: string
  insecure?: boolean
  metadata?: Record<string, string>
}

const defaultConfig: LoggerConfig = {
  endpoint: 'localhost:4317', // Use your existing otel-collector port
  insecure: true
}

let currentConfig: LoggerConfig = defaultConfig

export async function initializeLogger(config: Partial<LoggerConfig> = {}): Promise<void> {
  try {
    const finalConfig = { ...defaultConfig, ...config }

    currentConfig = finalConfig

    initializeSentry(finalConfig.metadata)

    // Mark as initialized
    isInitialized = true

    // Set up IPC handler for renderer process errors
    ipcMain.handle(
      'send-error-report',
      async (
        _event,
        {
          error,
          context = {}
        }: {
          error: unknown
          context?: Record<string, unknown>
        }
      ) => {
        return await sendErrorReport(deserializeError(error), context)
      }
    )

    // Enhanced error handlers
    setupProcessHandlers()

    console.log(
      'Logger initialized successfully, will send to otel-collector on port 4317, session ID:',
      sessionId
    )
  } catch (error) {
    console.error('Failed to initialize logger:', error)
    isInitialized = false
  }
}

function initializeSentry(metadata?: Record<string, string>): void {
  const sentryDsn = process.env.SENTRY_DSN

  if (!sentryDsn) {
    console.warn('Sentry DSN not provided. Sentry integration will remain disabled.')
    return
  }

  const environment =
    process.env.SENTRY_ENVIRONMENT ?? (app.isPackaged ? 'production' : 'development')

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment,
      release: app.getVersion(),
      //enableUnresponsive: true,
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
        ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
        : undefined,
      attachStacktrace: true,
      beforeSend(event) {
        event.tags = {
          ...event.tags,
          session_id: sessionId,
          process_type: process.type ?? 'browser'
        }
        return event
      }
    })

    Sentry.withScope((scope: Sentry.Scope) => {
      scope.setTag('session_id', sessionId)
      scope.setTag('process_type', process.type ?? 'browser')
      scope.setContext('device', {
        osVersion: process.getSystemVersion(),
        platform: process.platform,
        electronVersion: process.versions.electron
      })
      if (metadata) {
        scope.setTags(metadata)
      }
    })

    isSentryInitialized = true
    console.log('Sentry initialized successfully for main process')
  } catch (error) {
    console.error('Failed to initialize Sentry:', error)
    isSentryInitialized = false
  }
}

function setupProcessHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    await sendErrorReport(error, { errorType: 'uncaughtException' })
  })

  // Handle unhandled rejections
  process.on('unhandledRejection', async (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    await sendErrorReport(error, { errorType: 'unhandledRejection' })
  })

  // Handle Electron's renderer process crashes
  app.on('render-process-gone', async (_event, _webContents, details) => {
    const error = new Error(`Renderer process gone: ${details.reason}`)
    await sendErrorReport(error, {
      errorType: 'rendererProcessGone',
      exitCode: details.exitCode,
      reason: details.reason
    })
  })
}

function deserializeError(errorObj: unknown): Error {
  if (errorObj instanceof Error) return errorObj

  const serializedError = errorObj as { message?: string; name?: string; stack?: string }

  const error = new Error(serializedError.message || 'Unknown error')
  error.name = serializedError.name || 'Error'
  error.stack = serializedError.stack
  return error
}

async function sendToOtelCollector(errorData: ErrorPayload): Promise<boolean> {
  try {
    // Create the OpenTelemetry OTLP request payload
    const request = {
      resourceLogs: [
        {
          resource: {
            attributes: [
              {
                key: 'service.name',
                value: { stringValue: 'igrp-studio-horizon' }
              },
              {
                key: 'app.version',
                value: { stringValue: app.getVersion() }
              },
              {
                key: 'os.platform',
                value: { stringValue: process.platform }
              },
              {
                key: 'os.version',
                value: {
                  stringValue: process.getSystemVersion()
                }
              },
              {
                key: 'electron.version',
                value: {
                  stringValue: process.versions.electron
                }
              },
              {
                key: 'session.id',
                value: { stringValue: sessionId }
              }
            ]
          },
          scopeLogs: [
            {
              scope: {},
              logRecords: [
                {
                  timeUnixNano: Date.now() * 1e6,
                  severityText: 'ERROR',
                  body: { stringValue: errorData.message },
                  attributes: [
                    {
                      key: 'error.id',
                      value: {
                        stringValue: errorData.errorId
                      }
                    },
                    {
                      key: 'exception.stacktrace',
                      value: {
                        stringValue: errorData.stack ?? ''
                      }
                    },
                    {
                      key: 'exception.type',
                      value: {
                        stringValue: errorData.name
                      }
                    },
                    {
                      key: 'process.type',
                      value: {
                        stringValue: errorData.processType
                      }
                    },
                    ...Object.entries(errorData.additionalAttributes).map(([key, value]) => ({
                      key,
                      value: {
                        stringValue: String(value)
                      }
                    }))
                  ]
                }
              ]
            }
          ]
        }
      ]
    }

    // Send to your existing otel-collector using OTLP/gRPC format
    const response = await fetch(`http://${currentConfig.endpoint}/v1/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': app.getVersion(),
        'X-Client-Platform': process.platform
      },
      body: JSON.stringify(request)
    })

    if (response.ok) {
      console.log('Error report sent successfully to otel-collector')
      return true
    } else {
      console.error('Failed to send to otel-collector:', response.status)
      return false
    }
  } catch (error) {
    console.error('Error sending to otel-collector:', error)
    return false
  }
}

export async function sendErrorReport(
  error: Error,
  additionalAttributes: Record<string, unknown> = {}
): Promise<string | null> {
  if (!isInitialized) {
    console.error('Logger not initialized', error)
    return null
  }

  try {
    const timestamp = Date.now()
    const errorId = uuidv4()

    if (isSentryInitialized) {
      Sentry.withScope((scope) => {
        scope.setTag('error_id', errorId)
        scope.setTag('process_type', process.type ?? 'browser')
        scope.setExtra('sessionId', sessionId)
        scope.setExtra('appVersion', app.getVersion())
        Object.entries(additionalAttributes).forEach(([key, value]) => {
          scope.setExtra(key, value)
        })
        scope.setContext('error', {
          timestamp: new Date(timestamp).toISOString(),
          osVersion: process.getSystemVersion(),
          electronVersion: process.versions.electron
        })

        Sentry.captureException(error)
      })
    }

    const errorData: ErrorPayload = {
      errorId,
      timestamp: new Date(timestamp).toISOString(),
      message: error.message,
      stack: error.stack,
      name: error.name,
      platform: process.platform,
      osVersion: process.getSystemVersion(),
      electronVersion: process.versions.electron,
      processType: process.type ?? 'browser',
      appVersion: app.getVersion(),
      sessionId,
      additionalAttributes
    }

    // Send to your existing otel-collector
    const success = await sendToOtelCollector(errorData)

    if (success) {
      console.log('Error report sent to otel-collector successfully')
    } else {
      // Fallback to console if otel-collector fails
      console.error('Error Report (otel-collector failed, console fallback):', errorData)
    }

    return errorId
  } catch (e) {
    console.error('Failed to send error report:', e)
    return null
  }
}

export async function shutdownLogger(): Promise<void> {
  try {
    isInitialized = false
    if (isSentryInitialized) {
      await Sentry.close(2000)
      isSentryInitialized = false
    }
    console.log('Logger shutdown successfully')
  } catch (error) {
    console.error('Failed to shutdown logger:', error)
  }
}
