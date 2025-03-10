import * as Yup from 'yup';

import { Button } from '@renderer/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@renderer/components/ui/dialog';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { ControllerConfig } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import { useTranslation } from 'react-i18next';
import { PATTERNS } from '@renderer/constants/appConstants';
import { useFormik } from 'formik';
import useToast from '@renderer/components/useToast';
import { cn } from '@renderer/lib/utils';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useDispatch } from 'react-redux';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { useEffect } from 'react';
import { LabelRequired } from '@renderer/components/required';

interface CreateEndpointDialogProps {
    defaultModule: string | undefined;
    basePath: string;
    pathController: string;
    endpointName: string;
    isOpen: boolean;
    modules: Array<any>;
    mode?: 'self' | 'formik'; // 'self' = submits its own data, 'formik' = updates Formik
    onClose: () => void;
    onConfirm?: (values: ControllerConfig) => void; // Callback for Formik updates
}

export function CreateEndpointDialog({
    defaultModule,
    basePath,
    pathController,
    endpointName,
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
            .required(t('thisFieldRequired', { name: t('endpointName') }))
            .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccept'))
            .max(20, t('maxLengthExceeded', { max: 20 })),
        module: Yup.string().required(
            t('thisFieldRequired', { name: t('module') })
        ),
    });

    const formik = useFormik({
        initialValues: {
            type: 'controller',
            name: '',
            basePath:  'api',
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
            showSuccessToast(
                t('endpointCreatedSuccess', { name: values.name })
            );
            actions.setSubmitting(false);
            formik.resetForm();
            onClose();
        } catch (error) {
            showErrorToast(error);
            actions.setSubmitting(false);
        }
    };

    useEffect(() => {
        formik.setFieldValue('name', endpointName);
        formik.setFieldValue('basePath', pathController);
        formik.setFieldValue('module', defaultModule);
    }, [defaultModule, endpointName, pathController]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('createNewEndpoint')}</DialogTitle>
                    <DialogDescription>
                        {t('endpointDescription')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={formik.handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 items-center gap-4">
                            <div className="col-span-12 flex flex-col gap-3">
                                <LabelRequired>
                                    {t('endpointName')}
                                </LabelRequired>
                                <Input
                                    id="name"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.name}
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
                            <div className="col-span-12 gap-3 flex-col flex">
                                <Label
                                    htmlFor="basePath"
                                >
                                    {t('basePath')}
                                </Label>
                                <Input
                                    id="basePath"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.basePath || pathController}
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
                            <div className="col-span-12 flex flex-col gap-3">
                                <LabelRequired>{t('moduleName')}</LabelRequired>
                                <IGRPCombobox
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
                        <Button type="submit">{t('save')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
