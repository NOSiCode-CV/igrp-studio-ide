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
  },

  setProjectPath(repoId: number, path: string) {
    const projectPaths = store.get('project_paths', {});
    store.set('project_paths', {
      ...projectPaths,
      [repoId]: path
    });
  },

  getProjectPath(repoId: number): string | null {
    const projectPaths = store.get('project_paths', {});
    return projectPaths[repoId] || null;
  },

  addClonedRepo(repoId: number) {
    const clonedRepos = store.get('cloned_repos', []);
    if (!clonedRepos.includes(repoId)) {
      store.set('cloned_repos', [...clonedRepos, repoId]);
    }
  },

  getClonedRepos(): number[] {
    const repos = store.get('cloned_repos', []);
    return repos || []; 
  },

  getProjectPaths(): Record<number, string> {
    return store.get('project_paths', {});
  }
};