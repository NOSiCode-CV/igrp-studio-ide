import { app, autoUpdater, dialog, MessageBoxOptions } from "electron"

const { updateElectronApp, UpdateSourceType } = require('update-electron-app')


export function updateApp() {
    const path = 'https://storage-api.nosi.cv/igrp-package'

    updateElectronApp({
        updateSource: {
            type: UpdateSourceType.StaticStorage,
            baseUrl: `${path}/${process.platform}/${process.arch}`
        }
    })

    const url = `${path}/${process.platform}/${app.getVersion()}`

    autoUpdater.setFeedURL({ url })

    setInterval(() => {
        console.log(url)
        autoUpdater.checkForUpdates()
    }, 60000)

    autoUpdater.on('update-downloaded', (_event, releaseNotes, releaseName) => {
        const dialogOpts: MessageBoxOptions = {
            type: 'info',
            buttons: ['Restart', 'Later'],
            title: 'Application Update',
            message: process.platform === 'win32' ? releaseNotes : releaseName,
            detail:
                'A new version has been downloaded. Restart the application to apply the updates.'
        }

        dialog.showMessageBox(dialogOpts).then((returnValue) => {
            if (returnValue.response === 0) autoUpdater.quitAndInstall()
        })
    })

    autoUpdater.on('error', (message) => {
        console.error('There was a problem updating the application')
        console.error(message)
    })
}