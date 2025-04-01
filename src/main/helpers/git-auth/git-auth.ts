import { BrowserWindow, shell } from 'electron';
import express from 'express';
import { app as electronApp } from 'electron';

interface GitProviderConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  provider: 'github' | 'gitlab';
}

interface GitService {
  initialize: (token: string) => void;
}

const DEV_PORT = process.env.DEV_PORT || 3333;

export class GitAuth {
  private config: GitProviderConfig;
  private tokenService: any;
  private gitService: GitService;

  constructor(config: GitProviderConfig, tokenService: any, gitService: GitService) {
    this.config = config;
    this.tokenService = tokenService;
    this.gitService = gitService;
  }

  getAuthUrl(isDev: boolean): string {
    const scopes = this.config.scopes.join(' ');
    const redirectUri = isDev
      ? `http://localhost:${DEV_PORT}/oauth/callback`
      : import.meta.env.VITE_GIT_REDIRECT_URI;

    return `${this.config.authUrl}?client_id=${this.config.clientId}&redirect_uri=${redirectUri}` +
      `${this.config.provider === 'gitlab' ? '&response_type=code' : ''}&scope=${scopes}`;
  }

  async setupOAuth(mainWindow: BrowserWindow, isDev: boolean) {
    if (isDev) {
      return this.setupDevOAuth(mainWindow);
    } else {
      return this.setupProdOAuth(mainWindow);
    }
  }

  private async setupDevOAuth(mainWindow: BrowserWindow) {
    return new Promise((resolve, reject) => {
      const app = express();
      const server = app.listen(DEV_PORT, () => {
        const authUrl = this.getAuthUrl(true);
        shell.openExternal(authUrl);
      });

      app.get('/oauth/callback', async (req, res) => {
        const { code } = req.query;

        if (code) {
          try {
            const token = await this.exchangeCodeForToken(code as string, true);
            this.handleAuthSuccess(token, mainWindow);

            res.send(`
              <html>
                <body style="background: #0d1117; color: #c9d1d9; font-family: -apple-system;">
                  <h2>✅ ${this.config.provider.toUpperCase()} authentication successful!</h2>
                  <p>You can close this window and return to the application.</p>
                  <script>setTimeout(() => window.close(), 2000);</script>
                </body>
              </html>
            `);

            server.close();
            resolve(token);
          } catch (error) {
            this.handleAuthError(error, mainWindow, res, reject);
          }
        }
      });
    });
  }

  private async setupProdOAuth(mainWindow: BrowserWindow) {
    return new Promise((resolve, reject) => {
      const handleUrl = async (url: string) => {
        try {
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');

          if (code) {
            const token = await this.exchangeCodeForToken(code, false);
            this.handleAuthSuccess(token, mainWindow);
            resolve(token);
            electronApp.removeListener('open-url', urlHandler);
          }
        } catch (error) {
          reject(error);
          electronApp.removeListener('open-url', urlHandler);
        }
      };

      const urlHandler = (event: Electron.Event, url: string) => {
        event.preventDefault();
        handleUrl(url);
      };

      electronApp.on('open-url', urlHandler);

      const authUrl = this.getAuthUrl(false);
      shell.openExternal(authUrl);
    });
  }

  private async exchangeCodeForToken(code: string, isDev: boolean) {
    const redirectUri = isDev
      ? `http://localhost:${DEV_PORT}/oauth/callback`
      : import.meta.env.VITE_GIT_REDIRECT_URI;

    const body: any = {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: redirectUri
    };

    // Adiciona grant_type apenas para GitLab
    if (this.config.provider === 'gitlab') {
      body.grant_type = 'authorization_code';
    }

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error_description || data.error);
    return data;
  }

  private handleAuthSuccess(data: any, mainWindow: BrowserWindow) {
    if (data.access_token) {
      this.tokenService.setToken(this.config.provider, data.access_token);
      this.gitService.initialize(data.access_token);

      mainWindow.webContents.send(`${this.config.provider}-oauth-success`, {
        access_token: data.access_token,
        scope: data.scope
      });
      mainWindow.show();
      mainWindow.focus();
    }
  }

  async handleProtocolCallback(url: string, mainWindow: BrowserWindow) {
    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');

      if (code) {
        const token = await this.exchangeCodeForToken(code, false);
        this.handleAuthSuccess(token, mainWindow);
      }
    } catch (error) {
      console.error(`Error handling ${this.config.provider} protocol callback:`, error);
      mainWindow.webContents.send(`${this.config.provider}-oauth-error`, {
        message: 'Failed to authenticate'
      });
    }
  }

  private handleAuthError(error: any, mainWindow: BrowserWindow, res?: any, reject?: any) {
    mainWindow.webContents.send(`${this.config.provider}-oauth-error`, {
      message: error.message || `Failed to authenticate with ${this.config.provider}`
    });

    if (res) {
      res.status(500).send(`
        <html>
          <body style="background: #0d1117; color: #c9d1d9; font-family: -apple-system;">
            <h2>❌ Authentication Error</h2>
            <p>Please try again.</p>
          </body>
        </html>
      `);
    }
    if (reject) reject(error);
  }
}