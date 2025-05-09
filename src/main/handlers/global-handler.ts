import { ipcMain } from "electron";
import { IGRPStudioSettings } from "../helpers/igrp-studio-settings";

ipcMain.handle('theme:get', async () => {
    return IGRPStudioSettings.getActiveTheme();
});

ipcMain.handle('theme:set', async (_event, theme: string) => {
    IGRPStudioSettings.setActiveTheme(theme);
    return true;
});

