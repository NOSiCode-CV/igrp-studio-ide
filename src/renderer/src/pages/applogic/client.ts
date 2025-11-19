import type { AppLogicEnvironment, ConnectionTest } from 'src/main/types'

// Verificar se estamos em ambiente Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.appLogicAPI !== undefined
}

export class AppLogicIPCClient {
  // Environment management
  static async getEnvironments(): Promise<AppLogicEnvironment[]> {
    try {
      return await window.appLogicAPI.getEnvironments()
    } catch (error) {
      console.error('Error getting environments via IPC:', error)
      throw error
    }
  }

  static async addEnvironment(environment: AppLogicEnvironment): Promise<AppLogicEnvironment> {
    try {
      return await window.appLogicAPI.addEnvironment(environment)
    } catch (error) {
      console.error('Error adding environment via IPC:', error)
      throw error
    }
  }

  static async updateEnvironment(id: string, updates: Partial<AppLogicEnvironment>): Promise<void> {
    try {
      await window.appLogicAPI.updateEnvironment(id, updates)
      return
    } catch (error) {
      console.error('Error updating environment via IPC:', error)
      throw error
    }
  }

  static async deleteEnvironment(id: string): Promise<void> {
    try {
      await window.appLogicAPI.deleteEnvironment(id)
      return
    } catch (error) {
      console.error('Error deleting environment via IPC:', error)
      throw error
    }
  }

  static async getEnvironment(id: string): Promise<AppLogicEnvironment | null> {
    const environments = await this.getEnvironments()
    return environments.find((env) => env.id === id) || null
  }

  // History
  static async addConnectionTest(test: ConnectionTest): Promise<void> {
    try {
      await window.appLogicAPI.addConnectionTest(test)
      return
    } catch (error) {
      console.error('Error adding connection test via IPC:', error)
      throw error
    }
  }

  static async getEnvironmentHistory(environmentId: string): Promise<ConnectionTest[]> {
    try {
      return await window.appLogicAPI.getEnvironmentHistory(environmentId)
    } catch (error) {
      console.error('Error getting environment history via IPC:', error)
      throw error
    }
  }

  // Test environment
  static async testEnvironment(environment: AppLogicEnvironment) {
    try {
      return await window.appLogicAPI.testEnvironment(environment)
    } catch (error) {
      console.error('Error testing environment via IPC:', error)
      throw error
    }

    /*const startTime = Date.now()

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
        error: error ? undefined : `HTTP ${result}: ${result}`,
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
    }*/
  }

  // Export/Import
  static async exportData(): Promise<string> {
    try {
      return await window.appLogicAPI.exportData()
    } catch (error) {
      console.error('Error exporting data via IPC:', error)
      throw error
    }
  }

  static async importData(jsonData: string): Promise<void> {
    try {
      const result = await window.appLogicAPI.importData(jsonData)
      if (!result.success) {
        throw new Error(result.error || 'Import failed')
      }
      return
    } catch (error) {
      console.error('Error importing data via IPC:', error)
      throw error
    }
  }

  // Events
  static onEnvironmentsChanged(
    callback: (environments: AppLogicEnvironment[]) => void
  ): () => void {
    try {
      return window.appLogicAPI.onEnvironmentsChanged(callback)
    } catch (error) {
      console.error('Error setting up environment change listener:', error)
      throw error
    }
  }

  static cleanup(): void {
    if (isElectron() && window.appLogicAPI) {
      try {
        window.appLogicAPI.removeAllListeners()
      } catch (error) {
        console.error('Error cleaning up listeners:', error)
      }
    }
  }

  // Utility methods
  static getStorageType(): string {
    return isElectron() ? 'Electron IPC' : 'localStorage Fallback'
  }
}
