let store: any = null;

export const TokenService = {
  async initialize() {
    const Store = (await import('electron-store')).default;
    store = new Store({
      encryptionKey: 'sua_chave_secreta'
    });
  },

  setToken(token: string) {
    store?.set('github_token', token);
  },

  getToken(): string | null {
    return store?.get('github_token') || null;
  },

  clearToken() {
    store?.delete('github_token');
  }
};