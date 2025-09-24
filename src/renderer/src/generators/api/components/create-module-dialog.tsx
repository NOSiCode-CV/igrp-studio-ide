'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import * as Yup from 'yup';

import { IGRPButtonPrimitive, IGRPDialogContentPrimitive, IGRPDialogDescriptionPrimitive, IGRPDialogFooterPrimitive, IGRPDialogHeaderPrimitive, IGRPDialogPrimitive, IGRPDialogTitlePrimitive, IGRPDialogTriggerPrimitive, IGRPInputPrimitive, IGRPTooltipContentPrimitive, IGRPTooltipPrimitive, IGRPTooltipProviderPrimitive, IGRPTooltipTriggerPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system';
import { ModuleConfig } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import { useTranslation } from 'react-i18next';
import { ENV_TYPES, PATTERNS } from '@renderer/constants/appConstants';
import { useFormik } from 'formik';
import useToast from '@renderer/hooks/useToast';
import { cn } from '@renderer/lib/utils';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useDispatch } from 'react-redux';
import { useGit } from '@renderer/hooks/use-git';

interface CreateModuleDialogProps {
    basePath: string;
}

const initialValues: ModuleConfig = {
    type: 'module',
    name: '',
};

export function CreateModuleDialog({ basePath }: CreateModuleDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const { t } = useTranslation();
    const { createGitCommit } = useGit();

    const dispatch: any = useDispatch();

    const { showErrorToast, showSuccessToast } = useToast();

    const validationSchema = Yup.object({
        name: Yup.string()
            .required(t('thisFieldRequired', { name: 'Name' }))
            .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet'))
            .max(20, t('maxLengthExceeded', { max: 20 })),
    });

    const formik: any = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: (_values, actions) => {
            actions.setSubmitting(false);
            handleCreateModule();
        },
    });

    const handleCreateModule = () => {
        onCreateModule();
        formik.resetForm();
        setIsOpen(false);
    };

    const onCreateModule = async (): Promise<void> => {
        try {
            const { error } = await window.engine.createModule(
                formik.values,
                ENV_TYPES.SPRING,
                basePath
            );

            if (error) {
                showErrorToast(error);
                return;
            }

            formik.resetForm();

             createGitCommit(basePath, `${t("addModule")} ${formik.values.name}`);

            dispatch(onSetChangeStatus(true));

            showSuccessToast(
                t('moduleAdded', { name: formik.values.name })
               // `Module ${formik.values.name} have been successfully added.`
            );
        } catch (error) {
            showErrorToast(error);
        }
    };

    return (
        <IGRPTooltipProviderPrimitive>
            <IGRPDialogPrimitive open={isOpen} onOpenChange={setIsOpen}>
                <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                        <IGRPDialogTriggerPrimitive asChild>
                            <IGRPButtonPrimitive
                                size="icon"
                                className="ml-auto rounded-md shadow-md hover:shadow-lg transition-shadow duration-200"
                            >
                                <Plus className="h-4 w-4" />
                            </IGRPButtonPrimitive>
                        </IGRPDialogTriggerPrimitive>
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                        <p>{t('createNewModule')}</p>
                    </IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>
                <IGRPDialogContentPrimitive className="max-w-[425px]">
                    <IGRPDialogHeaderPrimitive>
                        <IGRPDialogTitlePrimitive>{t('createNewModule')}</IGRPDialogTitlePrimitive>
                        <IGRPDialogDescriptionPrimitive>
                            {t('dialogDescription')}
                        </IGRPDialogDescriptionPrimitive>
                    </IGRPDialogHeaderPrimitive>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            formik.handleSubmit();
                        }}
                    >
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <IGRPLabelPrimitive htmlFor="name" className="text-right">
                                {t('moduleName')}
                                </IGRPLabelPrimitive>
                                <div className="col-span-3">
                                    <IGRPInputPrimitive
                                        id="name"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.name || ''}
                                        className={cn(
                                            '',
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
                            </div>
                        </div>
                        <IGRPDialogFooterPrimitive>
                            <IGRPButtonPrimitive type="submit">{t('saveModule')}</IGRPButtonPrimitive>
                        </IGRPDialogFooterPrimitive>
                    </form>
                </IGRPDialogContentPrimitive>
            </IGRPDialogPrimitive>
        </IGRPTooltipProviderPrimitive>
    );
}
