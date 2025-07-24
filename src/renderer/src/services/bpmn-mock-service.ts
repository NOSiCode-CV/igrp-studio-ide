import { BPMNConfig, BPMNProcessDefinition, BPMNProcessInstance, BPMNTask, BPMNProject, BPMNProjectProcessDefinition, BPMNProjectArtifact, BPMNProjectArtifactVariable } from 'src/main/types';

// Mock data for BPMN process definitions
const mockProcessDefinitions: BPMNProcessDefinition[] = [
  {
    id: 'invoice-process:1:123456',
    key: 'invoice-process',
    name: 'Invoice Processing',
    description: 'Automated invoice processing workflow with approval steps',
    version: 1,
    category: 'Finance',
    deploymentId: 'deployment-001',
    resourceName: 'invoice-process.bpmn',
    diagramResourceName: 'invoice-process.png',
    suspended: false,
    startableInTasklist: true,
    startablePermissionCheck: true,
    historyTimeToLive: 30,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'employee-onboarding:2:789012',
    key: 'employee-onboarding',
    name: 'Employee Onboarding',
    description: 'Complete employee onboarding process including IT setup and training',
    version: 2,
    category: 'HR',
    deploymentId: 'deployment-002',
    resourceName: 'employee-onboarding.bpmn',
    diagramResourceName: 'employee-onboarding.png',
    suspended: false,
    startableInTasklist: true,
    startablePermissionCheck: true,
    historyTimeToLive: 90,
    createdAt: '2024-01-10T14:20:00Z',
    updatedAt: '2024-01-12T09:15:00Z',
  },
  {
    id: 'purchase-approval:1:345678',
    key: 'purchase-approval',
    name: 'Purchase Approval',
    description: 'Multi-level purchase approval workflow with budget checks',
    version: 1,
    category: 'Procurement',
    deploymentId: 'deployment-003',
    resourceName: 'purchase-approval.bpmn',
    diagramResourceName: 'purchase-approval.png',
    tenantId: undefined,
    suspended: false,
    startableInTasklist: true,
    startablePermissionCheck: true,
    historyTimeToLive: 60,
    createdAt: '2024-01-08T11:45:00Z',
    updatedAt: '2024-01-08T11:45:00Z',
  },
  {
    id: 'customer-support:3:901234',
    key: 'customer-support',
    name: 'Customer Support Ticket',
    description: 'Customer support ticket management with escalation rules',
    version: 3,
    category: 'Support',
    deploymentId: 'deployment-004',
    resourceName: 'customer-support.bpmn',
    diagramResourceName: 'customer-support.png',
    tenantId: undefined,
    suspended: false,
    startableInTasklist: true,
    startablePermissionCheck: true,
    historyTimeToLive: 45,
    createdAt: '2024-01-05T16:30:00Z',
    updatedAt: '2024-01-14T13:20:00Z',
  },
  {
    id: 'leave-request:1:567890',
    key: 'leave-request',
    name: 'Leave Request',
    description: 'Employee leave request approval workflow',
    version: 1,
    category: 'HR',
    deploymentId: 'deployment-005',
    resourceName: 'leave-request.bpmn',
    diagramResourceName: 'leave-request.png',
    tenantId: undefined,
    suspended: true,
    startableInTasklist: false,
    startablePermissionCheck: true,
    historyTimeToLive: 30,
    createdAt: '2024-01-03T08:15:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'expense-report:2:234567',
    key: 'expense-report',
    name: 'Expense Report',
    description: 'Employee expense report submission and approval',
    version: 2,
    category: 'Finance',
    deploymentId: 'deployment-006',
    resourceName: 'expense-report.bpmn',
    diagramResourceName: 'expense-report.png',
    tenantId: undefined,
    suspended: false,
    startableInTasklist: true,
    startablePermissionCheck: true,
    historyTimeToLive: 60,
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-18T15:30:00Z',
  }
];

// Mock data for process instances
const mockProcessInstances: BPMNProcessInstance[] = [
  {
    id: 'instance-001',
    processDefinitionId: 'invoice-process:1:123456',
    processDefinitionKey: 'invoice-process',
    processDefinitionName: 'Invoice Processing',
    businessKey: 'INV-2024-001',
    startTime: '2024-01-20T09:00:00Z',
    endTime: undefined,
    durationInMillis: 86400000, // 24 hours
    startUserId: 'john.doe',
    startActivityId: 'start-invoice-process',
    deleteReason: undefined,
    tenantId: undefined,
    state: 'active',
  },
  {
    id: 'instance-002',
    processDefinitionId: 'employee-onboarding:2:789012',
    processDefinitionKey: 'employee-onboarding',
    processDefinitionName: 'Employee Onboarding',
    businessKey: 'EMP-2024-001',
    startTime: '2024-01-19T14:30:00Z',
    endTime: '2024-01-21T16:00:00Z',
    durationInMillis: 172800000, // 48 hours
    startUserId: 'hr.manager',
    startActivityId: 'start-onboarding',
    deleteReason: undefined,
    tenantId: undefined,
    state: 'completed',
  },
  {
    id: 'instance-003',
    processDefinitionId: 'purchase-approval:1:345678',
    processDefinitionKey: 'purchase-approval',
    processDefinitionName: 'Purchase Approval',
    businessKey: 'PO-2024-001',
    startTime: '2024-01-20T11:15:00Z',
    endTime: undefined,
    durationInMillis: 43200000, // 12 hours
    startUserId: 'procurement.user',
    startActivityId: 'start-purchase-approval',
    deleteReason: undefined,
    tenantId: undefined,
    state: 'active',
  }
];

// Mock data for tasks
const mockTasks: BPMNTask[] = [
  {
    id: 'task-001',
    name: 'Review Invoice',
    description: 'Review invoice details and approve or reject',
    assignee: 'finance.manager',
    created: '2024-01-20T09:30:00Z',
    due: '2024-01-22T17:00:00Z',
    followUp: undefined,
    delegationState: undefined,
    executionId: 'execution-001',
    owner: undefined,
    parentTaskId: undefined,
    priority: 50,
    processDefinitionId: 'invoice-process:1:123456',
    processInstanceId: 'instance-001',
    taskDefinitionKey: 'review-invoice',
    caseExecutionId: undefined,
    caseInstanceId: undefined,
    caseDefinitionId: undefined,
    suspended: false,
    formKey: 'invoice-review-form',
    tenantId: undefined,
  },
  {
    id: 'task-002',
    name: 'Setup IT Equipment',
    description: 'Setup computer, email, and access credentials',
    assignee: 'it.support',
    created: '2024-01-19T15:00:00Z',
    due: '2024-01-23T17:00:00Z',
    followUp: undefined,
    delegationState: undefined,
    executionId: 'execution-002',
    owner: undefined,
    parentTaskId: undefined,
    priority: 30,
    processDefinitionId: 'employee-onboarding:2:789012',
    processInstanceId: 'instance-002',
    taskDefinitionKey: 'setup-it-equipment',
    caseExecutionId: undefined,
    caseInstanceId: undefined,
    caseDefinitionId: undefined,
    suspended: false,
    formKey: 'it-setup-form',
    tenantId: undefined,
  },
  {
    id: 'task-003',
    name: 'Approve Purchase',
    description: 'Review and approve purchase request',
    assignee: 'department.manager',
    created: '2024-01-20T11:30:00Z',
    due: '2024-01-24T17:00:00Z',
    followUp: undefined,
    delegationState: undefined,
    executionId: 'execution-003',
    owner: undefined,
    parentTaskId: undefined,
    priority: 40,
    processDefinitionId: 'purchase-approval:1:345678',
    processInstanceId: 'instance-003',
    taskDefinitionKey: 'approve-purchase',
    caseExecutionId: undefined,
    caseInstanceId: undefined,
    caseDefinitionId: undefined,
    suspended: false,
    formKey: 'purchase-approval-form',
    tenantId: undefined,
  }
];

// Mock data for BPMN projects with nested process definitions
const mockProjects: BPMNProject[] = [
  {
    projectId: 'project-001',
    code: 'INV',
    name: 'Invoice Management',
    description: 'Complete invoice processing and approval workflow',
    active: true,
    currentVersion: 2,
    processDefinitions: [
      {
        processDefinitionId: 'invoice-process:1:123456',
        processKey: 'invoice-process',
        bpmnDiagramUrl: 'https://example.com/diagrams/invoice-process.png',
        version: 1,
        state: 'active',
        deploymentId: 'deployment-001',
        deploymentDate: '2024-01-15T10:30:00Z',
        projectArtifacts: [
          {
            projectArtifactId: 'artifact-001',
            taskKey: 'review-invoice',
            name: 'Review Invoice',
            artifactVariables: [
              {
                artifactVariableId: 'var-001',
                name: 'amount',
                type: 'number',
                defaultValue: '0',
                required: true
              },
              {
                artifactVariableId: 'var-002',
                name: 'vendor',
                type: 'string',
                defaultValue: '',
                required: true
              }
            ]
          },
          {
            projectArtifactId: 'artifact-002',
            taskKey: 'approve-invoice',
            name: 'Approve Invoice',
            artifactVariables: [
              {
                artifactVariableId: 'var-003',
                name: 'approved',
                type: 'boolean',
                defaultValue: 'false',
                required: true
              },
              {
                artifactVariableId: 'var-004',
                name: 'comments',
                type: 'string',
                defaultValue: '',
                required: false
              }
            ]
          }
        ]
      }
    ]
  },
  {
    projectId: 'project-002',
    code: 'EMP',
    name: 'Employee Management',
    description: 'Employee onboarding and HR processes',
    active: true,
    currentVersion: 1,
    processDefinitions: [
      {
        processDefinitionId: 'employee-onboarding:2:789012',
        processKey: 'employee-onboarding',
        bpmnDiagramUrl: 'https://example.com/diagrams/employee-onboarding.png',
        version: 2,
        state: 'active',
        deploymentId: 'deployment-002',
        deploymentDate: '2024-01-10T14:20:00Z',
        projectArtifacts: [
          {
            projectArtifactId: 'artifact-003',
            taskKey: 'setup-it',
            name: 'Setup IT Equipment',
            artifactVariables: [
              {
                artifactVariableId: 'var-005',
                name: 'computerType',
                type: 'string',
                defaultValue: 'laptop',
                required: true
              },
              {
                artifactVariableId: 'var-006',
                name: 'softwareList',
                type: 'string',
                defaultValue: '',
                required: false
              }
            ]
          },
          {
            projectArtifactId: 'artifact-004',
            taskKey: 'training-complete',
            name: 'Complete Training',
            artifactVariables: [
              {
                artifactVariableId: 'var-007',
                name: 'trainingModules',
                type: 'array',
                defaultValue: '[]',
                required: true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    projectId: 'project-003',
    code: 'PUR',
    name: 'Purchase Management',
    description: 'Purchase approval and procurement workflows',
    active: true,
    currentVersion: 1,
    processDefinitions: [
      {
        processDefinitionId: 'purchase-approval:1:345678',
        processKey: 'purchase-approval',
        bpmnDiagramUrl: 'https://example.com/diagrams/purchase-approval.png',
        version: 1,
        state: 'active',
        deploymentId: 'deployment-003',
        deploymentDate: '2024-01-08T11:45:00Z',
        projectArtifacts: [
          {
            projectArtifactId: 'artifact-005',
            taskKey: 'review-purchase',
            name: 'Review Purchase Request',
            artifactVariables: [
              {
                artifactVariableId: 'var-008',
                name: 'budget',
                type: 'number',
                defaultValue: '0',
                required: true
              },
              {
                artifactVariableId: 'var-009',
                name: 'justification',
                type: 'string',
                defaultValue: '',
                required: true
              }
            ]
          }
        ]
      }
    ]
  }
];

// Mock BPMN XML content
const mockBPMNXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="invoice-process" isExecutable="true">
    <bpmn:startEvent id="start-invoice-process" name="Start Invoice Process">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="review-invoice" name="Review Invoice" assignee="finance.manager">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:exclusiveGateway id="gateway-approval" name="Approval Decision">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:endEvent id="end-approved" name="Invoice Approved">
      <bpmn:incoming>Flow_3</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="end-rejected" name="Invoice Rejected">
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="start-invoice-process" targetRef="review-invoice" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="review-invoice" targetRef="gateway-approval" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="gateway-approval" targetRef="end-approved">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">\${approved == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="Flow_4" sourceRef="gateway-approval" targetRef="end-rejected">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">\${approved == false}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
  </bpmn:process>
</bpmn:definitions>`;

class BPMNMockService {
  private config: BPMNConfig | null = null;
  private useMockData: boolean = true;

  // Configuration Management
  async setConfig(config: BPMNConfig): Promise<void> {
    this.config = config;
    // Note: Mock service doesn't need to persist configs
  }

  async getConfig(): Promise<BPMNConfig | null> {
    if (!this.config) {
      this.config = await window.igrpStudioSettings.getBPMNConfig();
    }
    return this.config;
  }

  async testConnection(config: Omit<BPMNConfig, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; message: string }> {
    // Simulate connection test with delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate different scenarios based on URL
    if (config.apiUrl.includes('mock') || config.apiUrl.includes('test')) {
      return { success: true, message: 'Mock connection successful' };
    } else if (config.apiUrl.includes('error')) {
      return { success: false, message: 'Connection failed: Invalid server' };
    } else {
      return { success: true, message: 'Connection successful' };
    }
  }

  async getProcessDefinitions(): Promise<BPMNProcessDefinition[]> {
    if (this.useMockData) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockProcessDefinitions;
    }
    
    // Real API call would go here
    throw new Error('Real API not implemented in mock service');
  }

  // New method to get all projects
  async getProjects(): Promise<BPMNProject[]> {
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return mockProjects;
    }
    
    throw new Error('Real API not implemented in mock service');
  }

  // New method to get process definitions for a specific project
  async getProcessDefinitionsByProject(projectId: string): Promise<BPMNProjectProcessDefinition[]> {
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const project = mockProjects.find(p => p.projectId === projectId);
      return project?.processDefinitions || [];
    }
    
    throw new Error('Real API not implemented in mock service');
  }

  // New method to get a specific project with its process definitions
  async getProject(projectId: string): Promise<BPMNProject> {
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const project = mockProjects.find(p => p.projectId === projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      return project;
    }
    
    throw new Error('Real API not implemented in mock service');
  }

  async getProcessInstances(processDefinitionId?: string): Promise<BPMNProcessInstance[]> {
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (processDefinitionId) {
        return mockProcessInstances.filter(instance => instance.processDefinitionId === processDefinitionId);
      }
      return mockProcessInstances;
    }
    
    throw new Error('Real API not implemented in mock service');
  }

  async getTasks(processDefinitionId?: string): Promise<BPMNTask[]> {
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      if (processDefinitionId) {
        return mockTasks.filter(task => task.processDefinitionId === processDefinitionId);
      }
      return mockTasks;
    }
    
    throw new Error('Real API not implemented in mock service');
  }

  async getProcessDefinitionXML(_processDefinitionId: string): Promise<string> {
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockBPMNXML;
    }
    
    throw new Error('Real API not implemented in mock service');
  }
  // Configuration Management using global settings
  async deleteConfig(): Promise<void> {
    this.config = null;
    await window.igrpStudioSettings.deleteBPMNConfig();
  }



  // Mock-specific methods
  setUseMockData(useMock: boolean): void {
    this.useMockData = useMock;
  }

  getUseMockData(): boolean {
    return this.useMockData;
  }


}

export const bpmnMockService = new BPMNMockService(); 