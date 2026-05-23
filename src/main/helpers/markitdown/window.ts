import { is } from '@electron-toolkit/utils'
import { BrowserWindow } from 'electron'
import path, { join } from 'path'
import icon from '../../../../resources/icon.png?asset'

export class MarkItDownWindowManager {
    private window: BrowserWindow | null = null

    open(): void {
        if (this.window && !this.window.isDestroyed()) {
            if (this.window.isMinimized()) this.window.restore()
            this.window.focus()
            return
        }

        this.window = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 820,
            minHeight: 520,
            show: false,
            autoHideMenuBar: true,
            title: 'Markdown Converter',
            ...(process.platform === 'linux' ? { icon } : {}),
            webPreferences: {
                preload: join(__dirname, '../preload/index.js'),
                sandbox: false,
                contextIsolation: true,
                nodeIntegration: false
            },
            icon: path.join(__dirname, 'resources/icons', 'icon.icns')
        })

        const baseUrl =
            is.dev && process.env['ELECTRON_RENDERER_URL']
                ? process.env['ELECTRON_RENDERER_URL']
                : `file://${join(__dirname, '../renderer/index.html')}`

        this.window.loadURL(`${baseUrl}#/markitdown`)

        this.window.on('ready-to-show', () => {
            this.window?.show()
        })

        this.window.on('closed', () => {
            this.window = null
        })
    }

    close(): void {
        if (this.window && !this.window.isDestroyed()) {
            this.window.close()
        }
        this.window = null
    }
}
