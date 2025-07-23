import { BPMNConfig, BPMNProcessDefinition, BPMNProcessInstance, BPMNTask, BPMNProject, BPMNProjectProcessDefinition } from 'src/main/types';

class BPMNService {
  private config: BPMNConfig | null = null;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.config) {
      throw new Error('BPMN API not configured. Please set up the API configuration first.');
    }

    const url = `${this.config.apiUrl}${this.config.basePath}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add any additional headers from options
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Only add Authorization header if token is provided
    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    const response = await fetch(url, {
      headers,
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
    // Note: This method is kept for backward compatibility
    // The actual config management is now handled by the settings system
  }

  async getConfig(): Promise<BPMNConfig | null> {
    if (!this.config) {
      this.config = await window.igrpStudioSettings.getBPMNConfig();
    }
    return this.config;
  }

  async testConnection(config: Omit<BPMNConfig, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; message: string }> {
    try {
      const headers: Record<string, string> = {};
      
      // Only add Authorization header if token is provided
      if (config.token) {
        headers['Authorization'] = `Bearer ${config.token}`;
      }

      const response = await fetch(`${config.apiUrl}${config.basePath}/projects`, {
        headers,
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
    const response = await this.makeRequest<any[]>('/projects');

    return response.map((item: any) => ({
      id: item.id || item.key,
      key: item.key || item.id,
      name: item.name,
      description: item.description,
      version: item.version || 1,
      category: item.category,
      deploymentId: item.deploymentId || item.id,
      resourceName: item.resourceName || `${item.key}.bpmn`,
      diagramResourceName: item.diagramResourceName || `${item.key}.png`,
      tenantId: item.tenantId,
      suspended: item.suspended || false,
      startableInTasklist: item.startableInTasklist || true,
      startablePermissionCheck: item.startablePermissionCheck || true,
      historyTimeToLive: item.historyTimeToLive || 30,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    }));
  }

  // New method to get all projects
  async getProjects(): Promise<BPMNProject[]> {
    const response = await this.makeRequest<BPMNProject[]>('/projects');
    return response;
  }

  // New method to get process definitions for a specific project
  async getProcessDefinitionsByProject(projectId: string): Promise<BPMNProjectProcessDefinition[]> {
    const response = await this.makeRequest<BPMNProject>(`/projects/${projectId}`);
    return response.processDefinitions || [];
  }

  // New method to get a specific project with its process definitions
  async getProject(projectId: string): Promise<BPMNProject> {
    const response = await this.makeRequest<BPMNProject>(`/projects/${projectId}`);
    return response;
  }

  async getProcessInstances(processDefinitionId?: string): Promise<BPMNProcessInstance[]> {
    const endpoint = processDefinitionId 
      ? `/process-instances?processDefinitionId=${processDefinitionId}`
      : '/process-instances';

    const response = await this.makeRequest<any[]>(endpoint);

    return response.map((item: any) => ({
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
      ? `/tasks?processDefinitionId=${processDefinitionId}`
      : '/tasks';

    const response = await this.makeRequest<any[]>(endpoint);

    return response.map((item: any) => ({
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
      `/projects/${processDefinitionId}/xml`
    );
    return response.bpmn20Xml;
  }

  async startProcessInstance(
    processDefinitionId: string,
    variables?: Record<string, any>
  ): Promise<{ id: string; definitionId: string; businessKey?: string }> {
    const response = await this.makeRequest<{ id: string; definitionId: string; businessKey?: string }>(
      `/projects/${processDefinitionId}/start`,
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
      `/tasks/${taskId}/complete`,
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
  async deleteConfig(configId?: string): Promise<void> {
    this.config = null;
    if (configId) {
      await window.igrpStudioSettings.deleteBPMNConfig(configId);
    } else {
      await window.igrpStudioSettings.deleteAllBPMNConfigs();
    }
  }


}

export const bpmnService = new BPMNService(); 