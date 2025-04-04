import { RootState } from "@renderer/redux";
import { setRepositoriesGitHub, setRepositoriesGitLab, setUserGithub, setUserGitLab } from "@renderer/redux/git/reducer";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Repository } from "src/main/types";

const useGitAuth = () => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const { userGitHub, userGitLab, repositoriesGitHub, repositoriesGitLab, isInitialized } = useSelector((state: RootState) => state.git);

    const loadGithubData = async () => {
        setIsLoading(true);
        
        const processGitHubUserInfo = async () => {
            try {
                const userGitHub = await window.electron.ipcRenderer.invoke('github-user-info');
                if (userGitHub) {
                    dispatch(setUserGithub(userGitHub));
                }
            } catch (error) {
                console.error('Falha ao carregar informações do usuário GitHub:', error);
            }
        };
        
        const processGitLabUserInfo = async () => {
            try {
                const userGitLab = await window.electron.ipcRenderer.invoke('gitlab-user-info');
                if (userGitLab) {
                    dispatch(setUserGitLab(userGitLab));
                }
            } catch (error) {
                console.error('Falha ao carregar informações do usuário GitLab:', error);
            }
        };
        
        const processGitHubRepositories = async () => {
            try {
                const repoGithub = await window.electron.ipcRenderer.invoke('github-repositories');
                if (repoGithub) {
                    dispatch(setRepositoriesGitHub(repoGithub as Repository[]));
                }
            } catch (error) {
                console.error('Falha ao carregar repositórios do GitHub:', error);
            }
        };
        
        const processGitLabRepositories = async () => {
            try {
                const repoGitlab = await window.electron.ipcRenderer.invoke('gitlab-repositories');
                if (repoGitlab) {
                    dispatch(setRepositoriesGitLab(repoGitlab as Repository[]));
                }
            } catch (error) {
                console.error('Falha ao carregar repositórios do GitLab:', error);
            }
        };
        
        const promises = [
            processGitHubUserInfo(),
            processGitLabUserInfo(),
            processGitHubRepositories(),
            processGitLabRepositories()
        ];
        
        await Promise.allSettled(promises);
        
        setIsLoading(false);
    };
    
    useEffect(() => {
        window.electron.ipcRenderer.on('github-oauth-success', async (_event, data) => {
            await window.electron.ipcRenderer.invoke('gitauth-initialize', data.access_token);
            await loadGithubData();
        });

        window.electron.ipcRenderer.on('gitlab-oauth-success', async (_event, data) => {
            await window.electron.ipcRenderer.invoke('gitlab-initialize', data.access_token);
            await loadGithubData();
        });

        if (!isInitialized) {
            loadGithubData();
        }

        return () => {
            window.electron.ipcRenderer.removeAllListeners('github-oauth-success');
            window.electron.ipcRenderer.removeAllListeners('gitlab-oauth-success');
        };
    }, [isInitialized, dispatch]);

    const handleLoginGithub = () => {
        window.electron.ipcRenderer.send('github-oauth');
    };

    const handleLoginGitLab = () => {
        window.electron.ipcRenderer.send('gitlab-oauth');
    };

    const handleLogout = async () => {
        await window.electron.ipcRenderer.invoke('logout-github');
        dispatch(setUserGithub(null));
        dispatch(setRepositoriesGitHub([]));
    };

    const handleLogoutGitLab = async () => {
        await window.electron.ipcRenderer.invoke('logout-gitlab');
        dispatch(setUserGitLab(null));
        dispatch(setRepositoriesGitLab([]));
    };

    return {
        userGitHub,
        userGitLab,
        repositoriesGitHub,
        repositoriesGitLab,
        isAuthenticated: !!userGitHub || !!userGitLab,
        loginGithub: handleLoginGithub,
        loginGitLab: handleLoginGitLab,
        logoutGithub: handleLogout,
        logoutGitLab: handleLogoutGitLab,
        reloadData: loadGithubData,
        isLoading
    };
};

export default useGitAuth;