export interface AppLogicEnvironment {
  id: string
  name: string
  url: string
  apiKey: string
  status: "connected" | "disconnected" | "testing" | "error"
  description?: string
  createdAt: string
  lastTested?: string
  lastModified?: string
  tags?: string[]
  timeout?: number
  retryAttempts?: number
  headers?: Record<string, string>
  authType?: "bearer" | "apikey" | "basic" | "none"
  healthCheckEndpoint?: string
}

export interface ConnectionTest {
  id: string
  environmentId: string
  success: boolean
  timestamp: string
  responseTime?: number
  error?: string
  statusCode?: number
  endpoint?: string
  method?: string
}

export interface AppLogicRequest {
  id: string
  environmentId: string
  endpoint: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  headers?: Record<string, string>
  body?: any
  timeout?: number
  timestamp: string
  response?: {
    status: number
    data: any
    headers: Record<string, string>
    responseTime: number
  }
  error?: string
}

export interface EnvironmentStats {
  total: number
  connected: number
  disconnected: number
  testing: number
  error: number
  lastUpdated: string
}

export interface AppLogicSettings {
  autoTest: boolean
  testInterval: number
  maxHistoryEntries: number
  defaultTimeout: number
  retryAttempts: number
  notifications: boolean
  autoBackup: boolean
  backupInterval: number
}

export interface BackupData {
  version: string
  timestamp: string
  environments: AppLogicEnvironment[]
  settings: AppLogicSettings
  history: Record<string, ConnectionTest[]>
  requests: AppLogicRequest[]
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}
