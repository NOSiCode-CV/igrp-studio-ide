import { useEffect, useRef, useCallback } from 'react'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage?: number
  timestamp: number
}

interface PerformanceConfig {
  componentName: string
  threshold?: number // Warning threshold in milliseconds
  trackMemory?: boolean
  onSlowRender?: (metrics: PerformanceMetrics) => void
}

interface UsePerformanceMonitorReturn {
  startTimer: () => void
  endTimer: () => void
  getMetrics: () => PerformanceMetrics | null
  resetMetrics: () => void
}

export const usePerformanceMonitor = (config: PerformanceConfig): UsePerformanceMonitorReturn => {
  const startTimeRef = useRef<number | null>(null)
  const metricsRef = useRef<PerformanceMetrics | null>(null)

  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now()
  }, [])

  const endTimer = useCallback(() => {
    if (startTimeRef.current === null) return

    const endTime = performance.now()
    const renderTime = endTime - startTimeRef.current

    const metrics: PerformanceMetrics = {
      renderTime,
      timestamp: Date.now()
    }

    // Track memory usage if enabled
    if (config.trackMemory && 'memory' in performance) {
      const memory = (performance as any).memory
      if (memory) {
        metrics.memoryUsage = memory.usedJSHeapSize
      }
    }

    metricsRef.current = metrics

    // Log performance data
    console.log(`[Performance] ${config.componentName}:`, {
      renderTime: `${renderTime.toFixed(2)}ms`,
      memoryUsage: metrics.memoryUsage
        ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
        : 'N/A'
    })

    // Send to analytics if available
    if ((window as any).analytics) {
      ;(window as any).analytics.track('component_performance', {
        component: config.componentName,
        renderTime,
        memoryUsage: metrics.memoryUsage,
        timestamp: metrics.timestamp
      })
    }

    // Check if render time exceeds threshold
    if (config.threshold && renderTime > config.threshold) {
      console.warn(
        `[Performance Warning] ${config.componentName} took ${renderTime.toFixed(2)}ms to render (threshold: ${config.threshold}ms)`
      )

      if (config.onSlowRender) {
        config.onSlowRender(metrics)
      }
    }

    startTimeRef.current = null
  }, [config])

  const getMetrics = useCallback(() => {
    return metricsRef.current
  }, [])

  const resetMetrics = useCallback(() => {
    metricsRef.current = null
    startTimeRef.current = null
  }, [])

  // Auto-start timer on mount
  useEffect(() => {
    startTimer()

    // Auto-end timer on unmount
    return () => {
      endTimer()
    }
  }, [startTimer, endTimer])

  return {
    startTimer,
    endTimer,
    getMetrics,
    resetMetrics
  }
}
