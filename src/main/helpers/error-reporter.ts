async function sendErrorReport(error: Error): Promise<void> {
  try {
    const response = await fetch('http://localhost:13133/v1/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resourceLogs: [
          {
            resource: {
              attributes: [
                { key: 'service.name', value: { stringValue: 'igrp-studio-horizon' } },
                { key: 'app.version', value: { stringValue: '1.0.0' } },
                { key: 'os.platform', value: { stringValue: process.platform } },
              ],
            },
            scopeLogs: [
              {
                scope: {},
                logRecords: [
                  {
                    timeUnixNano: Date.now() * 1e6,
                    severityText: 'ERROR',
                    body: { stringValue: error.message },
                    attributes: [
                      { key: 'exception.stacktrace', value: { stringValue: error.stack } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Failed to send error report.');
    }
  } catch (e) {
    console.error('Failed to send error report:', e);
  }
}

export { sendErrorReport };
