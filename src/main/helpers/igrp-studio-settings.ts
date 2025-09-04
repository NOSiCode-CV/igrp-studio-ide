import { BPMNConfig, BPMNConfigs, Connection } from '../types';

let store: any = null;

export const IGRPStudioSettings = {
  async initialize() {
    const Store = (await import('electron-store')).default;
    store = new Store({
      name: 'igrp-studio-settings',
      clearInvalidConfig: true,
      defaults: {
        activeTheme: 'default',
        bpmnConfigs: { configs: [], activeConfigId: undefined },
        language: 'en',
        connections: [],
      },
    });
  },

  async getStore() {
    if (!store) {
      await this.initialize();
    }
    return store;
  },

  setActiveTheme(theme: string) {
    store?.set('activeTheme', theme);
  },

  getActiveTheme(): string {
    return store?.get('activeTheme', 'default');
  },

  resetTheme() {
    store?.set('activeTheme', 'default');
  },

  // Language Configuration Methods
  setLanguage(language: string) {
    store?.set('language', language);
  },

  getLanguage(): string {
    return store?.get('language', 'en');
  },

  resetLanguage() {
    store?.set('language', 'en');
  },

  // BPMN Configuration Methods
  async setBPMNConfigs(configs: BPMNConfigs) {
    const storeInstance = await this.getStore();
    storeInstance.set('bpmnConfigs', configs);
  },

  async getBPMNConfigs(): Promise<BPMNConfigs> {
    const storeInstance = await this.getStore();
    console.log('configs', storeInstance.get('bpmnConfigs'));

    return storeInstance.get('bpmnConfigs', { configs: [], activeConfigId: undefined });
  },

  async getBPMNConfig(): Promise<BPMNConfig | null> {
    const storeInstance = await this.getStore();
    const configs = storeInstance.get('bpmnConfigs', { configs: [], activeConfigId: undefined });
    if (configs.activeConfigId) {
      return configs.configs.find((config: BPMNConfig) => config.id === configs.activeConfigId) || null;
    }
    return null;
  },

  async addBPMNConfig(config: BPMNConfig): Promise<void> {
    const storeInstance = await this.getStore();
    const configs = storeInstance.get('bpmnConfigs', { configs: [], activeConfigId: undefined });
    // If this is the first config, make it active
    if (configs.configs.length === 0) {
      configs.activeConfigId = config.id;
    }
    
    configs.configs.push(config);
    storeInstance.set('bpmnConfigs', configs);
  },

  async updateBPMNConfig(config: BPMNConfig): Promise<void> {
    const storeInstance = await this.getStore();
    const configs = storeInstance.get('bpmnConfigs', { configs: [], activeConfigId: undefined });
    
    const index = configs.configs.findIndex((c: BPMNConfig) => c.id === config.id);
    if (index !== -1) {
      configs.configs[index] = config;
      storeInstance.set('bpmnConfigs', configs);
    }
  },

  async deleteBPMNConfig(configId: string): Promise<void> {
    const storeInstance = await this.getStore();
    const configs = storeInstance.get('bpmnConfigs', { configs: [], activeConfigId: undefined });
    
    configs.configs = configs.configs.filter((c: BPMNConfig) => c.id !== configId);
    
    // If we deleted the active config, set the first remaining config as active
    if (configs.activeConfigId === configId) {
      configs.activeConfigId = configs.configs.length > 0 ? configs.configs[0].id : undefined;
    }
    
    storeInstance.set('bpmnConfigs', configs);
  },

  async setActiveBPMNConfig(configId: string): Promise<void> {
    const storeInstance = await this.getStore();
    const configs = storeInstance.get('bpmnConfigs', { configs: [], activeConfigId: undefined });
    
    // Verify the config exists
    const configExists = configs.configs.some((c: BPMNConfig) => c.id === configId);
    if (configExists) {
      configs.activeConfigId = configId;
      storeInstance.set('bpmnConfigs', configs);
    }
  },

  async deleteAllBPMNConfigs() {
    const storeInstance = await this.getStore();
    storeInstance.set('bpmnConfigs', { configs: [], activeConfigId: undefined });
  },

  // Database Connection Methods
  async getAllConnections(): Promise<Array<Connection>> {
    const storeInstance = await this.getStore();
    return storeInstance.get('connections', []);
  },

  async getConnection(name: string): Promise<Connection | undefined> {
    const storeInstance = await this.getStore();
    const connections = storeInstance.get('connections', []);
    return connections.find((conn: Connection) => conn.name === name);
  },

  async saveConnection(connection: Connection): Promise<Connection> {
    const storeInstance = await this.getStore();
    const connections = storeInstance.get('connections', []);
    
    const index = connections.findIndex((conn: Connection) => conn.name === connection.name);
    if (index === -1) {
      connections.push(connection);
    } else {
      connections[index] = { ...connections[index], ...connection };
    }
    
    storeInstance.set('connections', connections);
    return connection;
  },

  async deleteConnection(connectionName: string): Promise<void> {
    const storeInstance = await this.getStore();
    const connections = storeInstance.get('connections', []);
    
    const index = connections.findIndex((conn: Connection) => conn.name === connectionName);
    if (index === -1) {
      throw new Error("Connection not found.");
    }
    
    connections.splice(index, 1);
    storeInstance.set('connections', connections);
  }

};
