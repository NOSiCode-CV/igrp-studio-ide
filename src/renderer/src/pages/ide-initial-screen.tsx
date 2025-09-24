import { useEffect, useState } from 'react';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import Loader from '@renderer/components/loader';
import { Container, FolderKanban, Network, Settings, Timer } from 'lucide-react';
import WelcomeHeader from './workspaces/welcome-header';
import Resources from './workspaces/resources';
import { WorkspaceDocker } from './workspaces/workspace-docker';
import { WorkspaceSettings } from './workspaces/workspace-settings';
import CreateWorkspace from './workspaces/components/create-workspace';
import { useTranslation } from 'react-i18next';
import { EmptyList } from '@renderer/components/empty-list';
import { IGRPTabsContentPrimitive, IGRPTabsListPrimitive, IGRPTabsPrimitive, IGRPTabsTriggerPrimitive } from '@igrp/igrp-framework-react-design-system';


const IDEInitialScreen = () => {
    const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
    const [hasWorkspace, setHasWorkspace] = useState(false);

    const {
        workspace,
        loading: workspacesLoading,
    } = useWorkspace();

    useEffect(() => {
        const checkWorkspaces = async () => {
            setHasWorkspace(workspace !== null);

            setShowWorkspaceDialog(
                workspace === null || workspace === undefined
            );
        };

        checkWorkspaces();
    }, [workspace, workspacesLoading]);

    const { t } = useTranslation();

    const handleCreationSuccess = () => {
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
                <div className="p-3">
                    <h1 className="text-lg font-medium">
                        {t('workspaceNotFound')}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t('workspaceNotExist')}
                    </p>
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

                        <IGRPTabsContentPrimitive value="diagram" className="mt-0">
                            {/* <WorkspaceDiagram workspace={workspace} /> */
                                <EmptyList
                                    title="Coming soon"
                                    description="Here you will find soon a diagram of your workspace using React Flow."
                                    className="py-12"
                                    icon={<Timer className="h-12 w-12" />}
                                />
                            }
                        </IGRPTabsContentPrimitive>

                        <IGRPTabsContentPrimitive value="config" className="mt-0">
                            <WorkspaceDocker workspace={workspace} />
                        </IGRPTabsContentPrimitive>

                        <IGRPTabsContentPrimitive value="settings" className="mt-0">
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
