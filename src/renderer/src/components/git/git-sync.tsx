import { Button } from '@renderer/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { useGit } from '@renderer/hooks/use-git'
import { cn } from '@renderer/lib/utils'
import type { RootState } from '@renderer/redux'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import useToast from '../../hooks/useToast'
import AlertDialogSync from './alert-dialog'
import { RemoteUrlDialog } from './remote-url-dialog'

const SyncButton = ({
    basePath,
    buttonClassName
}: {
    basePath: string
    buttonClassName?: string
}) => {
    const { t } = useTranslation()
    const { syncChanges } = useGit()
    const { activeBranch } = useSelector((state: RootState) => state.git)
    const [isSyncing, setIsSyncing] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [showRemoteDialog, setShowRemoteDialog] = useState(false)
    const { showErrorToast } = useToast()

    const handleSync = async () => {
        setIsSyncing(true)
        try {
            await syncChanges(basePath, activeBranch)
        } catch (error: any) {
            if (error.name === 'NO_REMOTE_CONFIGURED') {
                setShowRemoteDialog(true)
            } else {
                showErrorToast(error.message || t('failedSyncChanges'))
            }
        } finally {
            setIsSyncing(false)
            setShowConfirm(false)
        }
    }

    const handleAddRemote = async (remoteUrl: string) => {
        try {
            await window.electron.ipcRenderer.invoke('add-git-remote', {
                projectPath: basePath,
                remoteUrl
            })
            handleSync()
        } catch (error: any) {
            showErrorToast(t('failedAddRemoteInvalidUrl'))
        }
    }

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'h-auto w-auto shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                            buttonClassName
                        )}
                        onClick={() => setShowConfirm(true)}
                        disabled={isSyncing}
                        aria-label={t('pullAndPushChanges')}
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
                        <span className="sr-only">
                            {isSyncing ? t('syncing') : t('pullAndPushChanges')}
                        </span>
                    </Button>
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
    )
}

export default SyncButton
