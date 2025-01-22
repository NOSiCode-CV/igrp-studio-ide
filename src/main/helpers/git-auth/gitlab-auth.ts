import { BrowserWindow, shell } from 'electron';
import express from 'express';
import { TokenService } from '../../services/token-service';
import { GitLabService } from '../../services/gitlab-service';

const GITLAB_CLIENT_ID = '7a0b38edcf3d7aae9b491432bbc88aa0a2392c0dfaa19805cf826d3d476509c1';
const GITLAB_CLIENT_SECRET = 'gloas-9f42545e2609a93e88b815956deaa4dfecf4c76a6978c6b8ed2b48a492ed66ef';
const DEV_PORT = 3333;

export const getGitLabAuthUrl = (isDev: boolean) => {
  const scopes = ['api', 'read_user', 'read_repository'].join(' ');
  const redirectUri = isDev 
    ? `http://localhost:${DEV_PORT}/oauth/callback`
    : 'igrp-studio://oauth/callback';

  return `https://gitlab.com/oauth/authorize?client_id=${GITLAB_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}`;
};

export async function setupGitLabOAuth(mainWindow: BrowserWindow, isDev: boolean) {
  if (isDev) {
    return setupDevOAuth(mainWindow);
  } else {
    return setupProdOAuth(mainWindow);
  }
}

async function setupDevOAuth(mainWindow: BrowserWindow) {
  return new Promise((resolve, reject) => {
    const app = express();
    const server = app.listen(DEV_PORT, () => {
      const authUrl = getGitLabAuthUrl(true);
      shell.openExternal(authUrl);
    });

    app.get('/oauth/callback', async (req, res) => {
      const { code } = req.query;
      
      if (code) {
        try {
          const token = await exchangeCodeForToken(code as string, true);
          handleAuthSuccess(token, mainWindow);
          
          res.send(`
            <html>
              <body style="background: #0d1117; color: #c9d1d9; font-family: -apple-system;">
                <h2>✅ GitLab authentication successful!</h2>
                <p>You can close this window and return to the application.</p>
                <script>setTimeout(() => window.close(), 2000);</script>
              </body>
            </html>
          `);
          
          server.close();
          resolve(token);
        } catch (error) {
          handleAuthError(error, mainWindow, res, reject);
        }
      }
    });
  });
}

async function setupProdOAuth(_mainWindow: BrowserWindow) {
  const authUrl = getGitLabAuthUrl(false);
  shell.openExternal(authUrl);
  return Promise.resolve();
}

export async function handleProtocolCallback(url: string, mainWindow: BrowserWindow) {
  try {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    
    if (code) {
      const token = await exchangeCodeForToken(code, false);
      handleAuthSuccess(token, mainWindow);
    }
  } catch (error) {
    console.error('Error handling protocol callback:', error);
    mainWindow.webContents.send('gitlab-oauth-error', {
      message: 'Failed to authenticate'
    });
  }
}

async function exchangeCodeForToken(code: string, isDev: boolean) {
  const redirectUri = isDev 
    ? `http://localhost:${DEV_PORT}/oauth/callback`
    : 'igrp-studio://oauth/callback';

  const response = await fetch('https://gitlab.com/oauth/token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: GITLAB_CLIENT_ID,
      client_secret: GITLAB_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data;
}

function handleAuthSuccess(data: any, mainWindow: BrowserWindow) {
  if (data.access_token) {
    TokenService.setToken('gitlab', data.access_token);
    
    GitLabService.initialize(data.access_token);

    mainWindow.webContents.send('gitlab-oauth-success', {
      access_token: data.access_token,
      scope: data.scope
    });
    mainWindow.show();
    mainWindow.focus();
  }
}

function handleAuthError(error: any, mainWindow: BrowserWindow, res?: any, reject?: any) {
  mainWindow.webContents.send('gitlab-oauth-error', {
    message: error.message || 'Failed to authenticate with GitLab'
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