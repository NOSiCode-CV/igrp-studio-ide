import useCore from '@renderer/hooks/use-core';
import type { AppLogicEnvironment, ConnectionTest, AppLogicSettings } from 'src/main/types';

// Verificar se estamos em ambiente Electron
const isElectron = () => {
  return typeof window !== "undefined" && window.appLogicAPI !== undefined
}

// Fallback storage para ambiente web
class FallbackStorage {
  private prefix = "app-logic-"

  get(key: string, defaultValue?: any) {
    try {
      const stored = localStorage.getItem(this.prefix + key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  }

  set(key: string, value: any) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value))
    } catch (error) {
      console.error("Failed to save to localStorage:", error)
    }
  }
}

export class AppLogicIPCClient {
  private static isInitialized = false
  private static fallbackStorage = new FallbackStorage()

  static async initialize(): Promise<void> {
    if (this.isInitialized) return

    if (isElectron()) {
      try {
        const result = await window.appLogicAPI.initialize()
        if (!result.success) {
          throw new Error(result.error || "Failed to initialize storage")
        }
        console.log("✅ App Logic IPC Client initialized at:", result.path)
      } catch (error) {
        console.error("❌ Failed to initialize Electron IPC, using fallback:", error)
        // Continue with fallback storage
      }
    } else {
      console.log("🌐 Running in web environment, using localStorage fallback")
    }

    this.isInitialized = true
  }

  static isReady(): boolean {
    return this.isInitialized
  }

  // Environment management
  static async getEnvironments(): Promise<AppLogicEnvironment[]> {
    if (!this.isReady()) return []

    if (isElectron()) {
      try {
        return await window.appLogicAPI.getEnvironments()
      } catch (error) {
        console.error("Error getting environments via IPC:", error)
      }
    }

    // Fallback to localStorage
    return this.fallbackStorage.get("environments", [])
  }

  static async addEnvironment(environment: AppLogicEnvironment): Promise<AppLogicEnvironment> {
    if (!this.isReady()) throw new Error("Client not initialized")
      
    if (isElectron()) {

      try {
        return await window.appLogicAPI.addEnvironment(environment)
      } catch (error) {
        console.error("Error adding environment via IPC:", error)
      }
    }

    // Fallback to localStorage
    const environments = await this.getEnvironments()
    const updated = [...environments, environment]
    this.fallbackStorage.set("environments", updated)
    return environment
  }

  static async updateEnvironment(id: string, updates: Partial<AppLogicEnvironment>): Promise<void> {
    if (!this.isReady()) throw new Error("Client not initialized")

    if (isElectron()) {
      try {
        await window.appLogicAPI.updateEnvironment(id, updates)
        return
      } catch (error) {
        console.error("Error updating environment via IPC:", error)
      }
    }

    // Fallback to localStorage
    const environments = await this.getEnvironments()
    const updated = environments.map((env) =>
      env.id === id ? { ...env, ...updates, lastModified: new Date().toISOString() } : env,
    )
    this.fallbackStorage.set("environments", updated)
  }

  static async deleteEnvironment(id: string): Promise<void> {
    if (!this.isReady()) throw new Error("Client not initialized")

    if (isElectron()) {
      try {
        await window.appLogicAPI.deleteEnvironment(id)
        return
      } catch (error) {
        console.error("Error deleting environment via IPC:", error)
      }
    }

    // Fallback to localStorage
    const environments = await this.getEnvironments()
    const updated = environments.filter((env) => env.id !== id)
    this.fallbackStorage.set("environments", updated)
  }

  static async getEnvironment(id: string): Promise<AppLogicEnvironment | null> {
    if (!this.isReady()) return null

    const environments = await this.getEnvironments()
    return environments.find((env) => env.id === id) || null
  }

  // Statistics
  static async getStats() {
    const defaultStats = { total: 0, connected: 0, disconnected: 0, testing: 0, error: 0 }

    if (!this.isReady()) return defaultStats

    if (isElectron()) {
      try {
        return await window.appLogicAPI.getStats()
      } catch (error) {
        console.error("Error getting stats via IPC:", error)
      }
    }

    // Fallback calculation
    const environments = await this.getEnvironments()
    return {
      total: environments.length,
      connected: environments.filter((e) => e.status === "connected").length,
      disconnected: environments.filter((e) => e.status === "disconnected").length,
      testing: environments.filter((e) => e.status === "testing").length,
      error: environments.filter((e) => e.status === "error").length,
    }
  }

  // Settings
  static async getSettings(): Promise<AppLogicSettings> {
    const defaultSettings: AppLogicSettings = {
      autoTest: false,
      testInterval: 30,
      maxHistoryEntries: 100,
      defaultTimeout: 10000,
      retryAttempts: 1,
      notifications: true,
      autoBackup: false,
      backupInterval: 24,
    }

    if (!this.isReady()) return defaultSettings

    if (isElectron()) {
      try {
        return await window.appLogicAPI.getSettings()
      } catch (error) {
        console.error("Error getting settings via IPC:", error)
      }
    }

    return this.fallbackStorage.get("settings", defaultSettings)
  }

  static async updateSettings(updates: Partial<AppLogicSettings>): Promise<void> {
    if (!this.isReady()) throw new Error("Client not initialized")

    if (isElectron()) {
      try {
        await window.appLogicAPI.updateSettings(updates)
        return
      } catch (error) {
        console.error("Error updating settings via IPC:", error)
      }
    }

    const current = await this.getSettings()
    this.fallbackStorage.set("settings", { ...current, ...updates })
  }

  // History
  static async addConnectionTest(test: ConnectionTest): Promise<void> {
    if (!this.isReady()) throw new Error("Client not initialized")

    if (isElectron()) {
      try {
        await window.appLogicAPI.addConnectionTest(test)
        return
      } catch (error) {
        console.error("Error adding connection test via IPC:", error)
      }
    }

    const history = this.fallbackStorage.get("history", {})
    const environmentHistory = history[test.environmentId] || []
    environmentHistory.unshift(test)

    // Keep only recent entries
    if (environmentHistory.length > 50) {
      environmentHistory.splice(50)
    }

    history[test.environmentId] = environmentHistory
    this.fallbackStorage.set("history", history)
  }

  static async getEnvironmentHistory(environmentId: string): Promise<ConnectionTest[]> {
    if (!this.isReady()) return []

    if (isElectron()) {
      try {
        return await window.appLogicAPI.getEnvironmentHistory(environmentId)
      } catch (error) {
        console.error("Error getting environment history via IPC:", error)
      }
    }

    const history = this.fallbackStorage.get("history", {})
    return history[environmentId] || []
  }

  // Test environment
  static async testEnvironment(environment: AppLogicEnvironment) {

    const { fetchData } = useCore();
    if (!this.isReady()) throw new Error("Client not initialized")

    if (isElectron()) {
      try {
        return await window.appLogicAPI.testEnvironment(environment)
      } catch (error) {
        console.error("Error testing environment via IPC:", error)
      }
    }

    // Fallback HTTP test
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
    
      const { result, error } = await fetchData(environment.url, {
        method: "GET",
        headers: {
          "X-API-Key": environment.apiKey,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      return {
        isValid: result,
        responseTime,
        error:error ? undefined : `HTTP ${result}: ${result}`,
        statusCode: result,
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        isValid: false,
        responseTime,
        error: error instanceof Error ? error.message : "Network error",
        statusCode: 0,
      }
    }
  }

  // Export/Import
  static async exportData(): Promise<string> {
    if (!this.isReady()) throw new Error("Client not initialized")

    if (isElectron()) {
      try {
        return await window.appLogicAPI.exportData()
      } catch (error) {
        console.error("Error exporting data via IPC:", error)
      }
    }

    // Fallback export
    const backup = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      environments: await this.getEnvironments(),
      settings: await this.getSettings(),
      history: this.fallbackStorage.get("history", {}),
    }

    return JSON.stringify(backup, null, 2)
  }

  static async importData(jsonData: string): Promise<void> {
    if (!this.isReady()) throw new Error("Client not initialized")

    if (isElectron()) {
      try {
        const result = await window.appLogicAPI.importData(jsonData)
        if (!result.success) {
          throw new Error(result.error || "Import failed")
        }
        return
      } catch (error) {
        console.error("Error importing data via IPC:", error)
      }
    }

    // Fallback import
    try {
      const backup = JSON.parse(jsonData)
      if (backup.environments) this.fallbackStorage.set("environments", backup.environments)
      if (backup.settings) this.fallbackStorage.set("settings", backup.settings)
      if (backup.history) this.fallbackStorage.set("history", backup.history)
    } catch (error) {
      throw new Error("Invalid backup format")
    }
  }

  // Events
  static onEnvironmentsChanged(callback: (environments: AppLogicEnvironment[]) => void): () => void {
    if (!this.isReady()) return () => {}

    if (isElectron()) {
      try {
        return window.appLogicAPI.onEnvironmentsChanged(callback)
      } catch (error) {
        console.error("Error setting up environment change listener:", error)
      }
    }

    // Fallback: poll for changes (simple implementation)
    let lastEnvironments = JSON.stringify([])
    const interval = setInterval(async () => {
      const currentEnvironments = await this.getEnvironments()
      const currentString = JSON.stringify(currentEnvironments)
      if (currentString !== lastEnvironments) {
        lastEnvironments = currentString
        callback(currentEnvironments)
      }
    }, 1000)

    return () => clearInterval(interval)
  }

  static cleanup(): void {
    if (isElectron() && window.appLogicAPI) {
      try {
        window.appLogicAPI.removeAllListeners()
      } catch (error) {
        console.error("Error cleaning up listeners:", error)
      }
    }
  }

  // Utility methods
  static getStorageType(): string {
    return isElectron() ? "Electron IPC" : "localStorage Fallback"
  }

  static isUsingElectron(): boolean {
    return isElectron()
  }
}
