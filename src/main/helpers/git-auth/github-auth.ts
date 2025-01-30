import { BrowserWindow, shell } from 'electron';
import express from 'express';
import * as path from 'path';
import * as fs from 'fs/promises';
import { TokenService } from '../../services/token-service';
import { GitHubService } from '../../services/github-service';
import { app as electronApp } from 'electron';
const GITHUB_CLIENT_ID = 'Ov23lic9e0U4Ffd3kBc1';
const GITHUB_CLIENT_SECRET = '056d96948e4f453b0190b5a0261122846260ee28';
const DEV_PORT = 3333

export const getAuthUrl = (isDev: boolean) => {
  const scopes = ['repo', 'read:user', 'read:org'].join(' ');
  const redirectUri = isDev 
    ? `http://localhost:${DEV_PORT}/oauth/callback`
    : 'igrp-studio://oauth/callback';

  return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scopes}`;
};

export async function setupGitHubOAuth(mainWindow: BrowserWindow, isDev: boolean) {
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
      const authUrl = getAuthUrl(true);
      shell.openExternal(authUrl);
    });

    app.get('/oauth/callback', async (req, res) => {
      const { code } = req.query;
      
      if (code) {
        try {
          const token = await exchangeCodeForToken(code as string, true);
          handleAuthSuccess(token, mainWindow);

          const templatePath = path.join(electronApp.getAppPath(), 'resources', 'templates', 'oauth-success.html');
          
          try {
            const template = await fs.readFile(templatePath, 'utf-8');
            res.send(template);
          } catch (readError) {
            res.send(`
              <html>
                <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
                  <h2>Authentication Successful!</h2>
                </body>
              </html>
            `);
          }
          
          server.close();
          resolve(token);
        } catch (error) {
          handleAuthError(error, mainWindow, res, reject);
        }
      }
    });
  });
}

async function setupProdOAuth(mainWindow: BrowserWindow) {
  return new Promise((resolve, reject) => {
    const handleUrl = async (url: string) => {
      try {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        
        if (code) {
          const token = await exchangeCodeForToken(code, false);
          handleAuthSuccess(token, mainWindow);
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
    
    const authUrl = getAuthUrl(false);
    shell.openExternal(authUrl);
  });
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
    mainWindow.webContents.send('github-oauth-error', {
      message: 'Failed to authenticate'
    });
  }
}

async function exchangeCodeForToken(code: string, isDev: boolean) {
  const redirectUri = isDev 
    ? `http://localhost:${DEV_PORT}/oauth/callback`
    : 'igrp-studio://oauth/callback';

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data;
}

function handleAuthSuccess(data: any, mainWindow: BrowserWindow) {
  if (data.access_token) {
    TokenService.setToken('github', data);
    
    GitHubService.initialize(data.access_token);

    mainWindow.webContents.send('github-oauth-success', {
      access_token: data.access_token,
      scope: data.scope
    });
    mainWindow.show();
    mainWindow.focus();
  }
}

async function handleAuthError(error: any, mainWindow: BrowserWindow, res?: any, reject?: any) {
  mainWindow.webContents.send('github-oauth-error', {
    message: error.message || 'Failed to authenticate with GitHub'
  });
  
  if (res) {
    try {
      const templatePath = path.join(electronApp.getAppPath(), 'resources', 'templates', 'oauth-error.html');
      let template = await fs.readFile(templatePath, 'utf-8');
      
      template = template.replace('${error}', error.message || 'An error occurred during authentication');
      
      res.status(500).send(template);
    } catch (readError) {
      res.status(500).send(`
        <html>
          <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
            <h2>Authentication Failed</h2>
          </body>
        </html>
      `);
    }
  }
  
  if (reject) reject(error);
}