import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../ui/alert-dialog';

interface SyncAlertProps {
    isOpen: boolean;
    onConfirm?: () => void;
    onClose: (open: boolean) => void;
    branch: string;
}

const AlertDialogSync: React.FC<SyncAlertProps> = ({
    isOpen,
    onConfirm,
    onClose,
    branch,
}) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Synchronization</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will sync your local branch <b>"{branch}"</b> with remote.
                        This action will pull changes from remote and push your
                        local changes. Make sure you've committed all your
                        changes.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onClose(false)}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-igrp"
                    >
                        Sync Changes
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default AlertDialogSync;
