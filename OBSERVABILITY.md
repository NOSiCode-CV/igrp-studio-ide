# Microservices Observability with Grafana, Elasticsearch, Tempo, and Prometheus

This document outlines the observability architecture for our microservices-based system, which relies on a combination of open-source tools to provide a comprehensive solution for monitoring, logging, and tracing.

## Core Components

Our observability stack is composed of the following core components, which are deployed and managed using Docker for consistency and ease of setup.

1.  **Elasticsearch:** A distributed search and analytics engine used to store, index, and analyze log data from all microservices. By centralizing logs, we can perform powerful queries to quickly identify issues.
2.  **Grafana:** An open-source platform for monitoring and observability. Grafana serves as our primary visualization tool, connecting to Elasticsearch, Prometheus, and Tempo to create real-time dashboards.
3.  **Prometheus:** A monitoring system that collects metrics from our services at specified intervals. It evaluates rule expressions, displays results, and can trigger alerts if predefined conditions are met.
4.  **Tempo:** A high-volume, distributed tracing backend. It is integrated with Grafana to visualize traces, providing deep insights into request flows across multiple services.

## How It Works

- **Log Collection:** Each microservice is configured to send its logs to a central logging agent (like Fluentd or Logstash), which then forwards them to Elasticsearch for storage and indexing.
- **Metrics Collection:** Prometheus scrapes metrics from our microservices, which are exposed via an HTTP endpoint. These metrics provide insights into the performance and health of each service.
- **Trace Collection:** Services are instrumented to generate and propagate traces, which are sent to Tempo for storage. This allows us to follow the lifecycle of a request as it travels through our system.
- **Visualization and Monitoring:** Grafana connects to Elasticsearch, Prometheus, and Tempo as data sources. We use it to build comprehensive dashboards that visualize logs, metrics, and traces in a single, unified view.

A `docker-compose.yml` file is used to define and run these services together, simplifying the setup and ensuring seamless communication between the components. This approach provides a powerful, self-hosted observability platform that gives us full control over our monitoring data.

## End-User Error Reporting in IGRP Studio Horizon

To ensure a stable and reliable experience for our users, IGRP Studio Horizon includes a mechanism for automatically capturing and reporting errors. This allows us to identify and fix issues proactively.

### Capturing Errors

Errors are captured in both the main and renderer processes of the Electron application.

**Main Process (`src/main/index.ts`):**

We use `process.on('uncaughtException')` to catch any unhandled exceptions in the main process.

```typescript
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Trigger the reporting mechanism
    sendErrorReport(error);
});
```

**Renderer Process:**

In the renderer process, we use a global error event listener to catch errors.

```typescript
window.addEventListener('error', (event) => {
    event.preventDefault();
    console.error('Unhandled Error:', event.error);
    // Trigger the reporting mechanism
    sendErrorReport(event.error);
});
```

### Sending Error Reports

When an error is captured, a report is sent to our observability backend. The report includes the error message, stack trace, and other relevant context like the application version and operating system.

The `sendErrorReport` function can be implemented as follows:

```typescript
async function sendErrorReport(error) {
    try {
        const response = await fetch(
            'https://your-backend.com/api/error-report',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: error.message,
                    stack: error.stack,
                    // Include other relevant info like app version, OS, etc.
                    appVersion: '1.0.0',
                    platform: process.platform,
                }),
            }
        );

        if (!response.ok) {
            console.error('Failed to send error report.');
        }
    } catch (e) {
        console.error('Failed to send error report:', e);
    }
}
```

This endpoint (`https://your-backend.com/api/error-report`) would be a service that receives the report and forwards it to Elasticsearch, where it can be indexed and visualized in Grafana. This provides us with a centralized location to monitor and analyze application errors.
