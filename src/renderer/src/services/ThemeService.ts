
export const ThemeService = {
    async getActiveTheme(): Promise<string> {
        return await window.electron.ipcRenderer.invoke('theme:get');
    },

    async setActiveTheme(theme: string): Promise<void> {
        await window.electron.ipcRenderer.invoke('theme:set', theme);
    },

    async resetTheme(): Promise<void> {
        await window.electron.ipcRenderer.invoke('theme:reset');
    }
};
