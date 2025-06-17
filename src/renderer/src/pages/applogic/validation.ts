import type { AppLogicEnvironment } from 'src/main/types'

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class EnvironmentValidator {
  static validateEnvironment(environment: Partial<AppLogicEnvironment>): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!environment.name?.trim()) {
      errors.push("Environment name is required")
    }

    if (!environment.url?.trim()) {
      errors.push("Environment URL is required")
    } else {
      try {
        const url = new URL(environment.url)
        if (!["http:", "https:"].includes(url.protocol)) {
          errors.push("URL must use HTTP or HTTPS protocol")
        }
      } catch {
        errors.push("Invalid URL format")
      }
    }

    if (!environment.apiKey?.trim()) {
      errors.push("API Key is required")
    }
    

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  static sanitizeEnvironment(environment: Partial<AppLogicEnvironment>): Partial<AppLogicEnvironment> {
    return {
      ...environment,
      name: environment.name?.trim(),
      url: environment.url?.trim().replace(/\/$/, ""),
      description: environment.description?.trim(),
    }
  }
}
