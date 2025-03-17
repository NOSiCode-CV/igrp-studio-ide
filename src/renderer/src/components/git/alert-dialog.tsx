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
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('confirmSynchronization')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('syncDescription', {
                            branch: <b>"{branch}"</b>
                        })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onClose(false)}>
                        {t('cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-igrp"
                    >
                        {t('syncChanges')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default AlertDialogSync;