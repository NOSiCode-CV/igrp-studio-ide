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
        try {
            const [userGitHub, userGitLab, repoGithub, repoGitlab] = await Promise.all([
                window.electron.ipcRenderer.invoke('github-user-info'),
                window.electron.ipcRenderer.invoke('gitlab-user-info'),
                window.electron.ipcRenderer.invoke('github-repositories'),
                window.electron.ipcRenderer.invoke('gitlab-repositories'),
            ]);
       
            dispatch(setRepositoriesGitHub(repoGithub as Repository[]));
            dispatch(setRepositoriesGitLab(repoGitlab as Repository[]));
            dispatch(setUserGithub(userGitHub));
            dispatch(setUserGitLab(userGitLab));
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        window.electron.ipcRenderer.on('github-oauth-success', async (_event, data) => {
            await window.electron.ipcRenderer.invoke('gitauth-initialize', data.access_token);
            await loadGithubData();
        });

        if (!isInitialized) {
            loadGithubData();
        }

        return () => {
            window.electron.ipcRenderer.removeAllListeners('github-oauth-success');
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


export default useGitAuth