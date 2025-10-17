import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import type { UpdateInfo } from 'electron-updater';

export interface UpdateMessage {
    type:
        | 'checking'
        | 'available'
        | 'not-available'
        | 'error'
        | 'progress'
        | 'downloaded';
    message: string;
    version?: string;
    currentVersion?: string;
    releaseNotes?: string;
    releaseDate?: string;
    progress?: number;
    error?: string;
}

export default class AppUpdater {
    private win: BrowserWindow;
    private updateAvailable: boolean = false;

    constructor(win: BrowserWindow) {
        log.info('Initializing App Updater...');

        this.win = win;

        this.configurePlatformSpecifics();

        this.initAutoUpdater();
    }

    public isUpdateAvailable(): boolean {
        return this.updateAvailable;
    }

    sendStatusToWindow(data: UpdateMessage): void {
        log.info(data.message);
        this.win.webContents.send('message-update', data);
    }

    configurePlatformSpecifics(): void {
        autoUpdater.setFeedURL({
            provider: 's3',
            bucket: 'igrp-studio',
            endpoint: 'https://storage-api.nosi.cv',
            path: `${process.platform}/${process.arch}`,
            channel: 'latest',
        });
    }

    initAutoUpdater(): void {
        autoUpdater.logger = log;
        // @ts-expect-error - electron-updater logger types don't include transports property
        autoUpdater.logger.transports.file.level = 'info';

        autoUpdater.forceDevUpdateConfig = true;

        autoUpdater.autoDownload = false; // ❌ NÃO baixa automaticamente
        autoUpdater.autoInstallOnAppQuit = false; // ❌ NÃO instala ao sair

        // ✅ Force updates in development mode
        /*  if (!app.isPackaged) {
             this.sendStatusToWindow("⚠️ App is not packaged! Forcing update check in development mode...")
             autoUpdater.checkForUpdatesAndNotify()
             return
         } */

        if (app.isPackaged) autoUpdater.checkForUpdatesAndNotify();

        autoUpdater.on('checking-for-update', () => {
            this.sendStatusToWindow({
                type: 'checking',
                message: '🔍 Checking for updates...',
                currentVersion: app.getVersion(),
            });
        });

        autoUpdater.on('update-available', (info: UpdateInfo) => {
            this.updateAvailable = true;
            const releaseNotes = this.extractReleaseNotes(info);
            const releaseDate = info.releaseDate || '';

            this.sendStatusToWindow({
                type: 'available',
                message: `🚀 New version ${info.version} available!`,
                version: info.version,
                currentVersion: app.getVersion(),
                releaseNotes,
                releaseDate,
            });

            // Auto-download the update
            autoUpdater.downloadUpdate().catch((err) => {
                log.error('Auto-download failed:', err);
            });
        });

        autoUpdater.on('update-not-available', (info: UpdateInfo) => {
            this.updateAvailable = false;
            this.sendStatusToWindow({
                type: 'not-available',
                message: '✅ You are running the latest version.',
                currentVersion: app.getVersion(),
                version: info.version,
            });
        });

        autoUpdater.on('error', (error) => {
            console.error('Update error:', error);
            this.sendStatusToWindow({
                type: 'error',
                message: '❌ Update error occurred',
                error: error.message || String(error),
                currentVersion: app.getVersion(),
            });
        });

        autoUpdater.on('download-progress', (progressObj) => {
            const progressPercent = Math.round(progressObj.percent);
            this.sendStatusToWindow({
                type: 'progress',
                message: `📥 Downloading update: ${progressPercent}%`,
                progress: progressPercent,
                currentVersion: app.getVersion(),
            });
        });

        autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
            const releaseNotes = this.extractReleaseNotes(info);

            this.sendStatusToWindow({
                type: 'downloaded',
                message: '✅ Update downloaded. Ready to install.',
                version: info.version,
                currentVersion: app.getVersion(),
                releaseNotes,
                releaseDate: info.releaseDate || '',
            });
        });
    }

    /**
     * Extract and format release notes from UpdateInfo
     */
    private extractReleaseNotes(info: UpdateInfo): string {
        try {
            if (!info.releaseNotes) return '';

            // If releaseNotes is a string, return it
            if (typeof info.releaseNotes === 'string') {
                return info.releaseNotes;
            }

            // If releaseNotes is an array (multiple locales)
            if (Array.isArray(info.releaseNotes)) {
                // Return the first available note (ReleaseNoteInfo has note property)
                const firstNote = info.releaseNotes[0]?.note;
                return firstNote || '';
            }

            return '';
        } catch (error) {
            log.error('Error extracting release notes:', error);
            return '';
        }
    }
}
