import { BPMNConfig } from '../types';

let store: any = null;

export const IGRPStudioSettings = {
  async initialize() {
    const Store = (await import('electron-store')).default;
    store = new Store({
      name: 'igrp-studio-settings',
      clearInvalidConfig: true,
      defaults: {
        activeTheme: 'default',
        bpmnConfig: null,
        language: 'en',
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
  async setBPMNConfig(config: BPMNConfig | null) {
    const storeInstance = await this.getStore();
    storeInstance.set('bpmnConfig', config);
  },

  async getBPMNConfig(): Promise<BPMNConfig | null> {
    const storeInstance = await this.getStore();
    return storeInstance.get('bpmnConfig', null);
  },

  async deleteBPMNConfig() {
    const storeInstance = await this.getStore();
    storeInstance.delete('bpmnConfig');
  },


};
