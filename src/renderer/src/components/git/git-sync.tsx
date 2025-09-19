import { RefreshCw } from 'lucide-react';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@renderer/lib/utils';
import AlertDialogSync from './alert-dialog';
import { RemoteUrlDialog } from './remote-url-dialog';
import { useState } from 'react';
import useToast from '../../hooks/useToast';
import { useGit } from '@renderer/hooks/use-git';
import { useSelector } from 'react-redux';
import { RootState } from '@renderer/redux';
import { useTranslation } from 'react-i18next';

const SyncButton = ({ basePath }: { basePath: string }) => {
    const { t } = useTranslation();
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
              showErrorToast(error.message || t('failedSyncChanges'));
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
        showErrorToast(t('failedAddRemoteInvalidUrl'));
      }
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <IGRPButtonPrimitive
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
                        {isSyncing && t('syncing')}
                    </IGRPButtonPrimitive>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('pullAndPushChanges')}</p>
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