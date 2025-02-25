import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { Button } from '@renderer/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
} from '@renderer/components/ui/dialog';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import React, { useState } from 'react';
import { Combobox } from '@igrp/igrp-framework-react-design-system';
import { httpStatusCodes } from '@renderer/constants/appConstants';
import { getStatusLabel } from '@renderer/utils/helpers';
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

    const handleChangeCode = (value) => {
        setStatusCode(value);
        if (name === '') setName(getStatusLabel(value));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('addResponse')}</DialogTitle>
                    <DialogDescription />
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSave();
                    }}
                >
                    <div className="space-y-4">
                        <div className="flex flex-col gap-3">
                            <Label className="">{t('httpStatusCode')}</Label>
                            <Combobox
                                options={httpStatusCodes}
                                name="statusCode"
                                value={statusCode}
                                onChange={(value) => handleChangeCode(value)}
                                className="w-full"
                                placeholder={t('httpStatusCodePlaceholder')}
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <Label className="">{t('name')}</Label>
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full"
                                placeholder={t('responseNamePlaceholder')}
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <Label className="">{t('contentType')}</Label>
                            <Combobox
                                name={'contentType'}
                                options={contentTypes}
                                value={contentType}
                                onChange={(value) => setContentType(value)}
                                className="w-full"
                            />
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    {t('close')}
                                </Button>
                            </DialogClose>
                            <Button type="submit">{t('save')}</Button>
                        </DialogFooter>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddResponseModal;