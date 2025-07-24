import { BrowserWindow, dialog } from "electron";
import { app } from "electron/main";
import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from 'electron-devtools-installer';
import { is } from "@electron-toolkit/utils";
import axios from 'axios';
import fs from 'fs';
import path from 'path';
let allow_quit = false;
export function closeApp(mainWindow: BrowserWindow) {
    mainWindow.on('close', async function (e) {
        if (!allow_quit) {
            e.preventDefault();
            const choice = await dialog.showMessageBox(mainWindow,
                {
                    type: 'question',
                    buttons: ['Yes', 'No'],
                    title: 'Confirm',
                    message: 'Are you sure you want to quit?'
                });
            if (choice.response == 0) {
                allow_quit = true;
                app.quit();
            }
        }
    })
}

export function installExtensions(mainWindow: BrowserWindow): void {
    if (is.dev && process.platform === 'darwin') {
        // Open the DevTools.
        mainWindow.webContents.openDevTools();
        // Install extensions
        installExtension(REACT_DEVELOPER_TOOLS)
            // eslint-disable-next-line no-console
            .then(name => console.log(`Added Extension:  ${name}`))
            // eslint-disable-next-line no-console
            .catch(err => console.log('An error occurred: ', err));
        installExtension(REDUX_DEVTOOLS)
            // eslint-disable-next-line no-console
            .then(name => console.log(`Added Extension:  ${name}`))
            // eslint-disable-next-line no-console
            .catch(err => console.log('An error occurred: ', err));
    }
}


export function escapePath(pathString: string): string {
    // Escape spaces and special characters in paths
    return `"${pathString.replace(/"/g, '\\"')}"`;
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
        console.log(`Starting download from: ${url}`);
        console.log(`Destination: ${destinationPath}`);

        // Ensure the destination directory exists
        const dir = path.dirname(destinationPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 30000, // 30 seconds timeout
        });

        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;

        const writer = fs.createWriteStream(destinationPath);
        
        response.data.on('data', (chunk: Buffer) => {
            downloadedSize += chunk.length;
            if (onProgress && totalSize > 0) {
                const progress = (downloadedSize / totalSize) * 100;
                onProgress(progress);
            }
        });

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`Download completed: ${destinationPath}`);
                resolve(true);
            });

            writer.on('error', (error) => {
                console.error('Error writing file:', error);
                reject(error);
            });

            response.data.on('error', (error) => {
                console.error('Error downloading file:', error);
                reject(error);
            });

            response.data.pipe(writer);
        });
    } catch (error) {
        console.error('Download failed:', error);
        return false;
    }
}

/**
 * Downloads the IGRP Next template from Sonatype repository
 * @param destinationPath - The local path where the template should be saved
 * @param onProgress - Optional callback for download progress
 * @returns Promise<boolean> - True if download was successful
 */
export async function downloadIgrpNextTemplate(
    destinationPath?: string,
    onProgress?: (progress: number) => void
): Promise<boolean> {
    const templateUrl = 'https://sonatype.nosi.cv/repository/igrp-templates/@igrp/framework-next/0.0.1-alpha.0/igrp-next-template.zip';
    
    // Default destination path if not provided
    const defaultPath = path.join(app.getPath('downloads'), 'igrp-next-template.zip');
    const finalPath = destinationPath || defaultPath;

    console.log('Downloading IGRP Next template...');
    console.log(`URL: ${templateUrl}`);
    console.log(`Destination: ${finalPath}`);

    return await downloadFile(templateUrl, finalPath, onProgress);
}
