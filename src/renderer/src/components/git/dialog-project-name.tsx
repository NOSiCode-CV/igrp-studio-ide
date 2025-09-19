import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
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
                    <IGRPButtonPrimitive variant="outline" onClick={onClose}>
                        {t('cancel')}
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive
                        onClick={() => onConfirm(projectName)}
                        disabled={!projectName.trim()}
                    >
                        {t('confirm')}
                    </IGRPButtonPrimitive>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};