import React from 'react';
import {
    IGRPModalDialog,
    IGRPModalDialogContent,
    IGRPModalDialogDescription,
    IGRPModalDialogFooter,
    IGRPModalDialogHeader,
    IGRPModalDialogTitle,
    IGRPModalDialogTrigger,
} from '@igrp/igrp-framework-react-design-system';
import { Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';

interface DeleteModalProps {
    isOpen: boolean;
    onConfirm?: () => void;
    onClose: (open: boolean) => void;
    recordId?: string;
    hasTrigger?: boolean;
}

const AlertDialogDelete: React.FC<DeleteModalProps> = ({
    isOpen,
    onConfirm,
    onClose,
    hasTrigger = false,
    recordId,
}) => {
    const { t } = useTranslation();
    return (
        <IGRPModalDialog open={isOpen} onOpenChange={onClose}>
            {hasTrigger && (
                <IGRPModalDialogTrigger>
                    <IGRPButtonPrimitive
                        variant="outline"
                        size="sm"
                        className="outline  outline-red-500 text-red-500"
                    >
                        <Trash /> {t('delete')}
                    </IGRPButtonPrimitive>
                </IGRPModalDialogTrigger>
            )}
            <IGRPModalDialogContent>
                <IGRPModalDialogHeader>
                    <IGRPModalDialogTitle>
                    {t('areYouAbsolutelySure')}
                    </IGRPModalDialogTitle>
                    <IGRPModalDialogDescription>
                    {t('confirmRemoveRecord')}{' '}
                        {recordId ? recordId : ''}?
                    </IGRPModalDialogDescription>
                </IGRPModalDialogHeader>
                <IGRPModalDialogFooter>
                    <IGRPButtonPrimitive
                        variant="outline"
                        onClick={() => onClose(false)}
                    >
                        {t('cancel')}
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive
                        onClick={onConfirm}
                        className="bg-red-500"
                    >
                        {t('continue')}
                    </IGRPButtonPrimitive>
                </IGRPModalDialogFooter>
            </IGRPModalDialogContent>
        </IGRPModalDialog>
    );
};

export default AlertDialogDelete;
