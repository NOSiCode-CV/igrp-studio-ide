import { app } from 'electron'
import fs from 'fs'
import { readFile, writeFile } from 'fs/promises';
import { IConnenctionRepository } from '../interfaces';
import { Connection } from '../types';

const filename = app.getPath('userData') + "/rp-connections.json";

async function loadCfg() {
    if (!fs.existsSync(filename)) {
        return { projects: [] };
    }
    return JSON.parse(await readFile(filename, "utf8"));
}

async function saveCfg(cfg: any) {
    await writeFile(filename, JSON.stringify(cfg));
}

export class ConnectionRepository implements IConnenctionRepository {

    async save(connection: Connection): Promise<Connection> {

        const cfg: { connections: Array<Connection> } = await loadCfg();

        if (!cfg.connections) {
            cfg.connections = [];
        }
        const index = cfg.connections.findIndex(el => el.name === connection.name);
        if (index == -1) {
            cfg.connections.push(connection);
        } else {
            cfg.connections[index] = { ...cfg.connections[index], ...connection }
        }

        saveCfg(cfg);
        return connection;
    }

    async findAll(): Promise<Array<Connection>> {
        const cfg = await loadCfg();
        return cfg.connections;
    }

    async findOne(name: string): Promise<Connection> {
        const cfg = await loadCfg(); // Load configuration
        return cfg.connections.find((p) => p.name === name);
    }

    async delete(connectionName): Promise<void> {
        const cfg = await loadCfg();

        // Verifica se o array de projetos existe
        if (!cfg.connections || cfg.connections.length === 0) {
            throw new Error("No Connection available to delete.");
        }

        // Remoção pelo caminho do projeto
        const cIndex = cfg.connections.findIndex((p) => p.name === connectionName);
        if (cIndex === -1) {
            throw new Error("Connection not found.");
        }
        cfg.connections.splice(cIndex, 1); // Remove o projeto pelo caminho

        await saveCfg(cfg); // Salva a configuração atualizada
    }
}
