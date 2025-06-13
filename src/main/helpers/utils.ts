import { BrowserWindow, dialog } from "electron";
import { app } from "electron/main";
import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from 'electron-devtools-installer';
import { is } from "@electron-toolkit/utils";
var allow_quit = false;
export function closeApp(mainWindow: BrowserWindow) {
    mainWindow.on('close', async function (e) {
        if (!allow_quit) {
            e.preventDefault();
            var choice = await dialog.showMessageBox(mainWindow,
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
            .then(name => console.log(`Added Extension:  ${name}`))
            .catch(err => console.log('An error occurred: ', err));
        installExtension(REDUX_DEVTOOLS)
            .then(name => console.log(`Added Extension:  ${name}`))
            .catch(err => console.log('An error occurred: ', err));
    }
}


export function escapePath(pathString: string): string {
    // Escape spaces and special characters in paths
    return `"${pathString.replace(/"/g, '\\"')}"`;
}