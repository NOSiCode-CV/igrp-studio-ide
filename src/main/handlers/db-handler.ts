import { ipcMain } from "electron";
import { Connection, DatabaseResponse } from "../types";
import { closeKnexConnection, createKnexConnection, getTables, getTableStructure } from "../helpers/Knex";
import { ConnectionRepository } from "../services/database-service";

const repoConnection = new ConnectionRepository()

let globalKnex

ipcMain.handle('igrp-studio:repo:connection.findAll', async (_event): Promise<Array<Connection>> => {
    return await repoConnection.findAll()
})

ipcMain.handle('igrp-studio:repo:connection.save', async (_event, connection: Connection) => {
    await repoConnection.save(connection)
})

ipcMain.handle('igrp-studio:repo:connection.delete', async (_event, connectionName: string) => {
    await repoConnection.delete(connectionName)
})

// IPC Handlers Database
ipcMain.handle('connect-database', async (_event, config): Promise<DatabaseResponse> => {
    try {
        globalKnex = await createKnexConnection(config);
        await getTables(globalKnex);
        return { success: true, message: 'Connected successfully' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message };
    }
});

ipcMain.handle('get-tables', async (_event, connectionName): Promise<DatabaseResponse> => {
    try {
        const connectionConfig: Connection = await repoConnection.findOne(connectionName)
        const knex = globalKnex || await createKnexConnection(connectionConfig)
        const tables = await getTables(knex);
        await closeKnexConnection(knex)
        return { success: true, tables };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message };
    }
});

ipcMain.handle('get-table-structure', async (_event, connectionName, tableName) => {
    try {
        const connectionConfig: Connection = await repoConnection.findOne(connectionName)
        const knex = globalKnex || await createKnexConnection(connectionConfig)
        const structure = await getTableStructure(knex, tableName);
        await closeKnexConnection(knex)
        return { success: true, structure };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message };
    }
});
