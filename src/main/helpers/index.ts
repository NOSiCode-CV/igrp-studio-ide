import { dialog, ipcMain, IpcMainInvokeEvent } from 'electron';
import path, { join } from 'path';
import { IOpenProject, Handler, ProjectData, FileTree } from '../types';
import { promisify } from 'util';
const fs = require("fs");

export async function openDirectory(buttonLabel?: string): Promise<IOpenProject> {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        buttonLabel: buttonLabel ?? 'Select Destination Folder',
    });

    if (result.canceled) {
        return { canceled: true, folderExists: false };
    }

    const basePath = result.filePaths[0];

    const { folderExists, config } = await checkAndReadBaseApi(basePath);

    return { canceled: false, folderExists, config, basePath };
}

export async function checkAndReadBaseApi(folderPath: string): Promise<{ folderExists: boolean; config?: ProjectData }> {

    const readFile = promisify(fs.readFile);

    const specificFolder = '.igrpstudio';
    const fullFolderPath = join(folderPath, specificFolder);

    const folderExists = fs.existsSync(fullFolderPath);

    let config: ProjectData | undefined = undefined;

    if (folderExists) {

        let baseApiPath = join(fullFolderPath, 'baseApi.json');
        if (!fs.existsSync(baseApiPath)) {
            baseApiPath = join(fullFolderPath, 'baseApp.json');
        }

        try {
            const data = await readFile(baseApiPath, 'utf8');
            const parsedConfig = JSON.parse(data);

            const { id, type } = parsedConfig

            if (baseApiPath.endsWith('baseApi.json')) {
                config = {
                    id,
                    name: parsedConfig.apiName,
                    type: 'backend',
                    framework: type,
                    config: { ...parsedConfig },
                    path: folderPath
                }
            } else if (baseApiPath.endsWith('baseApp.json')) {
                config = {
                    id,
                    name: parsedConfig.appName,
                    type: 'frontend',
                    framework: type,
                    config: { ...parsedConfig },
                    path: folderPath
                }
            }

        } catch (error) {
            console.error(`Error reading ${baseApiPath}:`, error);
        }
    }

    return { folderExists, config };
}

export async function getJsonContent(filePath: string): Promise<any> {
    try {
        const jsonData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(jsonData);
    } catch (err) {
        console.error('Error reading JSON file:', err);
        return null;
    }
}

export function addNumbers(a: number, b: number) {
    return a + b;
}

export const handleWithCustomErrors = (channel: string, handler: Handler) => {
    ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...args: any[]) => {
        try {
            return { result: await Promise.resolve(handler(event, ...args)) }
        } catch (e) {
            return { error: e }
        }
    })
}

// Função para ler o diretório .igrpstudio e retornar a árvore de arquivos
export const readIgrpStudioDirectory = (basePath: string): FileTree[] => {

    try {

        // Lê o conteúdo do diretório .igrpstudio
        const files = fs.readdirSync(basePath);

        const IGNORED_PATHS = ['baseApi.json', 'permissions.json', '.DS_store'];

        // Mapeia os arquivos/pastas
        return files
            .filter((file) => !IGNORED_PATHS.includes(file)).map((file) => {
                const filePath = path.join(basePath, file);
                const stats = fs.statSync(filePath); // Obtém as estatísticas do arquivo/pasta

                // Se for um diretório, chama a função recursivamente para ler seus filhos
                if (stats.isDirectory()) {
                    return {
                        name: file,
                        path: filePath,
                        isDirectory: true,
                        children: readIgrpStudioDirectory(filePath), // Leitura recursiva
                    };
                } else {
                    // Se for um arquivo, lê seu conteúdo
                    let content = null;
                    try {
                        content = JSON.parse(fs.readFileSync(filePath, 'utf-8')); // Lê o conteúdo como string
                    }
                    catch (error) {
                        console.error('Erro ao ler o diretório .json:', error);
                    }
                    return {
                        name: file,
                        path: filePath,
                        isDirectory: false,
                        content, // Inclui o conteúdo do arquivo
                    };
                }
            });
    } catch (error) {
        console.error('Erro ao ler o diretório .igrpstudio:', error);
        return []; // Retorna um array vazio em caso de erro
    }
};

// Lista de pastas/arquivos a serem ignorados
const IGNORED_PATHS = ['.vscode', '.git', 'node_modules', 'logs', '.DS_store'];

export const readDirectory = (dirPath: string): FileTree[] => {
    try {
        const files = fs.readdirSync(dirPath);

        return files
            .filter((file) => !IGNORED_PATHS.includes(file)) // Filtra os arquivos/pastas ignorados
            .map((file) => {
                const filePath = path.join(dirPath, file);
                const isDirectory = fs.statSync(filePath).isDirectory();

                return {
                    name: file,
                    path: filePath,
                    isDirectory,
                    children: isDirectory ? readDirectory(filePath) : [],
                };
            });
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
    }
}

export async function readProjectFile(filePath: string): Promise<any> {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        console.error('Error reading file:', err);
        return null;
    }
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}