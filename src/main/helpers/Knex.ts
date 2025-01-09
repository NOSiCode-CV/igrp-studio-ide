const knex = require('knex');
import { Connection } from '../types';
import { SchemaInspector } from 'knex-schema-inspector';

// Knex connection function
function createKnexConnection(config: Connection) {
    return knex({
        client: config.databaseType,
        connection: {
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
        },
    });
}

async function getTables(knex: any) {
    const inspector = SchemaInspector(knex);
    return await inspector.tables();
}

async function getTableStructure(knex: any, tableName: string) {
    const inspector = SchemaInspector(knex);
    return await inspector.columnInfo(tableName);
}

export { createKnexConnection, getTables, getTableStructure }