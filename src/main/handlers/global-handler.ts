import { ipcMain } from "electron";
import { IGRPStudioSettings } from "../helpers/igrp-studio-settings";
import { DoctorService } from "../services/doctor-service";
import { ToolCheck } from "../types";

ipcMain.handle('theme:get', async () => {
    return IGRPStudioSettings.getActiveTheme();
});

ipcMain.handle('theme:set', async (_event, theme: string) => {
    IGRPStudioSettings.setActiveTheme(theme);
    return true;
});


ipcMain.handle('run-doctor-checks', async (): Promise<ToolCheck[]> => {
    return DoctorService.run()
});

ipcMain.handle('save-doctor-report', async (_event, results) => {
    const filePath = path.join(__dirname, `doctor-report-${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    return filePath;
});