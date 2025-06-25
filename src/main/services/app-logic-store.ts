import { IGRPStudioSettings } from "../helpers/igrp-studio-settings";
import { AppLogicEnvironment, ConnectionTest } from "../types"

export const AppLogicStore = {

  async ensureStore() {
    return await IGRPStudioSettings.getStore();
  },

   async getEnvironments(): Promise<AppLogicEnvironment[]> {
    const store = await this.ensureStore();
    return store?.get("AppLogicEnvironments", []) || [];
  },

 async getEnvironment(id: string): Promise<AppLogicEnvironment | null> {
    const envs = await this.getEnvironments();
    return envs.find((env) => env.id === id) || null;
  },

  async setEnvironments(envs: AppLogicEnvironment[]) {
    const store = await this.ensureStore();
    store?.set("AppLogicEnvironments", envs)
  },

  async addEnvironment(env: AppLogicEnvironment) {
    const store = await this.ensureStore();
    const environments = this.getEnvironments()
    store?.set("AppLogicEnvironments", [...await environments, env])
    console.log(store)
    return env
  },
    // Search functionality
  async searchEnvironments(searchTerm: string): Promise<AppLogicEnvironment[]> {
    const environments = this.getEnvironments()
    const term = searchTerm.toLowerCase()
    return (await environments).filter(
      (env) =>
        env.name.toLowerCase().includes(term) ||
        env.description?.toLowerCase().includes(term) ||
        env.url.toLowerCase().includes(term),
    )
  },

  async updateEnvironment(id: string, updates: Partial<AppLogicEnvironment>) {
    const store = await this.ensureStore();
    const updated = (await this.getEnvironments()).map((env) =>
      env.id === id ? { ...env, ...updates, lastModified: new Date().toISOString() } : env
    )
    store?.set("AppLogicEnvironments", updated)
  },

  async deleteEnvironment(id: string) {
    const store = await this.ensureStore();
    const environments = (await this.getEnvironments()).filter((env) => env.id !== id)
    store?.set("AppLogicEnvironments", environments)
    const history = store?.get("history", {})
    delete history[id]
    store?.set("history", history)
  },

   async getEnvironmentHistory(envId: string): Promise<ConnectionTest[]> {
    const store = await this.ensureStore();
    const history = store?.get("AppLogicHistory", {}) || {}
    return history[envId] || []
  },

  // Outros
  async getStorePath(): Promise<string | null> {
    const store = await this.ensureStore();
    try {
      return (store as any)?.path || null
    } catch {
      return null
    }
  },

  async isReady() {
    const store = await this.ensureStore();
    return store !== null
  }, 

  // Backup
  async createBackup() {
    const store = await this.ensureStore();
    return {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      environments: this.getEnvironments(),
      history: store!.get("AppLogicHistory", {}),
    }
  },

  async restoreBackup(backup: any) {
    const store = await this.ensureStore();
    if (backup.environments) store!.set("AppLogicEnvironments", backup.environments)
    if (backup.history) store!.set("AppLogicHistory", backup.history)
  },

  async getStoreInfo() {
    return {
      isReady: this.isReady(),
      count: (await this.getEnvironments()).length,
    }
  },
}
