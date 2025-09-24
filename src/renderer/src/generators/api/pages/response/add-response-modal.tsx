import { IGRPButtonPrimitive, IGRPDialogDescriptionPrimitive, IGRPDialogHeaderPrimitive, IGRPDialogTitlePrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPDialogPrimitive,
    IGRPDialogClosePrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogFooterPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPInputText } from '@igrp/igrp-framework-react-design-system';
import { IGRPLabel } from '@igrp/igrp-framework-react-design-system';
import React, { useState } from 'react';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { httpStatusCodes } from '@renderer/constants/appConstants';
import { getStatusLabel } from '@renderer/utils';
import { useTranslation } from 'react-i18next';

interface AddResponseModalProps {
    onSave: (response: {
        name: string;
        statusCode: string;
        contentType: string;
    }) => void;
    contentTypes: any;
    isOpen: boolean;
    onClose: () => void;
}

const AddResponseModal: React.FC<AddResponseModalProps> = ({
    onSave,
    onClose,
    contentTypes,
    isOpen,
}) => {
    const { t } = useTranslation();

    const [name, setName] = useState('');
    const [statusCode, setStatusCode] = useState('');
    const [contentType, setContentType] = useState('');

    const handleSave = () => {
        if (name && statusCode && contentType) {
            onSave({ name, statusCode, contentType });
            setName('');
            setStatusCode('');
            setContentType('');
            onClose();
        }
    };

    const handleChangeCode = (value: string) => {
        setStatusCode(value);
        if (name === '') setName(getStatusLabel(value));
    };

    return (
        <IGRPDialogPrimitive open={isOpen} onOpenChange={onClose}>
            <IGRPDialogContentPrimitive>
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>{t('addResponse')}</IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSave();
                    }}
                >
                    <div className="space-y-4">
                        <div className="flex flex-col gap-3">
                            <IGRPLabel>{t('httpStatusCode')}</IGRPLabel>
                            <IGRPCombobox
                                options={httpStatusCodes}
                                value={statusCode}
                                onChange={(selected: string | string[]) => handleChangeCode(selected as string)}
                                className="w-full"
                                placeholder={t('httpStatusCodePlaceholder')}
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <IGRPLabel className="">{t('name')}</IGRPLabel>
                            <IGRPInputText
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full"
                                placeholder={t('responseNamePlaceholder')}
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <IGRPLabel className="">{t('contentType')}</IGRPLabel>
                            <IGRPCombobox
                                options={contentTypes}
                                value={contentType}
                                onChange={(value) => setContentType(value as string)}
                                className="w-full"
                            />
                        </div>

                        <IGRPDialogFooterPrimitive>
                            <IGRPDialogClosePrimitive asChild>
                                <IGRPButtonPrimitive type="button" variant="secondary">
                                    {t('close')}
                                </IGRPButtonPrimitive>
                            </IGRPDialogClosePrimitive>
                            <IGRPButtonPrimitive type="submit">{t('save')}</IGRPButtonPrimitive>
                        </IGRPDialogFooterPrimitive>
                    </div>
                </form>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    );
};

export default AddResponseModal;