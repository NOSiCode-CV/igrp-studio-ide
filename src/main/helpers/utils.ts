import { is } from '@electron-toolkit/utils'
import { type BrowserWindow, dialog } from 'electron'
import { app } from 'electron/main'
import installExtension, {
    REACT_DEVELOPER_TOOLS,
    REDUX_DEVTOOLS
} from 'electron-devtools-installer'
import fs from 'fs'
import path from 'path'

let allow_quit = false
export function closeApp(mainWindow: BrowserWindow) {
    mainWindow.on('close', async (e) => {
        if (!allow_quit) {
            e.preventDefault()
            const choice = await dialog.showMessageBox(mainWindow, {
                type: 'question',
                buttons: ['Yes', 'No'],
                title: 'Confirm',
                message: 'Are you sure you want to quit?'
            })
            if (choice.response == 0) {
                allow_quit = true
                app.quit()
            }
        }
    })
}

export function installExtensions(mainWindow: BrowserWindow): void {
    if (is.dev && process.platform === 'darwin') {
        // Open the DevTools.
        mainWindow.webContents.openDevTools()
        // Install extensions
        installExtension(REACT_DEVELOPER_TOOLS)
            // eslint-disable-next-line no-console
            .then((name) => console.log(`Added Extension:  ${name}`))
            // eslint-disable-next-line no-console
            .catch((err) => console.log('An error occurred: ', err))
        installExtension(REDUX_DEVTOOLS)
            // eslint-disable-next-line no-console
            .then((name) => console.log(`Added Extension:  ${name}`))
            // eslint-disable-next-line no-console
            .catch((err) => console.log('An error occurred: ', err))
    }
}

export function escapePath(pathString: string): string {
    // Escape spaces and special characters in paths
    return `"${pathString.replace(/"/g, '\\"')}"`
}

/**
 * Downloads a file from a URL to a specified destination
 * @param url - The URL to download from
 * @param destinationPath - The local path where the file should be saved
 * @param onProgress - Optional callback for download progress
 * @returns Promise<boolean> - True if download was successful
 */
export async function downloadFile(
    url: string,
    destinationPath: string,
    onProgress?: (progress: number) => void
): Promise<boolean> {
    try {
        console.log(`Starting download from: ${url}`)
        console.log(`Destination: ${destinationPath}`)

        // Ensure the destination directory exists
        const dir = path.dirname(destinationPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30_000) // 30 seconds

        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const contentLength = response.headers.get('content-length')
        const totalSize = contentLength ? parseInt(contentLength, 10) : 0
        let downloadedSize = 0

        const reader = response.body?.getReader()
        if (!reader) {
            throw new Error('No response body')
        }

        const writer = fs.createWriteStream(destinationPath)

        return new Promise((resolve, reject) => {
            const pump = async (): Promise<void> => {
                try {
                    const { done, value } = await reader.read()
                    if (done) {
                        writer.end()
                        return
                    }
                    downloadedSize += value.length
                    if (onProgress && totalSize > 0) {
                        onProgress((downloadedSize / totalSize) * 100)
                    }
                    writer.write(Buffer.from(value))
                    return pump()
                } catch (err) {
                    writer.destroy()
                    reject(err)
                }
            }

            writer.on('finish', () => {
                console.log(`Download completed: ${destinationPath}`)
                resolve(true)
            })

            writer.on('error', (error) => {
                reader.cancel().catch(() => {})
                reject(error)
            })

            pump().catch(reject)
        })
    } catch (error) {
        console.error('Download failed:', error)
        return false
    }
}
