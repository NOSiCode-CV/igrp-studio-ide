import { useEffect, useState } from 'react';
import RecentsProjects from './components/recents-projects';
import WelcomeHeader from './components/welcome-header';
import CreateWorkspace from './components/create-workspace';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import useToast from '@renderer/components/useToast';
import Loader from '@renderer/components/loader';
import { IWorkspace } from 'src/main/types';

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
        <div className="max-w-6xl mx-auto p-6 space-y-6 mb-10">
            {showWorkspaceDialog && (
                <CreateWorkspace
                    open={showWorkspaceDialog}
                    onSuccess={handleCreationSuccess}
                />
            )}

            {hasWorkspace && workspace && (
                <>
                    <WelcomeHeader />
                    <RecentsProjects />
                </>
            )}
        </div>
    );
};

export default IDEInitialScreen;
