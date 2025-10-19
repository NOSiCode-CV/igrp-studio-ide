import { useEffect, useState } from 'react';
import useToast from '@renderer/hooks/useToast';
import {
    HandlerResponse,
    IWorkspace,
    ProjectData,
    ServiceInfo,
} from 'src/main/types';
import { useDispatch } from 'react-redux';
import {
    setBasePath,
    setChangeStatus,
    setConfig,
    setWorkspace,
} from '@renderer/redux/thunks';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import yaml from 'js-yaml';
import {
    ProjectWorkspace,
    ServiceWorkspace,
    WorkspaceService,
} from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { ROUTES } from '@renderer/routes/routeConstants';
import { useTranslation } from 'react-i18next';

interface RootState {
    PageBuilder: {
        workspace: IWorkspace;
        changeStatus: boolean;
    };
}

const selectState = (state: RootState) => state.PageBuilder;

interface openProjectProps {
    project: ProjectData;
    onSuccess?: () => Promise<void>;
    openProject?: boolean;
}

interface UseWorkspaceReturn {
    workspaces: IWorkspace[];
    workspace: IWorkspace;
    loading: boolean;
    actions: {
        createWorkspace: (
            workspace: Omit<IWorkspace, 'id' | 'createdAt'>
        ) => Promise<IWorkspace | null>;
        updateWorkspace: (
            id: string,
            updates: Partial<IWorkspace>
        ) => Promise<IWorkspace | null>;
        deleteWorkspace: (id: string) => Promise<void>;
        switchWorkspace: (upWorkspace: IWorkspace) => Promise<void>;
        refreshWorkspaces: () => Promise<void>;
        validateWorkspaceName: (name: string, slug: string) => string | null;
        getWorkspaces: () => Promise<IWorkspace[]>;
        saveOrOpenProject: (props: openProjectProps) => Promise<void>;
        findAllProjects: () => Promise<ProjectData[]>;
        getRecentWorkspaces: () => Promise<IWorkspace[]>;
        getTemplatesService: () => Promise<HandlerResponse>;
        saveCustomWorkspaceComposeFile: (content: string) => Promise<void>;
        createOrUpdateService: (
            service: WorkspaceService
        ) => Promise<HandlerResponse>;
        removeService: (serviceId: string) => Promise<void>;
        configureService: (props: {
            config: object;
            service: WorkspaceService;
        }) => Promise<HandlerResponse>;
        removeProject: (project: ProjectData) => Promise<void>;
        updateProject: (
            projectId: string,
            updates: Partial<ProjectData>
        ) => Promise<HandlerResponse>;
        openWorkspace: (workspacePath: string) => Promise<IWorkspace | null>;
    };
    state: {
        hasWorkspaces: boolean;
        changeStatus: boolean;
    };
}

export const useWorkspace = (): UseWorkspaceReturn => {
    const { t } = useTranslation();
    const { showSuccessToast, showErrorToast } = useToast();
    const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
    const [loading, setLoading] = useState(true);
    const dispatch: any = useDispatch();
    const navigate = useNavigate();

    const selectProperties = createSelector(selectState, (studio) => ({
        workspace: studio.workspace,
        changeStatus: studio.changeStatus,
    }));

    const { workspace, changeStatus } = useSelector(selectProperties);

    const [currentWorkspace, setCurrentWorkspace] = useState<IWorkspace | null>(
        workspace
    );

    const getWorkspaces = async (): Promise<IWorkspace[]> => {
        return await window.igrpStudio.workspace.findAllWorkspaces();
    };

    const getRecentWorkspaces = async (): Promise<IWorkspace[]> => {
        return await window.igrpStudio.workspace.findRecentWorkspaces(3);
    };

    const findAllProjects = async (): Promise<ProjectData[]> => {
        return await window.igrpStudio.workspace.findAllProjects(workspace?.id);
    };

    const findAllServices = async (): Promise<ServiceInfo[]> => {
        return await window.igrpStudio.docker.status(workspace.path);
    };

    const getTemplatesService = async (): Promise<HandlerResponse> => {
        return await window.engine.getService(ENV_TYPES.NEXTJS).then((data) => {
            return data;
        });
    };

    const saveCustomWorkspaceComposeFile = async (
        content: string
    ): Promise<void> => {
        try {
            const composeYmal = yaml.load(content);
            await window.igrpStudio.workspace.saveCustomWorkspaceComposeFile(
                composeYmal as object,
                workspace.path
            );
            showSuccessToast('Update successful');
        } catch (err) {
            console.error(err);
            showErrorToast('Failed to load workspaces');
        }
    };

    const refreshWorkspaces = async (): Promise<void> => {
        setLoading(true);
        try {
            const data = await getWorkspaces();
            setWorkspaces(data);

            if (data.length > 0) {
                await markWorkspaceAccessed(data);
            } else {
                dispatch(setWorkspace(null));
            }
        } catch (err) {
            console.error(err);
            showErrorToast('Failed to load workspaces');
        } finally {
            setLoading(false);
        }
    };

    const createWorkspace = async (
        workspaceData: Omit<IWorkspace, 'id' | 'createdAt'>
    ): Promise<IWorkspace | null> => {
        try {
            const { result, error } =
                await window.igrpStudio.workspace.createWorkspace({
                    ...workspaceData,
                });

            if (error) {
                showErrorToast(error);
                return null;
            }

            showSuccessToast(`Workspace "${result.name}" created`);

            dispatch(setWorkspace(result));

            dispatch(setChangeStatus(true));

            return result;
        } catch (err) {
            showErrorToast(err);
            throw err;
        }
    };

    const markWorkspaceAccessed = async (
        workspaces: IWorkspace[]
    ): Promise<void> => {
        if (workspaces.length === 0) {
            return;
        }
        const workspace = [...workspaces].sort((a, b) => {
            const aLastAccess = new Date(a.updatedAt || a.createdAt);
            const bLastAccess = new Date(b.updatedAt || b.createdAt);
            return bLastAccess.getTime() - aLastAccess.getTime();
        })[0];
        switchWorkspace(workspace).catch((error) => {
            console.error('Failed to switch workspace in background:', error);
        });
    };

    const updateWorkspace = async (
        id: string,
        updates: Partial<IWorkspace>
    ): Promise<IWorkspace | null> => {
        try {
            const data = await window.igrpStudio.workspace.updateWorkspace(
                id,
                updates
            );
            if (!data) return null;
            dispatch(setChangeStatus(true));
            return data;
        } catch (err) {
            showErrorToast('Failed to update workspace');
            throw err;
        }
    };

    const deleteWorkspace = async (id: string): Promise<void> => {
        setLoading(true);
        try {
            await window.igrpStudio.workspace.deleteWorkspace(id);
            setWorkspaces((prev) => prev.filter((w) => w.id !== id));
            dispatch(setWorkspace(null));
            showSuccessToast('Workspace removed');
        } catch (err) {
            console.error(err);
            showErrorToast('Failed to delete workspace');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const switchWorkspace = async (upWorkspace: IWorkspace): Promise<void> => {
        if (!upWorkspace || currentWorkspace?.id === upWorkspace.id) {
            return;
        }

        setCurrentWorkspace(upWorkspace);
        dispatch(setWorkspace(upWorkspace));
        await updateWorkspace(upWorkspace.id, upWorkspace);
    };

    const validateWorkspaceName = (
        name: string,
        slug: string
    ): string | null => {
        if (!name.trim()) return 'Name is required';
        if (workspaces.some((w) => w.name === name || w.slug === slug))
            return 'Name already exists';
        return null;
    };

    const saveOrOpenProject = async ({
        project,
        openProject,
        onSuccess,
    }: openProjectProps): Promise<void> => {
        try {
            const { id } = project;
            let response: HandlerResponse = {};
            setLoading(true);

            console.log('project to save', project);

            if (id)
                response = await window.igrpStudio.workspace.updateProject(
                    id,
                    project
                );
            else
                response = await window.igrpStudio.workspace.createProject(
                    workspace?.id,
                    project
                );

            const { result, error } = response;

            if (error) {
                showErrorToast(error);
                console.error(error);
                return;
            }

            await findAllServices().then((data) => {
                result.service = data.find((s) => s.labels.uuid === result.id);
                return data;
            });

            if (!openProject)
                showSuccessToast(t('savedSuccessfully', { name: result.name }));

            dispatch(setBasePath(result.path));

            dispatch(setConfig(result));

            onSuccess?.();

            navigateToNextPage(navigate, project);
        } catch (err) {
            console.error('Error saving project', err);
            showErrorToast(err);
        } finally {
            setLoading(false);
        }
    };

    const navigateToNextPage = async (
        navigate: NavigateFunction,
        appConfig: ProjectData
    ): Promise<void> => {
        const navigationMap = {
            [ENV_TYPES.NEXTJS]: ROUTES.PATH_PAGE_BUILDER_UI,
            [ENV_TYPES.SPRING]: ROUTES.PATH_PAGE_BUILDER_API,
        };
        const path =
            navigationMap[appConfig.framework as keyof typeof navigationMap];
        if (path) navigate(path);
    };

    const createOrUpdateService = async (
        service: WorkspaceService
    ): Promise<HandlerResponse> => {
        let result: HandlerResponse = {};
        dispatch(setChangeStatus(false));
        try {
            const { id: serviceId } = service;

            const data: ServiceWorkspace = {
                id: workspace.id,
                service,
            };

            if (serviceId)
                result = await window.igrpStudio.workspace.updateService(
                    data,
                    workspace.path
                );
            else
                result = await window.igrpStudio.workspace.createService(
                    data,
                    workspace.path
                );

            if (result?.error) {
                console.error(result.error);
                showErrorToast(result.error);
            } else
                showSuccessToast(t('savedSuccessfully', { name: 'Service' }));

            dispatch(setChangeStatus(true));

            return result;
        } catch (err) {
            showErrorToast(err);
            return { error: err as string };
        }
    };

    const configureService = async ({
        config,
        service,
    }: {
        config: object;
        service: WorkspaceService;
    }): Promise<HandlerResponse> => {
        let result: HandlerResponse = {};
        try {
            const data: ProjectWorkspace = {
                id: workspace.id,
                service,
                config: {
                    ...config,
                    id: service.id,
                },
            };

            result = await window.igrpStudio.workspace.configureService(
                data,
                workspace.path
            );

            if (result?.error) {
                console.error(result.error);
                showErrorToast(result.error);
            } else
                showSuccessToast(t('savedSuccessfully', { name: 'Service' }));

            dispatch(setChangeStatus(true));

            return result;
        } catch (err) {
            showErrorToast(err);
            return { error: err as string };
        }
    };

    const removeService = async (serviceId: string): Promise<void> => {
        try {
            dispatch(setChangeStatus(false));

            const result: HandlerResponse =
                await window.igrpStudio.workspace.deleteService(
                    serviceId,
                    workspace.path
                );

            if (result?.error) {
                console.error(result.error);
                showErrorToast(result.error);
            } else {
                showSuccessToast(t('deletedSuccess', { name: 'Service' }));
                dispatch(setChangeStatus(true));
            }
        } catch (err) {
            showErrorToast(err);
        }
    };

    const removeProject = async (project: ProjectData): Promise<void> => {
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

    const updateProject = async (
        projectId: string,
        updates: Partial<ProjectData>
    ): Promise<HandlerResponse> => {
        try {
            const result = await window.igrpStudio.workspace.updateProject(
                projectId,
                updates
            );

            showSuccessToast(
                t('updatedSuccessfully', { name: updates.name || 'Project' })
            );
            dispatch(setChangeStatus(true));
            return result;
        } catch (error: unknown) {
            showErrorToast(error);
            return { error: error as string };
        }
    };

    const openWorkspace = async (
        workspacePath: string
    ): Promise<IWorkspace | null> => {
        try {
            // Check if the workspace path exists and contains workspace files
            const result =
                await window.igrpStudio.workspace.openWorkspace(workspacePath);

            if (result.error) {
                showErrorToast(result.error);
                return null;
            }

            showSuccessToast(
                t('workspaceOpenedSuccessfully', {
                    name: result.result?.name || 'Workspace',
                })
            );
            dispatch(setChangeStatus(true));

            // Refresh workspaces to include the newly opened one
            await refreshWorkspaces();

            return result.result;
        } catch (error: unknown) {
            console.error(error);
            showErrorToast(error);
            return null;
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
            configureService,
            removeProject,
            updateProject,
            openWorkspace,
        },
        state: {
            hasWorkspaces: workspaces.length > 0,
            changeStatus,
        },
    };
};
