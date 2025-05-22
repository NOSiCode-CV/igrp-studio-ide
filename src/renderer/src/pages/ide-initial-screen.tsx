import { useEffect, useState } from 'react';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import Loader from '@renderer/components/loader';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { Container, FolderKanban, Network, Settings } from 'lucide-react';
import WelcomeHeader from './workspaces/welcome-header';
import Resources from './workspaces/resources';
import { WorkspaceDocker } from './workspaces/workspace-docker';
import { WorkspaceSettings } from './workspaces/workspace-settings';
import CreateWorkspace from './workspaces/components/create-workspace';
import { useTranslation } from 'react-i18next';

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
                    <h1 className="text-lg font-medium">{t('workspaceNotFound')}</h1>
                    <p className="text-sm text-muted-foreground">
                    {t('workspaceNotExist')}
                    </p>
                </div>
            ) : (
                <>
                    <WelcomeHeader />
                    <Tabs defaultValue="resources">
                        <TabsList className="mb-3">
                            <TabsTrigger value="resources">
                                <FolderKanban className="h-3.5 w-3.5 mr-1.5" />
                                {t('resources')}
                            </TabsTrigger>
                            <TabsTrigger value="diagram">
                                <Network className="h-3.5 w-3.5 mr-1.5" />
                                {t('diagram')}
                            </TabsTrigger>
                            <TabsTrigger value="config">
                                <Container className="h-3.5 w-3.5 mr-1.5" />
                                {t('docker')}
                            </TabsTrigger>
                            <TabsTrigger value="settings">
                                <Settings className="h-3.5 w-3.5 mr-1.5" />
                                {t('settings')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="resources"
                            className="mt-0 space-y-6"
                        >
                            {hasWorkspace && workspace && <Resources />}
                        </TabsContent>

                        <TabsContent value="diagram" className="mt-0">
                            {/* <WorkspaceDiagram workspace={workspace} /> */}
                        </TabsContent>

                        <TabsContent value="config" className="mt-0">
                            <WorkspaceDocker workspace={workspace} />
                        </TabsContent>

                        <TabsContent value="settings" className="mt-0">
                            <WorkspaceSettings workspace={workspace} />
                        </TabsContent>
                    </Tabs>
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
