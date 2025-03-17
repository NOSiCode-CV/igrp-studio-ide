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
import { ControllerConfig } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import { useTranslation } from 'react-i18next';
import { PATTERNS } from '@renderer/constants/appConstants';
import { useFormik } from 'formik';
import useToast from '@renderer/components/useToast';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { SelectInput, TextInput } from '../../components/inputs-form';

interface CreateEndpointDialogProps {
    defaultModule: string | undefined;
    basePath: string;
    pathController: string;
    endpointName: string;
    description: string;
    isOpen: boolean;
    modules: Array<any>;
    mode?: 'self' | 'formik';
    onClose: () => void;
    onConfirm?: (values: ControllerConfig) => void;
}

export function CreateEndpointDialog({
    defaultModule,
    basePath,
    pathController,
    endpointName,
    description,
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
        description: Yup.string()
            .required(t('thisFieldRequired', { name: t('description') }))
            .max(100, t('maxLengthExceeded', { max: 100 })),
    });

    const formik = useFormik({
        initialValues: {
            type: 'controller',
            name: '',
            basePath: 'api',
            actions: [],
            module: '',
            description: '',
        },
        validationSchema,
        onSubmit: (values, actions) => {
            const cValues: any = { ...values, type: 'controller' };

            if (mode === 'self') {
                handleCreateEndpoint(cValues, actions);
            } else if (mode === 'formik' && onConfirm) {
                onConfirm(cValues);
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
        formik.setFieldValue('description', description);
    }, [defaultModule, endpointName, pathController, description]);

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
                                <TextInput
                                    id="name"
                                    label={t('endpointName')}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.name}
                                    error={formik.errors.name}
                                    isTouched={formik.touched.name}
                                    isRequired
                                />
                            </div>
                            <div className="col-span-12 gap-3 flex-col flex">
                                <TextInput
                                    id="basePath"
                                    label={t('basePath')}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.basePath}
                                    error={formik.errors.basePath}
                                    isTouched={formik.touched.basePath}
                                />
                            </div>
                            <div className="col-span-12 flex flex-col gap-3">
                                <SelectInput
                                    id={'module'}
                                    label={t('moduleName')}
                                    options={modules}
                                    value={formik.values.module}
                                    error={formik.errors.module}
                                    isTouched={formik.touched.module}
                                    onChange={(value) =>
                                        formik.setFieldValue('module', value)
                                    }
                                    onBlur={(value) =>
                                        formik.setFieldValue('module', value)
                                    }
                                    isRequired
                                />
                            </div>
                            <div className="col-span-12 gap-3 flex-col flex">
                                <TextInput
                                    id="description"
                                    label={t('description')}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.description}
                                    error={formik.errors.description}
                                    isTouched={formik.touched.description}
                                    isRequired
                                />
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
