import { type BrowserWindow, app as electronApp, shell } from 'electron'
import express from 'express'
import { oauthErrorPage, oauthSuccessPage } from './oauth-callback-page'

interface GitProviderConfig {
    clientId: string
    clientSecret: string
    scopes: string[]
    authUrl: string
    tokenUrl: string
    provider: 'github' | 'gitlab'
    /** Web host (e.g. https://github.example.com) — needed by GitHub Enterprise. */
    baseUrl?: string
    /** Persisted config id (e.g. gitlab-nosi). Sent back on OAuth success. */
    configId?: string
}

interface GitService {
    initialize: (token: string, baseUrl?: string) => void
}

/**
 * Dev OAuth callback port. Must match a Callback URL registered on the
 * GitHub/GitLab OAuth app. Do not reuse VITE_DEV_PORT (renderer) — that
 * produced http://localhost:3000/oauth/callback which git.nosi.cv rejects.
 */
function getOAuthDevPort(): number {
    const raw = process.env.VITE_GIT_OAUTH_DEV_PORT
    const port = Number(raw)
    return Number.isFinite(port) && port > 0 ? port : 4000
}

function getRedirectUri(isDev: boolean): string {
    if (isDev) {
        return `http://localhost:${getOAuthDevPort()}/oauth/callback`
    }
    return process.env.VITE_GIT_REDIRECT_URI || 'igrp-studio://oauth/callback'
}

export class GitAuth {
    private config: GitProviderConfig
    private tokenService: any
    private gitService: GitService

    constructor(config: GitProviderConfig, tokenService: any, gitService: GitService) {
        this.config = config
        this.tokenService = tokenService
        this.gitService = gitService
    }

    getAuthUrl(isDev: boolean): string {
        const scopes = this.config.scopes.join(' ')
        const redirectUri = encodeURIComponent(getRedirectUri(isDev))

        return (
            `${this.config.authUrl}?client_id=${this.config.clientId}&redirect_uri=${redirectUri}` +
            `${this.config.provider === 'gitlab' ? '&response_type=code' : ''}&scope=${scopes}`
        )
    }

    async setupOAuth(mainWindow: BrowserWindow, isDev: boolean) {
        if (isDev) {
            return this.setupDevOAuth(mainWindow)
        } else {
            return this.setupProdOAuth(mainWindow)
        }
    }

    private async setupDevOAuth(mainWindow: BrowserWindow) {
        return new Promise((resolve, reject) => {
            const app = express()
            const port = getOAuthDevPort()
            const server = app.listen(port, () => {
                const authUrl = this.getAuthUrl(true)
                shell.openExternal(authUrl)
            })

            server.on('error', (error: NodeJS.ErrnoException) => {
                if (error.code === 'EADDRINUSE') {
                    reject(
                        new Error(
                            `OAuth callback port ${port} is already in use. Close the other process or set VITE_GIT_OAUTH_DEV_PORT.`
                        )
                    )
                    return
                }
                reject(error)
            })

            app.get('/oauth/callback', async (req, res) => {
                const code = typeof req.query.code === 'string' ? req.query.code : ''
                const oauthError =
                    typeof req.query.error_description === 'string'
                        ? req.query.error_description
                        : typeof req.query.error === 'string'
                          ? req.query.error
                          : ''

                if (!code) {
                    this.handleAuthError(
                        new Error(oauthError || 'No authorization code found in callback URL'),
                        mainWindow,
                        res,
                        reject
                    )
                    server.close()
                    return
                }

                try {
                    const token = await this.exchangeCodeForToken(code, true)
                    this.handleAuthSuccess(token, mainWindow)
                    res.type('html').send(oauthSuccessPage(this.config.provider))
                    server.close()
                    resolve(token)
                } catch (error) {
                    this.handleAuthError(error, mainWindow, res, reject)
                    server.close()
                }
            })
        })
    }

    private async setupProdOAuth(mainWindow: BrowserWindow) {
        return new Promise((resolve, reject) => {
            const handleUrl = async (url: string) => {
                try {
                    const urlObj = new URL(url)
                    const code = urlObj.searchParams.get('code')

                    if (code) {
                        const token = await this.exchangeCodeForToken(code, false)
                        this.handleAuthSuccess(token, mainWindow)
                        resolve(token)
                        electronApp.removeListener('open-url', urlHandler)
                    }
                } catch (error) {
                    reject(error)
                    electronApp.removeListener('open-url', urlHandler)
                }
            }

            const urlHandler = (event: Electron.Event, url: string) => {
                event.preventDefault()
                handleUrl(url)
            }

            electronApp.on('open-url', urlHandler)

            const authUrl = this.getAuthUrl(false)
            shell.openExternal(authUrl)
        })
    }

    private async exchangeCodeForToken(code: string, isDev: boolean) {
        const redirectUri = getRedirectUri(isDev)

        const body: any = {
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            code,
            redirect_uri: redirectUri
        }

        // Adiciona grant_type apenas para GitLab
        if (this.config.provider === 'gitlab') {
            body.grant_type = 'authorization_code'
        }

        const response = await fetch(this.config.tokenUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })

        const data = await response.json()
        if (data.error) throw new Error(data.error_description || data.error)
        return data
    }

    private handleAuthSuccess(data: any, mainWindow: BrowserWindow) {
        if (data.access_token) {
            this.tokenService.setToken(this.config.provider, data.access_token)
            this.gitService.initialize(data.access_token, this.config.baseUrl)

            mainWindow.webContents.send(`${this.config.provider}-oauth-success`, {
                access_token: data.access_token,
                scope: data.scope,
                baseUrl: this.config.baseUrl,
                providerId: this.config.configId
            })
            mainWindow.show()
            mainWindow.focus()
        }
    }

    async handleProtocolCallback(url: string, mainWindow: BrowserWindow) {
        try {
            const urlObj = new URL(url)
            const code = urlObj.searchParams.get('code')

            if (code) {
                try {
                    const token = await this.exchangeCodeForToken(code, false)

                    if (token && token.access_token) {
                        this.handleAuthSuccess(token, mainWindow)
                        return token
                    } else {
                        throw new Error('No access_token in response')
                    }
                } catch (tokenError) {
                    throw tokenError
                }
            } else {
                throw new Error('No authorization code found in callback URL')
            }
        } catch (error) {
            mainWindow.webContents.send(`${this.config.provider}-oauth-error`, {
                message: error instanceof Error ? error.message : 'Failed to authenticate'
            })
        }
    }

    private handleAuthError(error: any, mainWindow: BrowserWindow, res?: any, reject?: any) {
        mainWindow.webContents.send(`${this.config.provider}-oauth-error`, {
            message: error.message || `Failed to authenticate with ${this.config.provider}`
        })

        if (res) {
            res.status(500)
                .type('html')
                .send(
                    oauthErrorPage(
                        this.config.provider,
                        error instanceof Error ? error.message : String(error)
                    )
                )
        }
        if (reject) reject(error)
    }
}
