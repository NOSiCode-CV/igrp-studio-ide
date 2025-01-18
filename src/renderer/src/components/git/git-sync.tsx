import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@renderer/lib/utils';
import AlertDialogSync from './alert-dialog';
import { RemoteUrlDialog } from './remote-url-dialog';
import { useState } from 'react';
import useToast from '../useToast';
import { useGit } from '@renderer/hooks/useGit';
import { useSelector } from 'react-redux';
import { RootState } from '@renderer/redux';

const SyncButton = ({ basePath }: { basePath: string }) => {
    const { syncChanges } = useGit();
    const { activeBranch } = useSelector((state: RootState) => state.git);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showRemoteDialog, setShowRemoteDialog] = useState(false);
    const { showErrorToast } = useToast();

    const handleSync = async () => {
      setIsSyncing(true);
      try {
          await syncChanges(basePath, activeBranch);
      } catch (error: any) {
          if (error.name === 'NO_REMOTE_CONFIGURED') {
              setShowRemoteDialog(true);
          } else {
              showErrorToast(error.message || 'Failed to sync changes');
          }
      } finally {
          setIsSyncing(false);
          setShowConfirm(false);
      }
    };

    const handleAddRemote = async (remoteUrl: string) => {
      try {
        await window.electron.ipcRenderer.invoke('add-git-remote', {
          projectPath: basePath,
          remoteUrl,
        });
        handleSync();
      } catch (error: any) {
        showErrorToast('Failed to add remote - ivalid url');
      }
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirm(true)}
                        disabled={isSyncing}
                    >
                        <RefreshCw
                            className={cn(
                              'h-4 w-4',
                              isSyncing && 'animate-spin'
                            )}
                        />
                        {isSyncing && 'Syncing...'}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Pull and push changes</p>
                </TooltipContent>
            </Tooltip>

            <AlertDialogSync
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleSync}
                branch={activeBranch}
            />

            <RemoteUrlDialog
                isOpen={showRemoteDialog}
                onClose={() => setShowRemoteDialog(false)}
                onConfirm={handleAddRemote}
            />
        </>
    );
};

export default SyncButton;
