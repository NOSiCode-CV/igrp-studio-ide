import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@renderer/components/ui/alert-dialog'
import { Button } from '@renderer/components/ui/button'
import { Trash } from 'lucide-react'
import type React from 'react'
import { useTranslation } from 'react-i18next'

interface DeleteModalProps {
    isOpen: boolean
    onConfirm?: () => void
    onClose: (open: boolean) => void
    recordId?: string
    hasTrigger?: boolean
}

const AlertDialogDelete: React.FC<DeleteModalProps> = ({
    isOpen,
    onConfirm,
    onClose,
    hasTrigger = false,
    recordId
}) => {
    const { t } = useTranslation()
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            {hasTrigger && (
                <AlertDialogTrigger>
                    <Button
                        variant="outline"
                        size="sm"
                        className="outline  outline-red-500 text-red-500"
                    >
                        <Trash /> {t('delete')}
                    </Button>
                </AlertDialogTrigger>
            )}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('areYouAbsolutelySure')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('confirmRemoveRecord')} {recordId ? recordId : ''}?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>{t('continue')}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default AlertDialogDelete
