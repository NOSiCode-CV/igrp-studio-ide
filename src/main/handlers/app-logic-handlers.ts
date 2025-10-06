import { ipcMain, BrowserWindow } from 'electron';
import { AppLogicStore } from '../services/app-logic-store';
import { EVENTS } from '../constants/events';
import type { AppLogicEnvironment } from '../types';

// Environment management
ipcMain.handle(EVENTS.APPLOGIC.FIND_ALL, () => {
    try {
        return AppLogicStore.getEnvironments();
    } catch (error) {
        console.error('Error getting environments:', error);
        return [];
    }
});

ipcMain.handle(
    EVENTS.APPLOGIC.CREATE,
    (__, environment: AppLogicEnvironment) => {
        try {
            const result = AppLogicStore.addEnvironment(environment);
            // Notify all windows about the change
            BrowserWindow.getAllWindows().forEach((window) => {
                window.webContents.send(
                    EVENTS.APPLOGIC.CHANGE,
                    AppLogicStore.getEnvironments()
                );
            });

            return result;
        } catch (error) {
            console.error('Error adding environment:', error);
            throw error;
        }
    }
);

ipcMain.handle(
    EVENTS.APPLOGIC.UPDATE,
    (__, id: string, updates: Partial<AppLogicEnvironment>) => {
        try {
            AppLogicStore.updateEnvironment(id, updates);

            // Notify all windows about the change
            BrowserWindow.getAllWindows().forEach((window) => {
                window.webContents.send(
                    EVENTS.APPLOGIC.CHANGE,
                    AppLogicStore.getEnvironments()
                );
            });

            return true;
        } catch (error) {
            console.error('Error updating environment:', error);
            throw error;
        }
    }
);

ipcMain.handle(EVENTS.APPLOGIC.DELETE, (__, id: string) => {
    try {
        AppLogicStore.deleteEnvironment(id);

        // Notify all windows about the change
        BrowserWindow.getAllWindows().forEach((window) => {
            window.webContents.send(
                EVENTS.APPLOGIC.CHANGE,
                AppLogicStore.getEnvironments()
            );
        });

        return true;
    } catch (error) {
        console.error('Error deleting environment:', error);
        throw error;
    }
});

ipcMain.handle(EVENTS.APPLOGIC.GET, (__, id: string) => {
    try {
        return AppLogicStore.getEnvironment(id);
    } catch (error) {
        console.error('Error getting environment:', error);
        return null;
    }
});

ipcMain.handle(EVENTS.APPLOGIC.SEARCH, (__, searchTerm: string) => {
    try {
        return AppLogicStore.searchEnvironments(searchTerm);
    } catch (error) {
        console.error('Error searching environments:', error);
        return [];
    }
});

ipcMain.handle(
    'app-logic:get-environment-history',
    (__, environmentId: string) => {
        try {
            return AppLogicStore.getEnvironmentHistory(environmentId);
        } catch (error) {
            console.error('Error getting environment history:', error);
            return [];
        }
    }
);

ipcMain.handle(
    'app-logic:clear-environment-history',
    (__, _environmentId: string) => {
        try {
            //AppLogicStore.clearEnvironmentHistory(environmentId)
            return true;
        } catch (error) {
            console.error('Error clearing environment history:', error);
            throw error;
        }
    }
);

// Requests
ipcMain.handle('app-logic:add-request', (_event) => {
    try {
        //AppLogicStore.addRequest(request)
        return true;
    } catch (error) {
        console.error('Error adding request:', error);
        throw error;
    }
});

ipcMain.handle('app-logic:get-requests', (_) => {
    try {
        //return AppLogicStore.getRequests(environmentId)
        return null;
    } catch (error) {
        console.error('Error getting requests:', error);
        return [];
    }
});

// Backup/Export
ipcMain.handle('app-logic:create-backup', () => {
    try {
        return AppLogicStore.createBackup();
    } catch (error) {
        console.error('Error creating backup:', error);
        throw error;
    }
});

ipcMain.handle('app-logic:restore-backup', (__, backup: any) => {
    try {
        AppLogicStore.restoreBackup(backup);

        // Notify all windows about the change
        BrowserWindow.getAllWindows().forEach((window) => {
            window.webContents.send(
                EVENTS.APPLOGIC.CHANGE,
                AppLogicStore.getEnvironments()
            );
        });

        return true;
    } catch (error) {
        console.error('Error restoring backup:', error);
        throw error;
    }
});

ipcMain.handle('app-logic:export-data', () => {
    try {
        const backup = AppLogicStore.createBackup();
        return JSON.stringify(backup, null, 2);
    } catch (error) {
        console.error('Error exporting data:', error);
        throw error;
    }
});

ipcMain.handle('app-logic:import-data', (__, jsonData: string) => {
    try {
        const backup = JSON.parse(jsonData);
        AppLogicStore.restoreBackup(backup);

        // Notify all windows about the change
        BrowserWindow.getAllWindows().forEach((window) => {
            window.webContents.send(
                EVENTS.APPLOGIC.CHANGE,
                AppLogicStore.getEnvironments()
            );
        });

        return { success: true };
    } catch (error) {
        console.error('Error importing data:', error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Invalid backup format',
        };
    }
});

// Store info
ipcMain.handle('app-logic:get-store-info', () => {
    try {
        return {
            isReady: AppLogicStore.isReady(),
            isElectron: true,
            path: AppLogicStore.getStorePath(),
            //size: AppLogicStore.getStoreSize(),
        };
    } catch (error) {
        console.error('Error getting store info:', error);
        return {
            isReady: false,
            isElectron: true,
            path: null,
            size: 0,
        };
    }
});

// HTTP Client operations
ipcMain.handle(
    EVENTS.APPLOGIC.TEST,
    async (_, environment: AppLogicEnvironment) => {
        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            console.log('environment.url: ' + environment.url);
            const response = await fetch(environment.url, {
                method: 'GET',
                headers: {
                    'API-KEY': environment.apiKey,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });
            console.log('handle: ' + response.ok);
            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;
            const isSuccess = response.ok;

            return {
                isValid: isSuccess,
                url: environment.url,
                responseTime,
                error: isSuccess
                    ? undefined
                    : `HTTP ${response.status}: ${response.statusText}`,
                statusCode: response.status,
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                isValid: false,
                responseTime,
                error: error instanceof Error ? error.message : 'Network error',
                statusCode: 0,
            };
        }
    }
);

ipcMain.handle(
    'app-logic:make-request',
    async (
        _,
        environment: AppLogicEnvironment,
        endpoint: string,
        options: any = {}
    ) => {
        const url = `${environment.url}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        const method = options.method || 'GET';
        const timeout = options.timeout || 10000;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-API-Key': environment.apiKey,
            ...options.headers,
        };

        const requestOptions: RequestInit = {
            method,
            headers,
        };

        if (options.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
            requestOptions.body =
                typeof options.body === 'string'
                    ? options.body
                    : JSON.stringify(options.body);
        }

        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                ...requestOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;

            let data: any;
            try {
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    data = await response.json();
                } else {
                    data = await response.text();
                }
            } catch {
                data = null;
            }

            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            return {
                status: response.status,
                data,
                headers: responseHeaders,
                responseTime,
                success: response.ok,
            };
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout}ms`);
            }

            throw new Error(
                error instanceof Error ? error.message : 'Network error'
            );
        }
    }
);
