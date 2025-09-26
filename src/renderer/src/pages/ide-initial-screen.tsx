import { useEffect, useState } from 'react';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import Loader from '@renderer/components/loader';
import { Container, FolderKanban, Network, Settings } from 'lucide-react';
import WelcomeHeader from './workspaces/welcome-header';
import Resources from './workspaces/resources';
import { WorkspaceDocker } from './workspaces/workspace-docker';
import { WorkspaceSettings } from './workspaces/workspace-settings';
import CreateWorkspace from './workspaces/components/create-workspace';
import { useTranslation } from 'react-i18next';
import { EmptyList } from '@renderer/components/empty-list';
import {
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsPrimitive,
    IGRPTabsTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import WorkspaceDiagram from '@renderer/components/workspace-diagram';

const IDEInitialScreen = (): React.JSX.Element => {
    const { t } = useTranslation();
    const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
    const [hasWorkspace, setHasWorkspace] = useState(false);

    const {
        workspace,
        loading: workspacesLoading,
        state: { changeStatus },
    } = useWorkspace();

    useEffect(() => {
        const checkWorkspaces = async (): Promise<void> => {
            setHasWorkspace(workspace !== null);

            setShowWorkspaceDialog(
                workspace === null || workspace === undefined
            );
        };

        checkWorkspaces();
    }, [workspace, workspacesLoading]);

    const handleCreationSuccess = (): void => {
        setShowWorkspaceDialog(false);
        setHasWorkspace(true);
    };

    if (workspacesLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="mx-auto p-6 space-y-6 flex flex-col h-full">
            {!workspace ? (
                <div className="p-3 space-y-4 border-dashed rounded-lg">
                    <EmptyList
                        title={t('workspaceNotFound')}
                        description={t('workspaceNotExist')}
                    />
                    {/*    <div className="flex gap-3">
                        <IGRPButtonPrimitive
                            onClick={handleOpenWorkspace}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <FolderOpen className="h-4 w-4" />
                            {t('openWorkspace')}
                        </IGRPButtonPrimitive>
                        <IGRPButtonPrimitive
                            onClick={() => setShowWorkspaceDialog(true)}
                            className="flex items-center gap-2"
                        >
                            <FolderKanban className="h-4 w-4" />
                            {t('addWorkspace')}
                        </IGRPButtonPrimitive>
                    </div> */}
                </div>
            ) : (
                <>
                    <WelcomeHeader />
                    <IGRPTabsPrimitive defaultValue="resources">
                        <IGRPTabsListPrimitive className="mb-3">
                            <IGRPTabsTriggerPrimitive value="resources">
                                <FolderKanban className="h-3.5 w-3.5 mr-1.5" />
                                {t('resources')}
                            </IGRPTabsTriggerPrimitive>
                            <IGRPTabsTriggerPrimitive value="diagram">
                                <Network className="h-3.5 w-3.5 mr-1.5" />
                                {t('diagram')}
                            </IGRPTabsTriggerPrimitive>
                            <IGRPTabsTriggerPrimitive value="config">
                                <Container className="h-3.5 w-3.5 mr-1.5" />
                                {t('docker')}
                            </IGRPTabsTriggerPrimitive>
                            <IGRPTabsTriggerPrimitive value="settings">
                                <Settings className="h-3.5 w-3.5 mr-1.5" />
                                {t('settings')}
                            </IGRPTabsTriggerPrimitive>
                        </IGRPTabsListPrimitive>

                        <IGRPTabsContentPrimitive
                            value="resources"
                            className="mt-0 space-y-6"
                        >
                            {hasWorkspace && workspace && <Resources />}
                        </IGRPTabsContentPrimitive>

                        <IGRPTabsContentPrimitive
                            value="diagram"
                            className="mt-0 h-[calc(100vh-var(--header-height-two)-8rem)]"
                        >
                            <WorkspaceDiagram
                                workspace={workspace}
                                changeStatus={changeStatus}
                            />
                        </IGRPTabsContentPrimitive>

                        <IGRPTabsContentPrimitive
                            value="config"
                            className="mt-0"
                        >
                            <WorkspaceDocker workspace={workspace} />
                        </IGRPTabsContentPrimitive>

                        <IGRPTabsContentPrimitive
                            value="settings"
                            className="mt-0"
                        >
                            <WorkspaceSettings workspace={workspace} />
                        </IGRPTabsContentPrimitive>
                    </IGRPTabsPrimitive>
                </>
            )}

            {showWorkspaceDialog && (
                <CreateWorkspace
                    open={showWorkspaceDialog}
                    onSuccess={handleCreationSuccess}
                />
            )}
        </div>
    );
};

export default IDEInitialScreen;
