import { net } from 'electron'

/**
 * Check if the system is online by attempting to connect to a reliable endpoint
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise<boolean> - true if online, false if offline
 */
export async function isOnline(timeout: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const request = net.request({
      method: 'HEAD',
      url: 'https://www.google.com',
      protocol: 'https:'
    })

    const timeoutId = setTimeout(() => {
      request.abort()
      resolve(false)
    }, timeout)

    request.on('response', () => {
      clearTimeout(timeoutId)
      resolve(true)
    })

    request.on('error', () => {
      clearTimeout(timeoutId)
      resolve(false)
    })

    request.on('abort', () => {
      clearTimeout(timeoutId)
      resolve(false)
    })

    request.end()
  })
}

/**
 * Check if the system is online with multiple fallback endpoints
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise<boolean> - true if online, false if offline
 */
export async function isOnlineWithFallback(timeout: number = 5000): Promise<boolean> {
  const endpoints = [
    'https://www.google.com',
    'https://www.cloudflare.com',
    'https://httpbin.org/status/200'
  ]

  for (const endpoint of endpoints) {
    try {
      const isConnected = await new Promise<boolean>((resolve) => {
        const request = net.request({
          method: 'HEAD',
          url: endpoint,
          protocol: 'https:'
        })

        const timeoutId = setTimeout(() => {
          request.abort()
          resolve(false)
        }, timeout)

        request.on('response', () => {
          clearTimeout(timeoutId)
          resolve(true)
        })

        request.on('error', () => {
          clearTimeout(timeoutId)
          resolve(false)
        })

        request.on('abort', () => {
          clearTimeout(timeoutId)
          resolve(false)
        })

        request.end()
      })

      if (isConnected) {
        return true
      }
    } catch (error) {
      console.warn(`Failed to check connectivity with ${endpoint}:`, error)
      continue
    }
  }

  return false
}
