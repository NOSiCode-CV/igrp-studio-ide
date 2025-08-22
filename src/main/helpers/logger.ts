// logger.ts
import { app, ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';

// Initialize the logger
let sessionId: string = uuidv4();
let isInitialized = false;

// Configuration interface
interface LoggerConfig {
  endpoint: string;
  insecure?: boolean;
  metadata?: Record<string, string>;
}

const defaultConfig: LoggerConfig = {
  endpoint: 'localhost:4317', // Use your existing otel-collector port
  insecure: true,
};

export async function initializeLogger(_config: Partial<LoggerConfig> = {}) {
  try {
   // const finalConfig = { ...defaultConfig, ...config };

    // Mark as initialized
    isInitialized = true;

    // Set up IPC handler for renderer process errors
    ipcMain.handle('send-error-report', async (_event, { error, context = {} }) => {
      return await sendErrorReport(deserializeError(error), context);
    });

    // Enhanced error handlers
    setupProcessHandlers();

    console.log('Logger initialized successfully, will send to otel-collector on port 4317, session ID:', sessionId);
  } catch (error) {
    console.error('Failed to initialize logger:', error);
    isInitialized = false;
  }
}

function setupProcessHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    await sendErrorReport(error, { errorType: 'uncaughtException' });
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', async (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    await sendErrorReport(error, { errorType: 'unhandledRejection' });
  });

  // Handle Electron's renderer process crashes
  app.on('render-process-gone', async (_event, _webContents, details) => {
    const error = new Error(`Renderer process gone: ${details.reason}`);
    await sendErrorReport(error, {
      errorType: 'rendererProcessGone',
      exitCode: details.exitCode,
      reason: details.reason,
    });
  });
}

function deserializeError(errorObj: any): Error {
  if (errorObj instanceof Error) return errorObj;

  const error = new Error(errorObj.message || 'Unknown error');
  error.name = errorObj.name || 'Error';
  error.stack = errorObj.stack;
  return error;
}

async function sendToOtelCollector(errorData: any): Promise<boolean> {
  try {
    // Create the OpenTelemetry OTLP request payload
    const request = {
      resourceLogs: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'igrp-studio-horizon' } },
            { key: 'app.version', value: { stringValue: app.getVersion() } },
            { key: 'os.platform', value: { stringValue: process.platform } },
            { key: 'os.version', value: { stringValue: process.getSystemVersion() } },
            { key: 'electron.version', value: { stringValue: process.versions.electron } },
            { key: 'session.id', value: { stringValue: sessionId } },
          ],
        },
        scopeLogs: [{
          scope: {},
          logRecords: [{
            timeUnixNano: Date.now() * 1e6,
            severityText: 'ERROR',
            body: { stringValue: errorData.message },
            attributes: [
              { key: 'error.id', value: { stringValue: errorData.errorId } },
              { key: 'exception.stacktrace', value: { stringValue: errorData.stack } },
              { key: 'exception.type', value: { stringValue: errorData.name } },
              { key: 'process.type', value: { stringValue: process.type } },
              ...Object.entries(errorData.additionalAttributes || {}).map(([key, value]) => ({
                key,
                value: { stringValue: String(value) }
              }))
            ],
          }],
        }],
      }],
    };

    // Send to your existing otel-collector using OTLP/gRPC format
    const response = await fetch(`http://${defaultConfig.endpoint}/v1/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': app.getVersion(),
        'X-Client-Platform': process.platform,
      },
      body: JSON.stringify(request),
    });

    if (response.ok) {
      console.log('Error report sent successfully to otel-collector');
      return true;
    } else {
      console.error('Failed to send to otel-collector:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error sending to otel-collector:', error);
    return false;
  }
}

export async function sendErrorReport(
  error: Error,
  additionalAttributes: Record<string, any> = {},
): Promise<string | null> {
  if (!isInitialized) {
    console.error('Logger not initialized', error);
    return null;
  }

  try {
    const timestamp = Date.now();
    const errorId = uuidv4();

    const errorData = {
      errorId,
      timestamp: new Date(timestamp).toISOString(),
      message: error.message,
      stack: error.stack,
      name: error.name,
      platform: process.platform,
      osVersion: process.getSystemVersion(),
      electronVersion: process.versions.electron,
      processType: process.type,
      appVersion: app.getVersion(),
      sessionId,
      additionalAttributes,
    };

    // Send to your existing otel-collector
    const success = await sendToOtelCollector(errorData);

    if (success) {
      console.log('Error report sent to otel-collector successfully');
    } else {
      // Fallback to console if otel-collector fails
      console.error('Error Report (otel-collector failed, console fallback):', errorData);
    }

    return errorId;
  } catch (e) {
    console.error('Failed to send error report:', e);
    return null;
  }
}

export async function shutdownLogger() {
  try {
    isInitialized = false;
    console.log('Logger shutdown successfully');
  } catch (error) {
    console.error('Failed to shutdown logger:', error);
  }
}