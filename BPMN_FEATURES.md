# BPMN Process Management Features

This document describes the BPMN (Business Process Model and Notation) process management features added to IGRP Studio Horizon.

## Overview

The BPMN manager allows you to:
- Configure a single BPMN REST API connection using the global settings system
- View and manage process definitions
- Create and edit pages for BPMN processes
- Start process instances
- Download BPMN XML files
- **NEW**: Use mock data for testing and development

## Features

### 1. REST API Configuration

- **Single API Configuration**: Configure one BPMN REST API endpoint with authentication token
- **Global Settings Integration**: Uses IGRP Studio's global settings system for persistent storage
- **Test API Connection**: Verify connectivity before saving
- **Token-based Authentication**: Support for Bearer tokens and API keys
- **Configuration Status**: View connection status and last connected time

### 2. Process Definition Management

- **View Process Definitions**: List all process definitions from the configured API
- **Process Information**: Display process key, version, status, and category
- **Search and Filter**: Search processes by name or key
- **Process Status**: View active/suspended status of processes

### 3. Process Operations

- **Edit Process Pages**: Open BPMN process pages in the studio for drag-and-drop editing
- **Download BPMN XML**: Download the BPMN XML definition files
- **View Process Details**: Access detailed process information

### 4. Page Management

- **Temporary Page Creation**: Create pages for studio integration (not persisted)
- **Studio Integration**: Automatically opens in the first tab (pages)
- **Task Page Support**: Support for both start pages and task pages
- **Form Key Integration**: Configure form keys for task pages

### 5. Mock Data & Testing

- **Mock BPMN Service**: Complete mock implementation for testing and development
- **Sample Data**: 6 realistic process definitions with different categories
- **Interactive Demo**: Start processes, complete tasks, and see real-time updates
- **Realistic Delays**: Simulated API delays for realistic testing experience
- **Service Switching**: Toggle between mock and real BPMN services

## Usage

### Configuring BPMN REST API

1. Navigate to the **BPMN** tab in the page manager
2. Click **Add Configuration** (or **Edit Configuration** if already configured)
3. Fill in the configuration details:
   - **Configuration Name**: A friendly name for the configuration
   - **API URL**: The base URL of your BPMN REST API (e.g., `https://my-camunda-server.com`)
   - **Access Token**: Bearer token or API key for authentication
   - **Description**: Optional description
4. Click **Test Connection** to verify connectivity
5. Click **Save** to store the configuration

### Using Mock Data for Testing

1. Navigate to the **BPMN** tab in the page manager
2. Go to the **Settings** tab
3. Enable **Mock BPMN Service** using the toggle switch
4. Click **Generate Mock Data** to create sample page definitions
5. Start testing with the provided sample data

### Managing Process Definitions

1. Once the API is configured (or mock service is enabled), process definitions will automatically load
2. View all available process definitions in the **Process Definitions** tab
3. Use the search bar to filter processes
4. Click **Refresh** to update the process list
5. Click **Edit Page** to open the process page in the studio for drag-and-drop editing

### Creating BPMN Process Pages

1. Click **Edit Page** on any process definition card
2. A temporary page will be created for the BPMN process (not saved to settings)
3. The page will open in the studio's page builder (first tab)
4. Use the drag-and-drop interface to design your BPMN process page
5. Add components, configure layouts, and customize the page design
6. Save your changes in the studio (page is not persisted in BPMN settings)



### Downloading BPMN XML

1. Click the **More** menu (⋮) on any process definition card
2. Select **Download XML**
3. The BPMN XML file will be downloaded to your computer

## Mock Data Features

### Sample Process Definitions

The mock service includes 6 realistic process definitions:

1. **Invoice Processing** (Finance)
   - Automated invoice processing workflow with approval steps
   - Version 1, Active status

2. **Employee Onboarding** (HR)
   - Complete employee onboarding process including IT setup and training
   - Version 2, Active status

3. **Purchase Approval** (Procurement)
   - Multi-level purchase approval workflow with budget checks
   - Version 1, Active status

4. **Customer Support Ticket** (Support)
   - Customer support ticket management with escalation rules
   - Version 3, Active status

5. **Leave Request** (HR)
   - Employee leave request approval workflow
   - Version 1, Suspended status

6. **Expense Report** (Finance)
   - Employee expense report submission and approval
   - Version 2, Active status

### Sample Process Instances

- **Invoice Processing Instance**: Active instance with business key INV-2024-001
- **Employee Onboarding Instance**: Completed instance with business key EMP-2024-001
- **Purchase Approval Instance**: Active instance with business key PO-2024-001

### Sample Tasks

- **Review Invoice**: Assigned to finance.manager, due in 2 days
- **Setup IT Equipment**: Assigned to it.support, due in 4 days
- **Approve Purchase**: Assigned to department.manager, due in 4 days

### Interactive Features

- **Start Processes**: Click start buttons to create new process instances
- **Complete Tasks**: Click complete buttons to finish pending tasks
- **Real-time Updates**: See changes immediately after actions
- **Statistics Dashboard**: View overview of processes, instances, and tasks

## Technical Details

### Supported BPMN Servers

The BPMN manager is designed to work with REST API-compatible BPMN servers:
- **Camunda Platform**: Full support for Camunda REST API
- **Flowable**: Compatible with Flowable REST API
- **Other BPMN Engines**: Any engine with compatible REST API

### API Endpoints Used

The BPMN service uses the following REST API endpoints:
- `GET /engine-rest/process-definition` - List process definitions
- `GET /engine-rest/process-definition/{id}/xml` - Get BPMN XML
- `POST /engine-rest/process-definition/{id}/start` - Start process instance
- `GET /engine-rest/process-instance` - List process instances
- `GET /engine-rest/task` - List tasks
- `POST /engine-rest/task/{id}/complete` - Complete tasks

### Data Storage

- **API Configuration**: Stored in IGRP Studio's global settings system (`igrp-studio-settings`)
- **Process Data**: Retrieved from BPMN server APIs or mock service
- **Page Definitions**: Created temporarily for studio integration (not persisted)
- **Persistence**: Only configuration persists across application restarts

### Integration with Page Builder

BPMN pages are integrated with the existing page builder system:
- Pages are created with type `bpmn-process`
- Content includes process metadata
- Can be edited using the standard page builder interface
- Support for custom components and layouts

## Configuration

### Environment Variables

No additional environment variables are required. The BPMN manager uses the existing IGRP Studio configuration.

### Authentication

BPMN API configuration uses Bearer token authentication:
- Tokens are stored securely in the global settings system
- No token encryption (consider implementing for production)
- Support for API keys and OAuth tokens

### Global Settings Integration

The BPMN manager integrates with IGRP Studio's global settings system:
- **Settings File**: `igrp-studio-settings` (electron-store)
- **Storage Location**: Application data directory
- **Backup/Restore**: Included in IGRP Studio's backup system
- **Cross-Platform**: Works on Windows, macOS, and Linux

### Mock Service Configuration

The mock service provides:
- **Realistic Data**: Sample process definitions, instances, and tasks
- **Interactive Operations**: Start processes, complete tasks, download XML
- **Realistic Delays**: Simulated API response times
- **Service Switching**: Easy toggle between mock and real services
- **Data Generation**: Automatic creation of sample page definitions

## API Configuration Examples

### Camunda Platform
```
API URL: https://my-camunda-server.com
Access Token: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Flowable
```
API URL: https://my-flowable-server.com/flowable-rest
Access Token: Bearer your-flowable-token
```

### Custom BPMN Engine
```
API URL: https://my-bpmn-engine.com/api/v1
Access Token: your-api-key
```

### Mock Service (for testing)
```
API URL: https://mock-bpmn-server.com
Access Token: mock-token-12345
```

## Future Enhancements

Planned features for future releases:
- **Process Instance Monitoring**: View and manage running process instances
- **Task Management**: View and complete user tasks
- **Process Variables**: Configure and manage process variables
- **Process Diagrams**: Visual process diagram viewer
- **Deployment Management**: Deploy new process definitions
- **Process Analytics**: View process performance metrics
- **Form Builder**: Integrated form builder for task forms
- **Multi-tenant Support**: Support for multiple BPMN tenants
- **Advanced Mock Features**: More realistic simulation scenarios
- **Mock Data Customization**: Customize mock data for specific testing needs

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Verify API URL is correct and includes the base path
   - Check authentication token is valid
   - Ensure API is accessible from your network
   - Verify the API supports the required endpoints

2. **Process Definitions Not Loading**
   - Check API configuration status
   - Verify user has permissions to view processes
   - Check API server logs for errors
   - Ensure the API endpoint `/engine-rest/process-definition` is accessible

3. **Cannot Start Process**
   - Verify process is not suspended
   - Check user has permissions to start processes
   - Ensure process is startable in tasklist
   - Verify the API endpoint `/engine-rest/process-definition/{id}/start` is accessible

4. **Settings Not Persisting**
   - Check if the global settings system is properly initialized
   - Verify write permissions to the application data directory
   - Check for any error messages in the console

5. **Mock Service Issues**
   - Ensure mock service is enabled in settings
   - Check that mock data has been generated
   - Verify no real API configuration conflicts

### Debug Information

Enable browser developer tools to view:
- Network requests to BPMN API
- Console errors and warnings
- IPC communication between renderer and main process

### API Response Format

The BPMN manager expects responses in the following format:
```json
{
  "data": [
    {
      "id": "process-definition-id",
      "key": "process-key",
      "name": "Process Name",
      "version": 1,
      "suspended": false,
      // ... other process properties
    }
  ]
}
```

### Settings Debugging

To debug settings issues:
1. Check the main process console for IGRP Studio Settings errors
2. Verify the `igrp-studio-settings` file exists in the application data directory
3. Check file permissions on the settings directory
4. Use the global settings API to test configuration retrieval

### Mock Service Debugging

To debug mock service issues:
1. Check the mock service toggle in the Settings tab
2. Verify mock data generation was successful
3. Check console for any mock service errors
4. Ensure no real API configuration is interfering

## Support

For issues and questions:
- Check the troubleshooting section above
- Review BPMN server documentation
- Check IGRP Studio's global settings system documentation
- Test with mock service to isolate issues
- Contact the development team 