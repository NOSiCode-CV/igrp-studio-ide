import { dialog, type IpcMainInvokeEvent, ipcMain } from 'electron'
import fs from 'fs'
import path, { join } from 'path'
import { promisify } from 'util'
import type { FileTree, Handler, IOpenProject, ProjectData } from '../types'

export async function openDirectory(buttonLabel?: string): Promise<IOpenProject> {
    const result = await dialog.showOpenDialog({
        // Match `open-directory-dialog` in main: allows "New Folder" / create directory in the picker (macOS; ignored where unsupported)
        properties: ['openDirectory', 'createDirectory'],
        buttonLabel: buttonLabel ?? 'Select Destination Folder'
    })

    if (result.canceled) {
        return { canceled: true, folderExists: false }
    }

    const basePath = result.filePaths[0]

    const { folderExists, config } = await checkAndReadBaseApi(basePath)

    return { canceled: false, folderExists, config, basePath }
}

export async function checkAndReadBaseApi(
    folderPath: string
): Promise<{ folderExists: boolean; config?: ProjectData }> {
    const readFile = promisify(fs.readFile)

    const specificFolder = '.igrpstudio'
    const fullFolderPath = join(folderPath, specificFolder)

    const folderExists = fs.existsSync(fullFolderPath)

    let config: ProjectData | undefined

    if (folderExists) {
        let baseApiPath = join(fullFolderPath, 'baseApi.json')
        if (!fs.existsSync(baseApiPath)) {
            baseApiPath = join(fullFolderPath, 'baseApp.json')
        }

        try {
            const data = await readFile(baseApiPath, 'utf8')
            const parsedConfig = JSON.parse(data)

            const { id, type, workspaceId } = parsedConfig

            if (baseApiPath.endsWith('baseApi.json')) {
                config = {
                    id,
                    // Persisted baseApi.json uses `name`; keep apiName as a
                    // fallback for older/legacy files.
                    name: parsedConfig.name ?? parsedConfig.apiName,
                    type: 'backend',
                    framework: type,
                    config: { ...parsedConfig },
                    path: folderPath,
                    workspaceId: workspaceId
                }
            } else if (baseApiPath.endsWith('baseApp.json')) {
                config = {
                    id,
                    // Persisted baseApp.json uses `name`; keep appName as a
                    // fallback for older/legacy files.
                    name: parsedConfig.name ?? parsedConfig.appName,
                    type: 'frontend',
                    framework: type,
                    config: { ...parsedConfig },
                    path: folderPath,
                    workspaceId: workspaceId
                }
            }
        } catch (error) {
            console.error(`Error reading ${baseApiPath}:`, error)
        }
    }

    return { folderExists, config }
}

export async function getJsonContent(filePath: string): Promise<any> {
    try {
        const jsonData = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(jsonData)
    } catch (err) {
        console.error('Error reading JSON file:', err)
        return null
    }
}

export async function getFileContent(filePath: string): Promise<any> {
    try {
        // Normalize the file path to handle spaces and special characters
        const normalizedPath = path.resolve(filePath)
        return fs.readFileSync(normalizedPath, 'utf-8')
    } catch (err) {
        console.error('Error reading file:', err)
        return null
    }
}

export const handleWithCustomErrors = (channel: string, handler: Handler) => {
    ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...args: any[]) => {
        try {
            return {
                result: await Promise.resolve(handler(event, ...args))
            }
        } catch (e) {
            // Print full stack to main-process terminal — only the message
            // survives IPC serialization, so without this the renderer never
            // sees a stack and the terminal stays silent on engine throws.
            console.error(`[ipc:${channel}]`, e)
            return { error: e }
        }
    })
}

// Função para ler o diretório .igrpstudio e retornar a árvore de arquivos
export const readIgrpStudioDirectory = (basePath: string): FileTree[] => {
    try {
        // Lê o conteúdo do diretório .igrpstudio
        const files = fs.readdirSync(basePath)

        const IGNORED_PATHS = ['baseApi.json', 'permissions.json', '.DS_store', '.gitkeep']

        // Mapeia os arquivos/pastas
        return files
            .filter((file) => !IGNORED_PATHS.includes(file))
            .map((file) => {
                const filePath = path.join(basePath, file)
                const stats = fs.statSync(filePath) // Obtém as estatísticas do arquivo/pasta

                // Se for um diretório, chama a função recursivamente para ler seus filhos
                if (stats.isDirectory()) {
                    return {
                        name: file,
                        path: filePath,
                        isDirectory: true,
                        children: readIgrpStudioDirectory(filePath) // Leitura recursiva
                    }
                } else {
                    // Se for um arquivo, lê seu conteúdo
                    let content = null
                    try {
                        content = JSON.parse(fs.readFileSync(filePath, 'utf-8')) // Lê o conteúdo como string
                    } catch (error) {
                        console.error('Erro ao ler o diretório .json:', error)
                    }
                    return {
                        name: file,
                        path: filePath,
                        isDirectory: false,
                        content // Inclui o conteúdo do arquivo
                    }
                }
            })
    } catch (error) {
        console.error('Erro ao ler o diretório .igrpstudio:', error)
        return [] // Retorna um array vazio em caso de erro
    }
}

// Lista de pastas/arquivos a serem ignorados
const IGNORED_PATHS = ['.vscode', '.git', 'node_modules', 'logs', '.DS_store']

export const readDirectory = (dirPath: string): FileTree[] => {
    try {
        const files = fs.readdirSync(dirPath)

        return files
            .filter((file) => !IGNORED_PATHS.includes(file)) // Filtra os arquivos/pastas ignorados
            .map((file) => {
                const filePath = path.join(dirPath, file)
                const isDirectory = fs.statSync(filePath).isDirectory()

                return {
                    name: file,
                    path: filePath,
                    isDirectory,
                    children: isDirectory ? readDirectory(filePath) : []
                }
            })
    } catch (error) {
        console.error('Error reading directory:', error)
        return []
    }
}

export async function readProjectFile(filePath: string): Promise<any> {
    try {
        // Normalize the file path to handle spaces and special characters
        const normalizedPath = path.resolve(filePath)
        return fs.readFileSync(normalizedPath, 'utf-8')
    } catch (err) {
        console.error('Error reading file:', err)
        return null
    }
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}
