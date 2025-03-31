import { useState, useEffect } from 'react';
import useToast from '@renderer/components/useToast';
import { IWorkspace, ProjectData } from 'src/main/types';
import { useDispatch } from 'react-redux';
import { navigateToNextPage, setBasePath, setConfig, setWorkspace } from '@renderer/redux/thunks';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

interface RootState {
    PageBuilder: {
        workspace: IWorkspace
    };
}

const selectState = (state: RootState) => state.PageBuilder;

export const useWorkspace = () => {
    const { showSuccessToast, showErrorToast } = useToast();
    const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<IWorkspace | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const dispatch: any = useDispatch()
    const navigate = useNavigate()

    const selectProperties = createSelector(
        selectState,
        (studio) => ({
            workspace: studio.workspace
        })
    );

    const { workspace } = useSelector(selectProperties);

    // Setup workspace and error handling
    useEffect(() => {
        const initialize = async () => {
            try {
                await window.igrpStudio.workspace.initialize();

                window.igrpStudio.workspace.onError(({ code, message }) => {
                    console.error(`[${code}] ${message}`);
                    showErrorToast(message);
                });

            } catch (err) {
                console.error('Workspace initialization failed:', err);
                showErrorToast('Failed to initialize workspace system');
                setError('Initialization failed');
            }
        };

        initialize();

        const handleUpdate = () => refreshWorkspaces();
        window.addEventListener('workspace-updated', handleUpdate);

        return () => {
            window.removeEventListener('workspace-updated', handleUpdate);
        };
    }, []);

    const getWorkspaces = async () => {
        return await window.igrpStudio.workspace.findAllWorkspaces();
    }

    const getRecentWorkspaces = async () => {
        return await window.igrpStudio.workspace.findRecentWorkspaces(3);
    }

    const refreshWorkspaces = async () => {
        setLoading(true);
        try {
            const data = await getWorkspaces();
            setWorkspaces(data);
            markWorkspaceAccessed(data)
        } catch (err) {
            showErrorToast('Failed to load workspaces');
        } finally {
            setLoading(false);
        }
    };

    const createWorkspace = async (workspaceData: Omit<IWorkspace, 'id' | 'createdAt'>) => {
        setLoading(true);
        try {
            const newWorkspace = await window.igrpStudio.workspace.createWorkspace({
                ...workspaceData,
                createdAt: new Date().toISOString()
            });

            setWorkspaces(prev => [...prev, newWorkspace]);

            setCurrentWorkspace(newWorkspace);

            showSuccessToast(`Workspace "${newWorkspace.name}" created`);

            return newWorkspace;
        } catch (err) {
            setError('Failed to create workspace');
            showErrorToast('Workspace creation failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const markWorkspaceAccessed = async (workspaces: IWorkspace[]) => {
        const workspace = [...workspaces].sort((a, b) => {
            const aLastAccess = new Date(a.updatedAt || a.createdAt);
            const bLastAccess = new Date(b.updatedAt || b.createdAt);
            return bLastAccess.getTime() - aLastAccess.getTime();
        })[0];
        switchWorkspace(workspace)
    }

    const updateWorkspace = async (id: string, updates: Partial<IWorkspace>) => {
        setLoading(true);
        try {
            const updated = await window.igrpStudio.workspace.updateWorkspace(id, updates);
            setWorkspaces(prev =>
                prev.map(w => w.id === id ? updated : w)
            );

            if (currentWorkspace?.id === id) {
                setCurrentWorkspace(updated);
            }

            showSuccessToast(`Workspace "${updated.name}" saved`);

            return updated;
        } catch (err) {
            setError('Failed to update workspace');
            showErrorToast('Update failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteWorkspace = async (id: string) => {
        setLoading(true);
        try {
            await window.igrpStudio.workspace.deleteWorkspace(id);
            setWorkspaces(prev => prev.filter(w => w.id !== id));

            if (currentWorkspace?.id === id) {
                setCurrentWorkspace(null);
            }

            showSuccessToast('Workspace removed');
        } catch (err) {
            setError('Failed to delete workspace');
            showErrorToast('Deletion failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const switchWorkspace = async (workspace: IWorkspace) => {
        if (!workspace) return
        setCurrentWorkspace(workspace);
        dispatch(setWorkspace(workspace))
        await window.igrpStudio.workspace.updateWorkspace(workspace.id, workspace);
    };

    const validateWorkspaceName = (name: string) => {
        if (!name.trim()) return 'Name is required';
        if (workspaces.some(w => w.name === name)) return 'Name already exists';
        return null;
    };

    const saveOrOpenProject = async (project: ProjectData) => {

        const { id } = project

        if (id)
            await window.igrpStudio.workspace.updateProject(id, project);
        else
            await window.igrpStudio.workspace.saveProject(project, workspace?.id);

        dispatch(setBasePath(project.path));

        dispatch(setConfig(project));

        navigateToNextPage(navigate, project);
    }

    const findAllProjects = async () => {
        return await window.igrpStudio.workspace.findAllProjects(workspace?.id);
    }

    return {
        workspaces,
        workspace,
        loading,
        error,
        actions: {
            createWorkspace,
            updateWorkspace,
            deleteWorkspace,
            switchWorkspace,
            refreshWorkspaces,
            validateWorkspaceName,
            getWorkspaces,
            saveOrOpenProject,
            findAllProjects,
            getRecentWorkspaces
        },
        state: {
            hasWorkspaces: workspaces.length > 0
        }
    };
};
