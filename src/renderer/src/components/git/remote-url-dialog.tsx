import { Button } from '@renderer/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface RemoteUrlDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (url: string) => void
}

export function RemoteUrlDialog({ isOpen, onClose, onConfirm }: RemoteUrlDialogProps) {
    const { t } = useTranslation()
    const [url, setUrl] = useState('')

    const handleConfirm = () => {
        onConfirm(url)
        setUrl('')
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('addRemoteRepository')}</DialogTitle>
                    <DialogDescription>{t('enterRemoteRepositoryUrl')}</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        placeholder={t('remoteRepositoryUrlPlaceholder')}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleConfirm} disabled={!url.trim()} variant={'default'}>
                        {t('addRemote')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
