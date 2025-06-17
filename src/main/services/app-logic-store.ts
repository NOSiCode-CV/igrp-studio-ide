import { AppLogicEnvironment, AppLogicSettings, ConnectionTest } from "../types"

let store: any = null;
export const AppLogicStore = {
  async initialize() {    
    const Store = (await import("electron-store")).default
    store = new Store({
      name: "igrp-app-logic",
      clearInvalidConfig: true,
      defaults: {
        environments: [],
        settings: {
          autoTest: false,
          testInterval: 30,
          maxHistoryEntries: 100,
          defaultTimeout: 10000,
          retryAttempts: 1,
          notifications: true,
          autoBackup: false,
          backupInterval: 24,
        },
        history: {},
      },
    })
  },

  // Environments
  getEnvironments(): AppLogicEnvironment[] {
    return store?.get("environments", []) || []
  },

  getEnvironment(id: string): AppLogicEnvironment | null {
    return this.getEnvironments().find((env) => env.id === id) || null
  },

  setEnvironments(envs: AppLogicEnvironment[]) {
    store?.set("environments", envs)
  },

    addEnvironment(env: AppLogicEnvironment) {
    const environments = this.getEnvironments()
    store?.set("environments", [...environments, env])
    return env // ✅ adicione esta linha
  },


  updateEnvironment(id: string, updates: Partial<AppLogicEnvironment>) {
    const updated = this.getEnvironments().map((env) =>
      env.id === id ? { ...env, ...updates, lastModified: new Date().toISOString() } : env
    )
    store?.set("environments", updated)
  },

  deleteEnvironment(id: string) {
    const environments = this.getEnvironments().filter((env) => env.id !== id)
    store?.set("environments", environments)
    const history = store?.get("history", {})
    delete history[id]
    store?.set("history", history)
  },

  // Settings
  getSettings(): AppLogicSettings {
    return store?.get("settings") || {}
  },

  updateSettings(updates: Partial<AppLogicSettings>) {
    const current = this.getSettings()
    store?.set("settings", { ...current, ...updates })
  },

  // History
  addConnectionTest(envId: string, test: Omit<ConnectionTest, "id" | "environmentId">) {
    const history = store?.get("history", {}) || {}
    const list = history[envId] || []

    const fullTest: ConnectionTest = {
      id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      environmentId: envId,
      ...test,
    }

    list.unshift(fullTest)

    const max = this.getSettings().maxHistoryEntries || 50
    if (list.length > max) list.splice(max)

    history[envId] = list
    store?.set("history", history)
  },

  getEnvironmentHistory(envId: string): ConnectionTest[] {
    const history = store?.get("history", {}) || {}
    return history[envId] || []
  },

  // Outros
  getStorePath(): string | null {
    try {
      return (store as any)?.path || null
    } catch {
      return null
    }
  },

  isReady() {
    return store !== null
  },
    // Statistics
  getEnvironmentStats() {    
    const environments = this.getEnvironments()
    return {
      total: environments.length,
      connected: environments.filter((e) => e.status === "connected").length,
      disconnected: environments.filter((e) => e.status === "disconnected").length,
      testing: environments.filter((e) => e.status === "testing").length,
      error: environments.filter((e) => e.status === "error").length,
    }
  },

    // Backup
  createBackup() {
    return {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      environments: this.getEnvironments(),
      settings: this.getSettings(),
      history: store!.get("history", {}),
    }
  },

  restoreBackup(backup: any) {
    if (backup.environments) store!.set("environments", backup.environments)
    if (backup.settings) this.updateSettings(backup.settings)
    if (backup.history) store!.set("history", backup.history)
  },

  getStoreInfo() {
    return {
      isReady: this.isReady(),
      count: this.getEnvironments().length,
    }
  },
}
