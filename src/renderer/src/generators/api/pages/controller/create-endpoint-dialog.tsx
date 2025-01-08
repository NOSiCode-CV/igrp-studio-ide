'use client';

import * as Yup from 'yup';

import { Button } from '@renderer/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { ControllerConfig } from '@igrp/spring-engine/dist/interfaces/types';
import { useTranslation } from 'react-i18next';
import { PATTERNS } from '@renderer/constants/appConstants';
import { useFormik } from 'formik';
import useToast from '@renderer/components/useToast';
import { cn } from '@renderer/lib/utils';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useDispatch } from 'react-redux';
import { Combobox } from '@igrp/igrp-design-system';
import { useEffect } from 'react';

interface CreateEndpointDialogProps {
    defaultModule: string | undefined;
    basePath: string;
    isOpen: boolean;
    modules: Array<any>;
    mode?: 'self' | 'formik'; // 'self' = submits its own data, 'formik' = updates Formik
    onClose: () => void;
    onConfirm?: (values: ControllerConfig) => void; // Callback for Formik updates
}

export function CreateEndpointDialog({
    defaultModule,
    basePath,
    isOpen,
    onClose,
    modules,
    mode = 'self',
    onConfirm,
}: CreateEndpointDialogProps) {
    const { t } = useTranslation();

    const dispatch: any = useDispatch();

    const { showErrorToast, showSuccessToast } = useToast();

    const validationSchema = Yup.object({
        name: Yup.string()
            .required(t('thisFieldRequired', { name: 'Name' }))
            .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet'))
            .max(20, t('maxLengthExceeded', { max: 20 })),
        module: Yup.string().required(
            t('thisFieldRequired', { name: 'Module' })
        ),
    });

    const formik = useFormik({
        initialValues: {
            type: 'controller',
            name: '',
            basePath: '',
            actions: [],
            module: defaultModule,
        },
        validationSchema,
        onSubmit: (values, actions) => {
            const cValues: ControllerConfig = { ...values, type: 'controller' };

            if (mode === 'self') {
                handleCreateEndpoint(cValues, actions);
            } else if (mode === 'formik' && onConfirm) {
                onConfirm(cValues); // Pass values to parent Formik
                actions.setSubmitting(false);
                formik.resetForm();
                onClose();
            }
        },
    });

    const handleCreateEndpoint = async (
        values: ControllerConfig,
        actions: any
    ) => {
        try {
            const { error } = await window.api.createController(
                values,
                basePath
            );
            if (error) {
                showErrorToast(error);
                actions.setSubmitting(false);
                return;
            }
            dispatch(onSetChangeStatus(true));
            showSuccessToast(`Endpoint ${values.name} successfully created.`);
            actions.setSubmitting(false);
            formik.resetForm();
            onClose();
        } catch (error) {
            showErrorToast(error);
            actions.setSubmitting(false);
        }
    };

    useEffect(() => {
        formik.setFieldValue('module', defaultModule);
    }, [defaultModule]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Endpoint</DialogTitle>
                    <DialogDescription>
                        {t('endpointDescription')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={formik.handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <div className="col-span-12 space-y-3">
                                <Label htmlFor="name" className="text-right">
                                    Endpoint Name
                                </Label>
                                <Input
                                    id="name"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.name || ''}
                                    className={cn(
                                        formik.touched.name &&
                                            formik.errors.name
                                            ? 'border-red-500'
                                            : ''
                                    )}
                                />
                                {formik.errors.name && (
                                    <p className="text-sm text-red-600">
                                        {formik.errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="col-span-12 space-y-3">
                                <Label
                                    htmlFor="basePath"
                                    className="text-right"
                                >
                                    Base path
                                </Label>
                                <Input
                                    id="basePath"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.basePath || ''}
                                    className={cn(
                                        formik.touched.basePath &&
                                            formik.errors.basePath
                                            ? 'border-red-500'
                                            : ''
                                    )}
                                />
                                {formik.errors.basePath && (
                                    <p className="text-sm text-red-600">
                                        {formik.errors.basePath}
                                    </p>
                                )}
                            </div>
                            <div className="col-span-12 space-y-3">
                                <Label htmlFor="module" className="text-right">
                                    Module Name
                                </Label>
                                <Combobox
                                    name="module"
                                    options={modules}
                                    value={
                                        formik.values.module || defaultModule
                                    }
                                    onChange={(value) =>
                                        formik.setFieldValue('module', value)
                                    }
                                    className={cn(
                                        'w-full',
                                        formik.touched.module &&
                                            formik.errors.module
                                            ? 'border-red-500'
                                            : ''
                                    )}
                                />
                                {formik.errors.module && (
                                    <p className="text-sm text-red-600">
                                        {formik.errors.module}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
