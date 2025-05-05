import { useEffect, useState } from 'react';
import useToast from '@renderer/hooks/useToast';
import { HandlerResponse, IWorkspace, ProjectData } from 'src/main/types';
import { useDispatch } from 'react-redux';
import { setBasePath, setChangeStatus, setConfig, setWorkspace } from '@renderer/redux/thunks';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import yaml from 'js-yaml';
import { ProjectWorkspace, ServiceWorkspace, WorkspaceService } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { ROUTES } from '@renderer/routes/routeConstants';
import { useTranslation } from 'react-i18next';

interface RootState {
    PageBuilder: {
        workspace: IWorkspace,
        changeStatus: boolean
    };
}

const selectState = (state: RootState) => state.PageBuilder;

export const useWorkspace = () => {
    const { t } = useTranslation();
    const { showSuccessToast, showErrorToast } = useToast();
    const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
    const [loading, setLoading] = useState(true);
    const dispatch: any = useDispatch()
    const navigate = useNavigate()

    const selectProperties = createSelector(
        selectState,
        (studio) => ({
            workspace: studio.workspace,
            changeStatus: studio.changeStatus
        })
    );

    const { workspace, changeStatus } = useSelector(selectProperties);

    const [currentWorkspace, setCurrentWorkspace] = useState<IWorkspace | null>(workspace)

    const getWorkspaces = async () => {
        return await window.igrpStudio.workspace.findAllWorkspaces();
    }

    const getRecentWorkspaces = async () => {
        return await window.igrpStudio.workspace.findRecentWorkspaces(3);
    }

    const findAllProjects = async () => {
        return await window.igrpStudio.workspace.findAllProjects(workspace?.id);
    }

    const findAllServices = async () => {
        return await window.igrpStudio.docker.status(workspace.path)
    }

    const getTemplatesService = async () => {
        return await window.engine.getService(ENV_TYPES.NEXTJS).then(data => {
            return data
        });
    }

    const saveCustomWorkspaceComposeFile = async (content: string) => {
        try {
            const composeYmal = yaml.load(content);
            await window.igrpStudio.workspace.saveCustomWorkspaceComposeFile(composeYmal as Object, workspace.path);
            showSuccessToast('Update successful');
        } catch (err) {
            showErrorToast('Failed to load workspaces');
        }
    }

    const refreshWorkspaces = async () => {
        setLoading(true);
        try {
            await getWorkspaces().then((data) => {
                setWorkspaces(data);
                markWorkspaceAccessed(data)
            });
        } catch (err) {
            showErrorToast('Failed to load workspaces');
        } finally {
            setLoading(false);
        }
    };

    const createWorkspace = async (workspaceData: Omit<IWorkspace, 'id' | 'createdAt'>): Promise<IWorkspace | null> => {

        try {
            const { result, error } = await window.igrpStudio.workspace.createWorkspace({
                ...workspaceData,
                createdAt: new Date().toISOString()
            });

            if (error) {
                showErrorToast(error);
                return null;
            }

            showSuccessToast(`Workspace "${result.name}" created`);

            dispatch(setWorkspace(result))

            dispatch(setChangeStatus(true))

            return result;
        } catch (err) {
            showErrorToast(err);
            throw err;
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
        try {

            await window.igrpStudio.workspace.updateWorkspace(id, updates).then((data) => {
                if (!data) return;
                dispatch(setChangeStatus(true))
                return data;
            });

        } catch (err) {
            showErrorToast('Failed to update workspace');
            throw err;
        }
    };

    const deleteWorkspace = async (id: string) => {
        setLoading(true);
        try {
            await window.igrpStudio.workspace.deleteWorkspace(id);
            setWorkspaces(prev => prev.filter(w => w.id !== id));
            dispatch(setWorkspace(null))
            showSuccessToast('Workspace removed');
        } catch (err) {
            showErrorToast('Failed to delete workspace');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const switchWorkspace = async (upWorkspace: IWorkspace) => {
        if (!upWorkspace || currentWorkspace?.id === upWorkspace.id) return

        setCurrentWorkspace(upWorkspace)
        dispatch(setWorkspace(upWorkspace))
        updateWorkspace(upWorkspace.id, upWorkspace)
    };

    const validateWorkspaceName = (name: string, slug: string) => {
        if (!name.trim()) return 'Name is required';
        if (workspaces.some(w => w.name === name || w.slug === slug)) return 'Name already exists';
        return null;
    };

    const saveOrOpenProject = async (project: ProjectData, onSuccess?: () => Promise<void>) => {
        try {
            const { id } = project
            let response: any = {};

            if (id)
                response = await window.igrpStudio.workspace.updateProject(id, project);
            else
                response = await window.igrpStudio.workspace.createProject(workspace?.id, project);

            const { result, error } = response

            if (error) {
                showErrorToast(error);
                return
            }

            await findAllServices().then(data => {
                result.service = data.find(s => s.labels.uuid === result.id)
                return data
            })

            showSuccessToast(t('savedSuccessfully', { name: result.name }));

            dispatch(setBasePath(result.path));

            dispatch(setConfig(result));

            onSuccess?.()

            navigateToNextPage(navigate, project);

        } catch (err) {
            showErrorToast(err);
        }
    }

    const navigateToNextPage = async (navigate, appConfig: ProjectData) => {

        const navigationMap = {
            [ENV_TYPES.NEXTJS]: ROUTES.PATH_PAGE_BUILDER_UI,
            [ENV_TYPES.SPRING]: ROUTES.PATH_PAGE_BUILDER_API,
        };
        const path = navigationMap[appConfig.framework];
        if (path)
            navigate(path);
    };


    const createOrUpdateService = async (service: WorkspaceService): Promise<HandlerResponse> => {
        let result: HandlerResponse = {};
        dispatch(setChangeStatus(false));
        try {
            const { id: serviceId } = service

            const data: ServiceWorkspace = {
                id: workspace.id,
                service
            }

            if (serviceId)
                result = await window.igrpStudio.workspace.updateService(data, workspace.path)
            else
                result = await window.igrpStudio.workspace.createService(data, workspace.path)

            if (result?.error) {
                console.log(result.error)
                showErrorToast(result.error);
            } else
                showSuccessToast(t('savedSuccessfully', { name: "Service" }));

            dispatch(setChangeStatus(true));

            return result

        } catch (err) {
            showErrorToast(err);
            return { error: err as string }
        }
    }

    const configureService = async ({ config, service }: { config: any, service: WorkspaceService }): Promise<HandlerResponse> => {
        let result: any = {};
        try {

            const data: ProjectWorkspace = {
                id: workspace.id,
                service,
                config: {
                    ...config,
                    id: service.id,
                }
            }

            result = await window.igrpStudio.workspace.configureService(data, workspace.path)

            if (result?.error) {
                console.log(result.error)
                showErrorToast(result.error);
            } else
                showSuccessToast(t('savedSuccessfully', { name: "Service" }));

            dispatch(setChangeStatus(true));

            return result;

        } catch (err) {
            showErrorToast(err);
            return { error: err as string }
        }
    }

    const removeService = async (serviceId: string) => {
        try {

            dispatch(setChangeStatus(false));

            const result
                : any = await window.igrpStudio.workspace.deleteService(serviceId, workspace.path)

            if (result?.error) {
                console.log(result.error)
                showErrorToast(result.error);
            } else {
                showSuccessToast(t('deletedSuccess', { name: 'Service' }));
                dispatch(setChangeStatus(true));
            }

        } catch (err) {
            showErrorToast(err);
        }
    }

    const removeProject = async (project: ProjectData) => {
        dispatch(setChangeStatus(false));
        try {
            await window.igrpStudio.workspace.deleteProject(
                project.id,
                workspace.path
            );
            dispatch(setChangeStatus(true));
            showSuccessToast(t('deletedSuccess', { name: project.name }));
        } catch (error: unknown) {
            showErrorToast(error);
        }
    };

    useEffect(() => {
        refreshWorkspaces();
    }, []);

    return {
        workspaces,
        workspace,
        loading,
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
            getRecentWorkspaces,
            getTemplatesService,
            saveCustomWorkspaceComposeFile,
            createOrUpdateService,
            removeService,
            //findAllServices,
            configureService,
            removeProject
        },
        state: {
            hasWorkspaces: workspaces.length > 0,
            changeStatus
        }
    };
};
