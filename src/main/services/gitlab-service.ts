import { Gitlab } from '@gitbeaker/node';
import { TokenService } from './token-service';

let gitlab: any = null;

export const GitLabService = {
  async initializeServices() {
    try {
      const token = TokenService.getToken('gitlab');
      
      if (token) {
        await this.initialize(token);
        return true;
      }
    } catch (error) {
      console.error('Failed to initialize GitLab service:', error);
    }
    return false;
  },

  async initialize(token: string) {
    try {
      gitlab = new Gitlab({
        oauthToken: token,
        host: 'https://gitlab.com'
      });

      TokenService.setToken('gitlab', token);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize GitLab client:', error);
      gitlab = null;
      throw error;
    }
  },

  async getUserInfo() {
    if (!gitlab) throw new Error('GitLab client not initialized');
    return gitlab.Users.current();
  },

};