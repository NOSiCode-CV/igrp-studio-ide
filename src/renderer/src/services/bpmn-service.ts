import { BPMNConfig, BPMNProcessInstance, BPMNTask, BPMNProject, BPMNProjectProcessDefinition, HandlerResponse, PaginatedResponse } from 'src/main/types';

class BPMNService {
  private config: BPMNConfig | null = null;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    console.log('makeRequest called for endpoint:', endpoint);
    console.log('Current config:', this.config);

    if (!this.config) {
      console.log('No config found, attempting to load...');
      this.config = await this.getConfig();
      console.log('Config loaded in makeRequest:', this.config);
    }

    if (!this.config) {
      throw new Error('BPMN API not configured. Please set up the API configuration first.');
    }

    const url = `${this.config.apiUrl}${this.config.basePath}${endpoint}`;
    console.log('url', url);
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

    const result: HandlerResponse<T> = await window.api.fetchData(url, {
      ...options,
      headers,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    if (!result.result) {
      throw new Error('No data received from API');
    }

    return result.result;
  }

  // Configuration Management
  async setConfig(config: BPMNConfig): Promise<void> {
    this.config = config;
    // Note: This method is kept for backward compatibility
    // The actual config management is now handled by the settings system
  }

  async getConfig(): Promise<BPMNConfig | null> {
    console.log('getConfig called, current config:', this.config);
    if (!this.config) {
      console.log('Loading config from settings...');
      this.config = await window.igrpStudioSettings.getBPMNConfig();
      console.log('Config loaded:', this.config);
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

      const result: HandlerResponse = await window.api.fetchData(`${config.apiUrl}${config.basePath}/projects`, {
        headers,
      });

      if (result.error) {
        return { success: false, message: result.error };
      }

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
    }
  }
  // New method to get all projects
  async getProjects(): Promise<BPMNProject[]> {
    const response = await this.makeRequest<PaginatedResponse<BPMNProject>>('/projects');
    console.log('getProjects response', response);
    return response ? response.content : [];
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
    // First, find the project that contains this process definition
    const projects = await this.makeRequest<BPMNProject[]>('/projects');
    let projectId: string | null = null;

    for (const project of projects) {
      const processDef = project.processDefinitions?.find(pd => pd.processDefinitionId === processDefinitionId);
      if (processDef) {
        projectId = project.projectId;
        break;
      }
    }

    if (!projectId) {
      throw new Error(`Process definition ${processDefinitionId} not found in any project`);
    }

    const response = await this.makeRequest<{ id: string; bpmn20Xml: string }>(
      `/projects/${projectId}/process-definitions/${processDefinitionId}/xml`
    );
    return response.bpmn20Xml;
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