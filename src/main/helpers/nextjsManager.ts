import { BrowserWindow } from 'electron';

class NextJsManager {
  private previewWindow: BrowserWindow | null = null;

  constructor(_mainWindow: BrowserWindow) {
  }

  // Abre a janela de preview com o nome da página
  public openPreviewWindow(pageName: string): void {
    if (this.previewWindow) {
      this.previewWindow.focus(); // Foca na janela de preview existente, se já estiver aberta
      return;
    }

    this.previewWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false, // Desabilita nodeIntegration por segurança
        contextIsolation: true, // Habilita context isolation por segurança
      },
    });

    // Carrega a URL da página específica
    const previewUrl = `http://localhost:3000/pages/${pageName}`;
    this.previewWindow.loadURL(previewUrl);

    // Lida com o evento de fechamento da janela
    this.previewWindow.on('closed', () => {
      this.previewWindow = null; // Limpa a referência quando a janela é fechada
    });
  }
}

export default NextJsManager;