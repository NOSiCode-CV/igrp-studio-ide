import { ipcMain, BrowserWindow } from "electron"
import { AppLogicStore } from "../services/app-logic-store"
import type {
  AppLogicEnvironment,
  AppLogicSettings,
  ConnectionTest,
  AppLogicRequest,
} from "../types"

export function setupAppLogicHandlers() {
  // Initialize store
  ipcMain.handle("app-logic:initialize", async () => {
    try {
      await AppLogicStore.initialize()
      return {
        success: true,
        path: AppLogicStore.getStorePath(),
        isReady: AppLogicStore.isReady(),
      }
    } catch (error) {
      console.error("Failed to initialize App Logic store:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  })

  // Environment management
  ipcMain.handle("app-logic:get-environments", () => {
    try {
      return AppLogicStore.getEnvironments()
    } catch (error) {
      console.error("Error getting environments:", error)
      return []
    }
  })

  ipcMain.handle("app-logic:add-environment", (event, environment: AppLogicEnvironment) => {
    try {
      const result = AppLogicStore.addEnvironment(environment)

      // Notify all windows about the change
      BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send("app-logic:environments-changed", AppLogicStore.getEnvironments())
      })

      return result
    } catch (error) {
      console.error("Error adding environment:", error)
      throw error
    }
  })

  ipcMain.handle("app-logic:update-environment", (event, id: string, updates: Partial<AppLogicEnvironment>) => {
    try {
      AppLogicStore.updateEnvironment(id, updates)

      // Notify all windows about the change
      BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send("app-logic:environments-changed", AppLogicStore.getEnvironments())
      })

      return true
    } catch (error) {
      console.error("Error updating environment:", error)
      throw error
    }
  })

  ipcMain.handle("app-logic:delete-environment", (event, id: string) => {
    try {
      AppLogicStore.deleteEnvironment(id)

      // Notify all windows about the change
      BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send("app-logic:environments-changed", AppLogicStore.getEnvironments())
      })

      return true
    } catch (error) {
      console.error("Error deleting environment:", error)
      throw error
    }
  })

  ipcMain.handle("app-logic:get-environment", (event, id: string) => {
    try {
      return AppLogicStore.getEnvironment(id)
    } catch (error) {
      console.error("Error getting environment:", error)
      return null
    }
  })

  ipcMain.handle("app-logic:search-environments", (event, searchTerm: string) => {
    try {
      //return AppLogicStore.searchEnvironments(searchTerm)
    } catch (error) {
      console.error("Error searching environments:", error)
      return []
    }
  })

  // Statistics
  ipcMain.handle("app-logic:get-stats", () => {
    try {
      return AppLogicStore.getEnvironmentStats()
    } catch (error) {
      console.error("Error getting stats:", error)
      return {
        total: 0,
        connected: 0,
        disconnected: 0,
        testing: 0,
        error: 0,
      }
    }
  })

  // Settings
  ipcMain.handle("app-logic:get-settings", () => {
    try {
      return AppLogicStore.getSettings()
    } catch (error) {
      console.error("Error getting settings:", error)
      return {
        autoTest: false,
        testInterval: 30,
        maxHistoryEntries: 100,
        defaultTimeout: 10000,
        retryAttempts: 1,
        notifications: true,
        autoBackup: false,
        backupInterval: 24,
      }
    }
  })

  ipcMain.handle("app-logic:update-settings", (event, updates: Partial<AppLogicSettings>) => {
    try {
      AppLogicStore.updateSettings(updates)
      return true
    } catch (error) {
      console.error("Error updating settings:", error)
      throw error
    }
  })

  // History
  ipcMain.handle("app-logic:add-connection-test", (event, test: ConnectionTest) => {
    try {
      AppLogicStore.addConnectionTest(test.environmentId, {
        success: test.success,
        timestamp: test.timestamp,
        responseTime: test.responseTime,
        error: test.error,
        statusCode: test.statusCode,
        endpoint: test.endpoint,
        method: test.method,
      })
      return true
    } catch (error) {
      console.error("Error adding connection test:", error)
      throw error
    }
  })

  ipcMain.handle("app-logic:get-environment-history", (event, environmentId: string) => {
    try {
      return AppLogicStore.getEnvironmentHistory(environmentId)
    } catch (error) {
      console.error("Error getting environment history:", error)
      return []
    }
  })

  ipcMain.handle("app-logic:clear-environment-history", (event, environmentId: string) => {
    try {
      //AppLogicStore.clearEnvironmentHistory(environmentId)
      return true
    } catch (error) {
      console.error("Error clearing environment history:", error)
      throw error
    }
  })

  // Requests
  ipcMain.handle("app-logic:add-request", (event, request: AppLogicRequest) => {
    try {
      //AppLogicStore.addRequest(request)
      return true
    } catch (error) {
      console.error("Error adding request:", error)
      throw error
    }
  })

  ipcMain.handle("app-logic:get-requests", (event, environmentId?: string) => {
    try {
      //return AppLogicStore.getRequests(environmentId)
    } catch (error) {
      console.error("Error getting requests:", error)
      return []
    }
  })

  // Backup/Export
  ipcMain.handle("app-logic:create-backup", () => {
    try {
      return AppLogicStore.createBackup()
    } catch (error) {
      console.error("Error creating backup:", error)
      throw error
    }
  })

  ipcMain.handle("app-logic:restore-backup", (event, backup: any) => {
    try {
      AppLogicStore.restoreBackup(backup)

      // Notify all windows about the change
      BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send("app-logic:environments-changed", AppLogicStore.getEnvironments())
      })

      return true
    } catch (error) {
      console.error("Error restoring backup:", error)
      throw error
    }
  })

  ipcMain.handle("app-logic:export-data", () => {
    try {
      const backup = AppLogicStore.createBackup()
      return JSON.stringify(backup, null, 2)
    } catch (error) {
      console.error("Error exporting data:", error)
      throw error
    }
  })

  ipcMain.handle("app-logic:import-data", (event, jsonData: string) => {
    try {
      const backup = JSON.parse(jsonData)
      AppLogicStore.restoreBackup(backup)

      // Notify all windows about the change
      BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send("app-logic:environments-changed", AppLogicStore.getEnvironments())
      })

      return { success: true }
    } catch (error) {
      console.error("Error importing data:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Invalid backup format",
      }
    }
  })

  // Store info
  ipcMain.handle("app-logic:get-store-info", () => {
    try {
      return {
        isReady: AppLogicStore.isReady(),
        isElectron: true,
        path: AppLogicStore.getStorePath(),
        //size: AppLogicStore.getStoreSize(),
      }
    } catch (error) {
      console.error("Error getting store info:", error)
      return {
        isReady: false,
        isElectron: true,
        path: null,
        size: 0,
      }
    }
  })

  // HTTP Client operations
  ipcMain.handle("app-logic:test-environment", async (event, environment: AppLogicEnvironment) => {
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(environment.url, {
        method: "GET",
        headers: {
          "X-API-Key": environment.apiKey,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      const isSuccess = response.ok

      return {
        isValid: isSuccess,
        responseTime,
        error: isSuccess ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
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
  })

  ipcMain.handle(
    "app-logic:make-request",
    async (event, environment: AppLogicEnvironment, endpoint: string, options: any = {}) => {
      const url = `${environment.url}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`
      const method = options.method || "GET"
      const timeout = options.timeout || 10000

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-API-Key": environment.apiKey,
        ...options.headers,
      }

      const requestOptions: RequestInit = {
        method,
        headers,
      }

      if (options.body && ["POST", "PUT", "PATCH"].includes(method)) {
        requestOptions.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body)
      }

      const startTime = Date.now()

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const responseTime = Date.now() - startTime

        let data: any
        try {
          const contentType = response.headers.get("content-type")
          if (contentType?.includes("application/json")) {
            data = await response.json()
          } else {
            data = await response.text()
          }
        } catch {
          data = null
        }

        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value
        })

        return {
          status: response.status,
          data,
          headers: responseHeaders,
          responseTime,
          success: response.ok,
        }
      } catch (error) {
        const responseTime = Date.now() - startTime

        if (error instanceof Error && error.name === "AbortError") {
          throw new Error(`Request timeout after ${timeout}ms`)
        }

        throw new Error(error instanceof Error ? error.message : "Network error")
      }
    },
  )

  console.log("✅ App Logic IPC handlers registered successfully")
}
