import { Button } from '@renderer/components/ui/button'
import {
    IGRPModalDialog,
    IGRPModalDialogContent,
    IGRPModalDialogDescription,
    IGRPModalDialogFooter,
    IGRPModalDialogHeader,
    IGRPModalDialogTitle
} from '@igrp/igrp-framework-react-design-system'
import { useTranslation } from 'react-i18next'

interface SyncAlertProps {
    isOpen: boolean
    onConfirm?: () => void
    onClose: (open: boolean) => void
    branch: string
}

const AlertDialogSync: React.FC<SyncAlertProps> = ({ isOpen, onConfirm, onClose, branch }) => {
    const { t } = useTranslation()

    return (
        <IGRPModalDialog open={isOpen} onOpenChange={onClose}>
            <IGRPModalDialogContent>
                <IGRPModalDialogHeader>
                    <IGRPModalDialogTitle>{t('confirmSynchronization')}</IGRPModalDialogTitle>
                    <IGRPModalDialogDescription>
                        {t('syncDescription', { branch })}
                    </IGRPModalDialogDescription>
                </IGRPModalDialogHeader>
                <IGRPModalDialogFooter>
                    <Button variant="outline" onClick={() => onClose(false)}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={onConfirm}>{t('syncChanges')}</Button>
                </IGRPModalDialogFooter>
            </IGRPModalDialogContent>
        </IGRPModalDialog>
    )
}

export default AlertDialogSync
