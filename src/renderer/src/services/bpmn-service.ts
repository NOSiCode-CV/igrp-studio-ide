import { BPMNConfig, BPMNProcessDefinition, BPMNProcessInstance, BPMNTask } from 'src/main/types';

class BPMNService {
  private config: BPMNConfig | null = null;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.config) {
      throw new Error('BPMN API not configured. Please set up the API configuration first.');
    }

    const url = `${this.config.apiUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.token}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Configuration Management
  async setConfig(config: BPMNConfig): Promise<void> {
    this.config = config;
    await window.igrpStudioSettings.setBPMNConfig(config);
  }

  async getConfig(): Promise<BPMNConfig | null> {
    if (!this.config) {
      this.config = await window.igrpStudioSettings.getBPMNConfig();
    }
    return this.config;
  }

  async testConnection(config: Omit<BPMNConfig, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${config.apiUrl}/engine-rest/process-definition`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
        },
      });
      
      if (response.ok) {
        return { success: true, message: 'Connection successful' };
      } else {
        return { success: false, message: `Connection failed: ${response.status} ${response.statusText}` };
      }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  async getProcessDefinitions(): Promise<BPMNProcessDefinition[]> {
    const response = await this.makeRequest<{ data: any[] }>('/engine-rest/process-definition');

    return response.data.map((item: any) => ({
      id: item.id,
      key: item.key,
      name: item.name,
      description: item.description,
      version: item.version,
      category: item.category,
      deploymentId: item.deploymentId,
      resourceName: item.resourceName,
      diagramResourceName: item.diagramResourceName,
      tenantId: item.tenantId,
      suspended: item.suspended,
      startableInTasklist: item.startableInTasklist,
      startablePermissionCheck: item.startablePermissionCheck,
      historyTimeToLive: item.historyTimeToLive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  async getProcessInstances(processDefinitionId?: string): Promise<BPMNProcessInstance[]> {
    const endpoint = processDefinitionId 
      ? `/engine-rest/process-instance?processDefinitionId=${processDefinitionId}`
      : '/engine-rest/process-instance';

    const response = await this.makeRequest<{ data: any[] }>(endpoint);

    return response.data.map((item: any) => ({
      id: item.id,
      processDefinitionId: item.processDefinitionId,
      processDefinitionKey: item.processDefinitionKey,
      processDefinitionName: item.processDefinitionName,
      businessKey: item.businessKey,
      startTime: item.startTime,
      endTime: item.endTime,
      durationInMillis: item.durationInMillis,
      startUserId: item.startUserId,
      startActivityId: item.startActivityId,
      deleteReason: item.deleteReason,
      tenantId: item.tenantId,
      state: item.suspended ? 'suspended' : item.endTime ? 'completed' : 'active',
    }));
  }

  async getTasks(processDefinitionId?: string): Promise<BPMNTask[]> {
    const endpoint = processDefinitionId 
      ? `/engine-rest/task?processDefinitionId=${processDefinitionId}`
      : '/engine-rest/task';

    const response = await this.makeRequest<{ data: any[] }>(endpoint);

    return response.data.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      assignee: item.assignee,
      created: item.created,
      due: item.due,
      followUp: item.followUp,
      delegationState: item.delegationState,
      executionId: item.executionId,
      owner: item.owner,
      parentTaskId: item.parentTaskId,
      priority: item.priority,
      processDefinitionId: item.processDefinitionId,
      processInstanceId: item.processInstanceId,
      taskDefinitionKey: item.taskDefinitionKey,
      caseExecutionId: item.caseExecutionId,
      caseInstanceId: item.caseInstanceId,
      caseDefinitionId: item.caseDefinitionId,
      suspended: item.suspended,
      formKey: item.formKey,
      tenantId: item.tenantId,
    }));
  }

  async getProcessDefinitionXML(processDefinitionId: string): Promise<string> {
    const response = await this.makeRequest<{ id: string; bpmn20Xml: string }>(
      `/engine-rest/process-definition/${processDefinitionId}/xml`
    );
    return response.bpmn20Xml;
  }

  async startProcessInstance(
    processDefinitionId: string,
    variables?: Record<string, any>
  ): Promise<{ id: string; definitionId: string; businessKey?: string }> {
    const response = await this.makeRequest<{ id: string; definitionId: string; businessKey?: string }>(
      `/engine-rest/process-definition/${processDefinitionId}/start`,
      {
        method: 'POST',
        body: JSON.stringify({
          variables: variables ? Object.entries(variables).reduce((acc, [key, value]) => {
            acc[key] = { value: value };
            return acc;
          }, {} as Record<string, { value: any }>) : {},
        }),
      }
    );
    return response;
  }

  async completeTask(
    taskId: string,
    variables?: Record<string, any>
  ): Promise<void> {
    await this.makeRequest(
      `/engine-rest/task/${taskId}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({
          variables: variables ? Object.entries(variables).reduce((acc, [key, value]) => {
            acc[key] = { value: value };
            return acc;
          }, {} as Record<string, { value: any }>) : {},
        }),
      }
    );
  }

  // Configuration Management using global settings
  async deleteConfig(): Promise<void> {
    this.config = null;
    await window.igrpStudioSettings.deleteBPMNConfig();
  }


}

export const bpmnService = new BPMNService(); 