# BPMN Project Structure and Project Selector

This document describes the new BPMN project structure and the project selector interface that allows you to browse projects and their process definitions.

## Overview

The BPMN system now supports a hierarchical structure where:
- **Projects** contain multiple process definitions
- **Process Definitions** contain project artifacts (tasks, forms, etc.)
- **Project Artifacts** contain variables and configuration

## Data Structure

### BPMN Project
```typescript
interface BPMNProject {
  projectId: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
  currentVersion: number;
  processDefinitions: BPMNProjectProcessDefinition[];
}
```

### BPMN Project Process Definition
```typescript
interface BPMNProjectProcessDefinition {
  processDefinitionId: string;
  processKey: string;
  bpmnDiagramUrl: string;
  version: number;
  state: string;
  deploymentId: string;
  deploymentDate: string;
  projectArtifacts: BPMNProjectArtifact[];
}
```

### BPMN Project Artifact
```typescript
interface BPMNProjectArtifact {
  projectArtifactId: string;
  taskKey: string;
  name: string;
  artifactVariables: BPMNProjectArtifactVariable[];
}
```

### BPMN Project Artifact Variable
```typescript
interface BPMNProjectArtifactVariable {
  artifactVariableId: string;
  name: string;
  type: string;
  defaultValue: string;
  required: boolean;
}
```

## API Endpoints

The BPMN service now supports these new endpoints:

### Get All Projects
```
GET /projects
```
Returns an array of all BPMN projects with their basic information.

### Get Project Details
```
GET /projects/{projectId}
```
Returns a specific project with all its process definitions and artifacts.

### Get Process Definitions by Project
```
GET /projects/{projectId}/process-definitions
```
Returns process definitions for a specific project.

## Project Selector Interface

### Features

1. **Project Selection**: Dropdown to select from available projects
2. **Project Information**: Display project details (name, code, version, status)
3. **Process Definitions**: Show all process definitions for the selected project
4. **Process Actions**: Edit, view, and manage process artifacts
5. **Artifact Management**: View and manage project artifacts and variables

### Usage

1. **Navigate to BPMN Manager**: Go to the BPMN tab in the page manager
2. **Select Projects Tab**: Click on the "Projects" tab
3. **Choose Project**: Use the dropdown to select a project
4. **View Process Definitions**: See all process definitions for the selected project
5. **Manage Processes**: Use the action buttons to edit, view, or manage processes

### Interface Components

#### Project Selector
- Dropdown with project list
- Shows project name, code, and status
- Filters inactive projects

#### Project Information Card
- Project name and code
- Description and version
- Active/inactive status

#### Process Definition Cards
- Process key and version
- Deployment information
- Artifact count
- Action buttons (Edit Page, View, Artifacts)

## Mock Data

The system includes mock data for testing:

### Sample Projects
1. **Invoice Management (INV)**
   - Invoice processing workflow
   - Version 2, Active
   - 1 process definition

2. **Employee Management (EMP)**
   - Employee onboarding process
   - Version 1, Active
   - 1 process definition

3. **Purchase Management (PUR)**
   - Purchase approval workflow
   - Version 1, Active
   - 1 process definition

### Sample Process Definitions
Each project contains process definitions with:
- Process key and version
- Deployment information
- Project artifacts with variables
- State information

### Sample Artifacts
Each process definition includes artifacts like:
- **Review Invoice**: Amount and vendor variables
- **Setup IT Equipment**: Computer type and software list
- **Approve Purchase**: Budget and justification variables

## Integration with Page Builder

When you click "Edit Page" on a process definition:

1. **Page Creation**: A temporary page is created for the studio
2. **Page Path**: `/bpmn/{projectCode}/{processKey}`
3. **Content**: Includes process and project metadata
4. **Studio Integration**: Opens in the page builder for editing

### Page Definition Structure
```typescript
{
  id: `bpmn-${processDefinitionId}-${timestamp}`,
  processDefinitionId: process.processDefinitionId,
  processDefinitionKey: process.processKey,
  pageName: `${process.processKey} - ${project.name}`,
  pagePath: `/bpmn/${project.code}/${process.processKey}`,
  content: {
    type: 'bpmn-process',
    processKey: process.processKey,
    processId: process.processDefinitionId,
    projectId: project.projectId,
    projectCode: project.code,
    projectName: project.name,
  }
}
```

## Configuration

### API Configuration
The project selector uses the same BPMN API configuration as the process definitions tab:
- API URL and base path
- Authentication token
- Connection testing

### Mock Service
For testing and development:
- Enable mock service in settings
- Use sample data without real API connection
- Test all features with realistic data

## Error Handling

The interface handles various error scenarios:

1. **No Projects**: Shows message when no projects are found
2. **API Errors**: Displays error messages for connection issues
3. **Empty Process Definitions**: Shows message when project has no processes
4. **Loading States**: Shows spinners during data loading

## Future Enhancements

Potential improvements for the project selector:

1. **Project Filtering**: Search and filter projects
2. **Bulk Operations**: Select multiple processes for batch operations
3. **Project Templates**: Create new projects from templates
4. **Artifact Editor**: Direct editing of project artifacts
5. **Process Import/Export**: Import/export process definitions
6. **Version Management**: Compare different versions of processes
7. **Collaboration**: Share projects and processes with team members

## Troubleshooting

### Common Issues

1. **Projects Not Loading**
   - Check API configuration
   - Verify API endpoint `/projects` is accessible
   - Check authentication token

2. **Process Definitions Not Showing**
   - Verify project selection
   - Check API endpoint `/projects/{id}` is accessible
   - Review project structure in API response

3. **Mock Service Issues**
   - Ensure mock service is enabled
   - Check mock data is properly loaded
   - Verify no real API conflicts

### Debug Information

Enable browser developer tools to view:
- Network requests to BPMN API
- Console errors and warnings
- Component state and props

## API Response Format

The BPMN API should return projects in this format:

```json
[
  {
    "projectId": "project-001",
    "code": "INV",
    "name": "Invoice Management",
    "description": "Complete invoice processing workflow",
    "active": true,
    "currentVersion": 2,
    "processDefinitions": [
      {
        "processDefinitionId": "invoice-process:1:123456",
        "processKey": "invoice-process",
        "bpmnDiagramUrl": "https://example.com/diagram.png",
        "version": 1,
        "state": "active",
        "deploymentId": "deployment-001",
        "deploymentDate": "2024-01-15T10:30:00Z",
        "projectArtifacts": [
          {
            "projectArtifactId": "artifact-001",
            "taskKey": "review-invoice",
            "name": "Review Invoice",
            "artifactVariables": [
              {
                "artifactVariableId": "var-001",
                "name": "amount",
                "type": "number",
                "defaultValue": "0",
                "required": true
              }
            ]
          }
        ]
      }
    ]
  }
]
```

This structure provides a complete hierarchy for managing BPMN projects, processes, and their associated artifacts in a user-friendly interface. 