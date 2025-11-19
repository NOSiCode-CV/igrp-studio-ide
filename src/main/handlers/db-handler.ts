import { ipcMain } from 'electron'
import { Connection, DatabaseResponse } from '../types'
import {
  closeKnexConnection,
  createKnexConnection,
  getTables,
  getTableStructure
} from '../helpers/Knex'
import { ConnectionRepository } from '../services/database-service'
import { EVENTS } from '../constants/events'

const repoConnection = new ConnectionRepository()

let globalKnex

ipcMain.handle(EVENTS.CONNECTION.GET_CONNECTIONS, async (_event): Promise<Array<Connection>> => {
  return await repoConnection.findAll()
})

ipcMain.handle(EVENTS.CONNECTION.SAVE_CONNECTION, async (_event, connection: Connection) => {
  await repoConnection.save(connection)
})

ipcMain.handle(EVENTS.CONNECTION.DELETE_CONNECTION, async (_event, connectionName: string) => {
  await repoConnection.delete(connectionName)
})

// IPC Handlers Database
ipcMain.handle(
  EVENTS.CONNECTION.CONNECT_DATABASE,
  async (_event, config): Promise<DatabaseResponse> => {
    try {
      globalKnex = await createKnexConnection(config)
      await getTables(globalKnex)
      return { success: true, message: 'Connected successfully' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred'
      return { success: false, message }
    }
  }
)

ipcMain.handle(
  EVENTS.CONNECTION.GET_TABLES,
  async (_event, connectionName): Promise<DatabaseResponse> => {
    try {
      const connectionConfig = await repoConnection.findOne(connectionName)
      if (!connectionConfig) {
        return { success: false, message: 'Connection not found' }
      }
      console.log('connectionConfig', connectionConfig)
      const knex = globalKnex || (await createKnexConnection(connectionConfig))
      const tables = await getTables(knex)
      await closeKnexConnection(knex)
      return { success: true, tables }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred'
      return { success: false, message }
    }
  }
)

ipcMain.handle(EVENTS.CONNECTION.GET_TABLE_STRUCTURE, async (_event, connectionName, tableName) => {
  try {
    const connectionConfig = await repoConnection.findOne(connectionName)
    if (!connectionConfig) {
      return { success: false, message: 'Connection not found' }
    }
    const knex = globalKnex || (await createKnexConnection(connectionConfig))
    const structure = await getTableStructure(knex, tableName)
    await closeKnexConnection(knex)
    return { success: true, structure }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred'
    return { success: false, message }
  }
})
