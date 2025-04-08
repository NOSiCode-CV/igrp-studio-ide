import { useEffect, useState } from 'react';
import WelcomeHeader from './components/welcome-header';
import CreateWorkspace from './components/create-workspace';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import useToast from '@renderer/components/useToast';
import Loader from '@renderer/components/loader';
import { IWorkspace } from 'src/main/types';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { Container, FolderKanban, Network, Settings } from 'lucide-react';
import Resources from './components/Resources';
import { WorkspaceSettings } from './components/workspace-settings';
import { WorkspaceDocker } from './components/workspace-docker';

const IDEInitialScreen = () => {
    const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
    const [hasWorkspace, setHasWorkspace] = useState(false);
    const { showSuccessToast } = useToast();

    const {
        workspace,
        loading: workspacesLoading,
        actions: { refreshWorkspaces },
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

    useEffect(() => {
        refreshWorkspaces();
    }, []);

    const handleCreationSuccess = (newWorkspace: IWorkspace) => {
        setShowWorkspaceDialog(false);
        setHasWorkspace(true);
        refreshWorkspaces();
        showSuccessToast(`Workspace "${newWorkspace.name}" created`);
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
                    <h1 className="text-lg font-medium">Workspace not found</h1>
                    <p className="text-sm text-muted-foreground">
                        The workspace you're looking for doesn't exist.
                    </p>
                </div>
            ) : (
                <>
                    <WelcomeHeader />
                    <Tabs defaultValue="resources">
                        <TabsList className="mb-3">
                            <TabsTrigger value="resources">
                                <FolderKanban className="h-3.5 w-3.5 mr-1.5" />
                                Resources
                            </TabsTrigger>
                            <TabsTrigger value="diagram">
                                <Network className="h-3.5 w-3.5 mr-1.5" />
                                Diagram
                            </TabsTrigger>
                            <TabsTrigger value="config">
                                <Container className="h-3.5 w-3.5 mr-1.5" />
                                Docker
                            </TabsTrigger>
                            <TabsTrigger value="settings">
                                <Settings className="h-3.5 w-3.5 mr-1.5" />
                                Settings
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="resources"
                            className="mt-0 space-y-6"
                        >
                            {hasWorkspace && workspace && <Resources />}
                        </TabsContent>

                        <TabsContent value="diagram" className="mt-0">
                            {/*  <ProjectDiagram workspace={workspaceWithServices} /> */}
                        </TabsContent>

                        <TabsContent value="config" className="mt-0">
                            <WorkspaceDocker
                                workspace={workspace}
                            />
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
