import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useTranslation } from 'react-i18next';

export const ProjectNameDialog = ({
    isOpen,
    onClose,
    defaultName,
    onConfirm,
}: {
    isOpen: boolean;
    onClose: () => void;
    defaultName: string;
    onConfirm: (projectName: string) => void;
}) => {
    const { t } = useTranslation();
    const [projectName, setProjectName] = useState(defaultName);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('enterProjectName')}</DialogTitle>
                    <DialogDescription />
                </DialogHeader>
                <div className="py-4">
                    <Input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder={t('projectNamePlaceholder')}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={() => onConfirm(projectName)}
                        disabled={!projectName.trim()}
                    >
                        {t('confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};