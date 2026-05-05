import { app, type BrowserWindow } from 'electron'
import log from 'electron-log'
import type { UpdateInfo } from 'electron-updater'
import { autoUpdater } from 'electron-updater'
import { GitStore } from '../services/git-store'
import { IGRPStudioSettings } from './igrp-studio-settings'

/** GitHub repo for fetching release notes (e.g. https://github.com/NOSiCode-CV/igrp-studio-ide/releases). */
const GITHUB_RELEASE_NOTES_REPO = 'NOSiCode-CV/igrp-studio-ide'
const GITHUB_API_RELEASES = `https://api.github.com/repos/${GITHUB_RELEASE_NOTES_REPO}/releases`

/** Resolve token for GitHub API: env (GITHUB_TOKEN / VITE_GITHUB_TOKEN) or user's OAuth token from GitStore. */
function getGitHubApiToken(): string {
    return (
        process.env.GITHUB_TOKEN ||
        process.env.VITE_GITHUB_TOKEN ||
        GitStore.getToken('github') ||
        ''
    )
}

/**
 * Applies update channel (stable/beta) from IGRPStudioSettings to autoUpdater.
 * Call this on startup (from AppUpdater) and when user changes channel in Settings.
 */
export function applyUpdateChannelConfig(): void {
    const channel = IGRPStudioSettings.getUpdateChannel()
    const feedChannel = channel === 'beta' ? 'beta' : 'latest'
    autoUpdater.setFeedURL({
        provider: 's3',
        bucket: 'igrp-studio',
        endpoint: 'https://storage-api.nosi.cv',
        path: `${process.platform}/${process.arch}`,
        channel: feedChannel
    })
    autoUpdater.allowPrerelease = channel === 'beta'
    log.info('Update channel configured', {
        channel: feedChannel,
        allowPrerelease: channel === 'beta'
    })
}

export interface UpdateMessage {
    type: 'checking' | 'available' | 'not-available' | 'error' | 'progress' | 'downloaded'
    message: string
    version?: string
    currentVersion?: string
    releaseNotes?: string
    releaseDate?: string
    progress?: number
    error?: string
}

export default class AppUpdater {
    private win: BrowserWindow
    private updateAvailable: boolean = false

    constructor(win: BrowserWindow) {
        log.info('Initializing App Updater...')

        this.win = win

        this.configurePlatformSpecifics()

        this.initAutoUpdater()
    }

    public isUpdateAvailable(): boolean {
        return this.updateAvailable
    }

    sendStatusToWindow(data: UpdateMessage): void {
        log.info(data.message)
        this.win.webContents.send('message-update', data)
    }

    configurePlatformSpecifics(): void {
        applyUpdateChannelConfig()
    }

    initAutoUpdater(): void {
        autoUpdater.logger = log
        // @ts-expect-error - electron-updater logger types don't include transports property
        autoUpdater.logger.transports.file.level = 'info'

        autoUpdater.forceDevUpdateConfig = true

        autoUpdater.autoDownload = false // ❌ NÃO baixa automaticamente
        autoUpdater.autoInstallOnAppQuit = false // ❌ NÃO instala ao sair

        // ✅ Force updates in development mode
        /*  if (!app.isPackaged) {
             this.sendStatusToWindow("⚠️ App is not packaged! Forcing update check in development mode...")
             autoUpdater.checkForUpdatesAndNotify()
             return
         } */

        if (app.isPackaged) autoUpdater.checkForUpdatesAndNotify()

        autoUpdater.on('checking-for-update', () => {
            this.sendStatusToWindow({
                type: 'checking',
                message: 'Checking for updates...',
                currentVersion: app.getVersion()
            })
        })

        autoUpdater.on('update-available', async (info: UpdateInfo) => {
            this.updateAvailable = true
            let releaseNotes = this.extractReleaseNotes(info)
            if (!releaseNotes?.trim() && info.version) {
                releaseNotes = await this.fetchReleaseNotesForVersion(info.version)
            }
            const releaseDate = info.releaseDate || ''

            this.sendStatusToWindow({
                type: 'available',
                message: `New version ${info.version} available!`,
                version: info.version,
                currentVersion: app.getVersion(),
                releaseNotes: releaseNotes || '',
                releaseDate
            })
        })

        autoUpdater.on('update-not-available', (info: UpdateInfo) => {
            this.updateAvailable = false
            this.sendStatusToWindow({
                type: 'not-available',
                message: 'You are running the latest version.',
                currentVersion: app.getVersion(),
                version: info.version
            })
        })

        autoUpdater.on('error', (error) => {
            console.error('Update error:', error)
            this.sendStatusToWindow({
                type: 'error',
                message: 'Update error occurred',
                error: error.message || String(error),
                currentVersion: app.getVersion()
            })
        })

        autoUpdater.on('download-progress', (progressObj) => {
            const progressPercent = Math.round(progressObj.percent)
            this.sendStatusToWindow({
                type: 'progress',
                message: `Downloading update: ${progressPercent}%`,
                progress: progressPercent,
                currentVersion: app.getVersion()
            })
        })

        autoUpdater.on('update-downloaded', async (info: UpdateInfo) => {
            let releaseNotes = this.extractReleaseNotes(info)
            if (!releaseNotes?.trim() && info.version) {
                releaseNotes = await this.fetchReleaseNotesForVersion(info.version)
            }

            this.sendStatusToWindow({
                type: 'downloaded',
                message: 'Update downloaded. Ready to install.',
                version: info.version,
                currentVersion: app.getVersion(),
                releaseNotes: releaseNotes || '',
                releaseDate: info.releaseDate || ''
            })
        })
    }

    /**
     * Fetch release notes from GitHub Releases API when the update feed does not include them.
     * Uses tag v{version}. See https://docs.github.com/en/rest/releases/releases#get-a-release-by-tag-name
     */
    private async fetchReleaseNotesForVersion(version: string): Promise<string> {
        const sanitized = version.replace(/[^a-zA-Z0-9.-]/g, '')
        if (!sanitized) return ''
        const tag = sanitized.startsWith('v') ? sanitized : `v${sanitized}`
        try {
            const token = getGitHubApiToken()
            const headers: Record<string, string> = {
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'IGRP-Studio-Updater'
            }
            if (token) headers.Authorization = `Bearer ${token}`
            const res = await fetch(`${GITHUB_API_RELEASES}/tags/${encodeURIComponent(tag)}`, {
                method: 'GET',
                headers
            })
            if (res.ok) {
                const data = (await res.json()) as { body?: string | null }
                const body = data?.body?.trim()
                if (body) {
                    log.info('Release notes fetched from GitHub', { version, tag })
                    return body
                }
            }
        } catch (err) {
            log.debug('GitHub release notes fetch failed', { tag, err: (err as Error).message })
        }
        return ''
    }

    /**
     * Extract and format release notes from UpdateInfo
     */
    private extractReleaseNotes(info: UpdateInfo): string {
        try {
            if (!info.releaseNotes) return ''

            // If releaseNotes is a string, return it
            if (typeof info.releaseNotes === 'string') {
                return info.releaseNotes
            }

            // If releaseNotes is an array (multiple locales)
            if (Array.isArray(info.releaseNotes)) {
                // Return the first available note (ReleaseNoteInfo has note property)
                const firstNote = info.releaseNotes[0]?.note
                return firstNote || ''
            }

            return ''
        } catch (error) {
            log.error('Error extracting release notes:', error)
            return ''
        }
    }
}
