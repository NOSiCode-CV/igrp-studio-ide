import { app, BrowserWindow } from "electron"
import { autoUpdater } from "electron-updater"
import log from "electron-log"

export default class AppUpdater {

    private win: BrowserWindow;

    constructor(win: BrowserWindow) {
        log.info("Initializing App Updater...")

        this.win = win;

        this.configurePlatformSpecifics()

        this.initAutoUpdater()
    }

    sendStatusToWindow(text: string) {
        log.info(text)
        this.win.webContents.send('message-update', text);
    }

    configurePlatformSpecifics() {
        autoUpdater.setFeedURL({
            provider: "s3",
            bucket: "igrp-studio",
            endpoint: import.meta.env.VITE_ENDPOINT_UPDATE_IGRP_STUDIO,
            path: `${process.platform}/${process.arch}`,
            channel: "latest"
        });
    }

    initAutoUpdater() {
        autoUpdater.logger = log
        //@ts-ignore
        autoUpdater.logger.transports.file.level = "info"

        autoUpdater.forceDevUpdateConfig = true;

        autoUpdater.autoDownload = false; // ❌ NÃO baixa automaticamente
        autoUpdater.autoInstallOnAppQuit = false; // ❌ NÃO instala ao sair

        // ✅ Force updates in development mode
        if (!app.isPackaged) {
            this.sendStatusToWindow("⚠️ App is not packaged! Forcing update check in development mode...")
            autoUpdater.checkForUpdatesAndNotify()
            return
        }

        autoUpdater.checkForUpdatesAndNotify()

        autoUpdater.on("checking-for-update", () => {
            this.sendStatusToWindow("🔍 Checking for updates...")
        })

        autoUpdater.on("update-available", () => {
            this.sendStatusToWindow("🚀 Update available! Downloading...")
        })

        autoUpdater.on("update-not-available", () => {
            this.sendStatusToWindow("✅ No updates found.")
        })

        autoUpdater.on("error", (error) => {
            this.sendStatusToWindow(`❌ Update error: ${error}`)
        })

        autoUpdater.on("download-progress", (progressObj) => {
            this.sendStatusToWindow(`📥 Download progress: ${Math.round(progressObj.percent)}%`)
        })

        autoUpdater.on('update-downloaded', () => {
            this.sendStatusToWindow('Update downloaded. Ready to install.');
        });

    }
}
