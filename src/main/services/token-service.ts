let store: any = null;

export const TokenService = {
  async initialize() {
    const Store = (await import('electron-store')).default;
    store = new Store({
      name: 'igrp-studio-auth',
      clearInvalidConfig: true
    });
  },

  setToken(service: 'github' | 'gitlab', token: any) {
    store?.set(`${service}_token`, token);
  },

  getToken(service: 'github' | 'gitlab'): string | null {
    const token = store?.get(`${service}_token`);
    return token || null;
  },

  logoutGithub() {
    store?.delete('github_token');
  },

  logoutGitlab() {
    store?.delete('gitlab_token');
  }
};