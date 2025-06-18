"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { AppLogicIPCClient } from "@renderer/pages/applogic/client"
import { EnvironmentValidator } from "@renderer/pages/applogic/validation"
import type { AppLogicEnvironment, ConnectionTest } from "src/main/types"
import useCore from "./use-core"

export function useAppLogic() {
  const [environments, setEnvironments] = useState<AppLogicEnvironment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const initRef = useRef(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const { fetchData } = useCore();

  // Initialize
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const initialize = async () => {
      try {
        setLoading(true)
        setError(null)

        const storedEnvironments = await AppLogicIPCClient.getEnvironments()
        setEnvironments(storedEnvironments)
        setIsInitialized(true)

        //toast.success("Storage initialized successfully")

        // Real-time updates
        const unsubscribe = AppLogicIPCClient.onEnvironmentsChanged((newEnvironments) => {
          setEnvironments(newEnvironments)
        })
        unsubscribeRef.current = unsubscribe
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize"
        setError(errorMessage)
        toast.error("Failed to initialize storage")
      } finally {
        setLoading(false)
      }
    }

    initialize()

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      AppLogicIPCClient.cleanup()
    }
  }, [])

  // Create environment
  const createEnvironment = useCallback(
    async (data: Omit<AppLogicEnvironment, "id" | "status" | "createdAt">) => {
      if (!isInitialized) {
        toast.error("Storage not initialized")
        return null
      }

      try {
        const validation = EnvironmentValidator.validateEnvironment(data)
        if (!validation.isValid) {
          toast.error(`Validation failed: ${validation.errors.join(", ")}`)
          return null
        }

        validation.warnings.forEach((warning) => toast.warning(warning))

        const sanitized = EnvironmentValidator.sanitizeEnvironment(data)
        const environment: AppLogicEnvironment = {
          id: `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...sanitized,
          status: "disconnected",
          createdAt: new Date().toISOString(),
        } as AppLogicEnvironment

        const created = await AppLogicIPCClient.addEnvironment(environment)
        toast.success(`Environment "${created.name}" created successfully`)
        return created
      } catch (err) {
        console.error("Error creating environment:", err)
        toast.error("Failed to create environment")
        return null
      }
    },
    [isInitialized],
  )

  // Update environment
  const updateEnvironment = useCallback(
    async (id: string, updates: Partial<AppLogicEnvironment>) => {
      if (!isInitialized) {
        toast.error("Storage not initialized")
        return false
      }

      try {
        await AppLogicIPCClient.updateEnvironment(id, updates)
        if (!updates.status) {
          toast.success("Environment updated successfully")
        }
        return true
      } catch (err) {
        console.error("Error updating environment:", err)
        toast.error("Failed to update environment")
        return false
      }
    },
    [isInitialized],
  )

  // Delete environment
  const deleteEnvironment = useCallback(
    async (id: string) => {
      if (!isInitialized) {
        toast.error("Storage not initialized")
        return false
      }

      try {
        const environment = await AppLogicIPCClient.getEnvironment(id)
        if (!environment) {
          toast.error("Environment not found")
          return false
        }

        await AppLogicIPCClient.deleteEnvironment(id)
        toast.success(`Environment "${environment.name}" deleted successfully`)
        return true
      } catch (err) {
        console.error("Error deleting environment:", err)
        toast.error("Failed to delete environment")
        return false
      }
    },
    [isInitialized],
  )
  
 // Test environment
  const testEnvironment = useCallback(
    async (id: string) => {
      if (!isInitialized || !window.appLogicAPI) {
        toast.error("App Logic not initialized")
        return false
      }

      try {
        const environment = await window.appLogicAPI.getEnvironment(id)
        if (!environment) {
          toast.error("Environment not found")
          return false
        }

        await updateEnvironment(id, { status: "testing" })
        const result = await window.appLogicAPI.testEnvironment(environment)
        console.log(result)
        const test: ConnectionTest = {
          id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          environmentId: id,
          success: result.isValid,
          timestamp: new Date().toISOString(),
          responseTime: result.responseTime,
          error: result.error,
          statusCode: result.statusCode,
          endpoint: "/",
          method: "GET",
        }

        await window.appLogicAPI.addConnectionTest(test)

        const newStatus = result.isValid ? "connected" : "error"
        await updateEnvironment(id, {
          status: newStatus,
          lastTested: new Date().toISOString(),
        })

        if (result.isValid) {
          toast.success(`Environment tested successfully (${result.responseTime}ms)`)
        } else {
          toast.error(`Environment test failed: ${result.error}`)
        }

        return result.isValid
      } catch (err) {
        console.error("Error testing environment:", err)
        await updateEnvironment(id, { status: "error" })
        toast.error("Failed to test environment")
        return false
      }
    },
    [isInitialized, updateEnvironment],
  )

  // Search environments
  const searchEnvironments = useCallback(
    (query: string) => {
      if (!query.trim()) return environments

      const searchTerm = query.toLowerCase()
      return environments.filter(
        (env) =>
          env.name.toLowerCase().includes(searchTerm) ||
          env.description?.toLowerCase().includes(searchTerm) ||
          env.url.toLowerCase().includes(searchTerm),
      )
    },
    [environments],
  )
  
  // Export
  const exportEnvironments = useCallback(async () => {
    if (!isInitialized) {
      toast.error("Storage not initialized")
      return
    }

    try {
      const data = await AppLogicIPCClient.exportData()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `app-logic-backup-${new Date().toISOString().split("T")[0]}.json`
      link.click()

      URL.revokeObjectURL(url)
      toast.success("Data exported successfully")
    } catch (err) {
      console.error("Export error:", err)
      toast.error("Failed to export data")
    }
  }, [isInitialized])

  return {
    environments,
    loading,
    error,
    isInitialized,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    testEnvironment,
    searchEnvironments,
    exportEnvironments,
    getEnvironmentHistory: (id: string) => AppLogicIPCClient.getEnvironmentHistory(id),
  }
}
