import { RootState } from "@renderer/redux";
import { setRepositories, setUser } from "@renderer/redux/git/reducer";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Repository } from "src/main/types";

const useGithubAuth = () => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const { user, repositories, isInitialized } = useSelector((state: RootState) => state.git);

    const loadGithubData = async () => {
        setIsLoading(true);
        try {
            const [userInfo, repos] = await Promise.all([
                window.electron.ipcRenderer.invoke('github-user-info'),
                window.electron.ipcRenderer.invoke('github-repositories'),
            ]);
            
            dispatch(setRepositories(repos as Repository[]));
            dispatch(setUser(userInfo));
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            console.error('Failed to load GitHub data:', error);
        }
    };

    useEffect(() => {
        window.electron.ipcRenderer.on('github-oauth-success', async (_event, data) => {
            await window.electron.ipcRenderer.invoke('github-initialize', data.access_token);
            //await loadGithubData();
        });

        if (!isInitialized) {
            //loadGithubData();
        }

        return () => {
            window.electron.ipcRenderer.removeAllListeners('github-oauth-success');
        };
    }, [isInitialized, dispatch]);

    const handleLogin = () => {
        window.electron.ipcRenderer.send('github-oauth');
    };

    const handleLogout = async () => {
        await window.electron.ipcRenderer.invoke('logout-github');
        dispatch(setUser(null));
        dispatch(setRepositories([]));
    };

    return {
        user,
        repositories,
        isAuthenticated: !!user,
        loginGithub: handleLogin,
        logoutGithub: handleLogout,
        reloadData: loadGithubData,
        isLoading
    };
};


export default useGithubAuth