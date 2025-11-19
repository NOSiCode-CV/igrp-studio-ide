import { ipcMain } from 'electron'

type HandlerResponse<T = any> = {
  result?: T
  error?: string
}

async function genericFetchHandler<T>(
  endpoint: string,
  headers?: object
): Promise<HandlerResponse<T>> {
  try {
    const response = await fetch(endpoint, headers)

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} - ${response.statusText}`)
    }

    const data: T = await response.json()
    return { result: data }
  } catch (error) {
    console.error('Erro ao buscar dados:', error)

    return {
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Implementação para get-versions (agora mais simples)
ipcMain.handle(
  'get-versions',
  async (
    _event,
    endpoint: string
  ): Promise<
    HandlerResponse<{
      items: Array<{ version: string; maven2?: { version: string } }>
    }>
  > => {
    return genericFetchHandler(endpoint)
  }
)

// Exemplo de uso para outro endpoint (agora mais direto)
ipcMain.handle(
  'fetch-data',
  async (_event, endpoint: string, headers: object): Promise<HandlerResponse> => {
    return genericFetchHandler(endpoint, headers)
  }
)
