import { Connection } from '../types';
import { IGRPStudioSettings } from '../helpers/igrp-studio-settings';

export class ConnectionRepository {
    async save(connection: Connection): Promise<Connection> {
        return IGRPStudioSettings.saveConnection(connection);
    }

    async findAll(): Promise<Array<Connection>> {
        return IGRPStudioSettings.getAllConnections();
    }

    async findOne(name: string): Promise<Connection | undefined> {
        return IGRPStudioSettings.getConnection(name);
    }

    async delete(connectionName: string): Promise<void> {
        return IGRPStudioSettings.deleteConnection(connectionName);
    }
}
