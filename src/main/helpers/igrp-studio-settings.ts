import { Environments } from '@gitbeaker/node';

let store: any = null;

export const IGRPStudioSettings = {
  async initialize() {
    const Store = (await import('electron-store')).default;
    store = new Store({
      name: 'igrp-studio-settings',
      clearInvalidConfig: true,
      defaults: {
        activeTheme: 'default',
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
  }
};
