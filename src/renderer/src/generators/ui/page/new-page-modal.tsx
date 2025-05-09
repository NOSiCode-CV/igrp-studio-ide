import useToast from '@renderer/hooks/useToast';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import { ENV_TYPES, PATTERNS } from '@renderer/constants/appConstants';
import { useGit } from '@renderer/hooks/use-git';
import { PageConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { getId } from '@renderer/utils/helpers';
import { Button } from '@renderer/components/ui/button';
import { FocusEvent } from 'react';
import { TextInput } from '@renderer/generators/api/components/inputs-form';

const initialValues: PageConfig = {
    type: 'page',
    pageName: '',
    path: '',
    description: undefined,
    id: '',
};

interface NewPageModalProps {
    isOpen: boolean;
    basePath: string;
    onClose: () => void;
    onConfirm: () => void;
}

export function NewPageModal({
    isOpen,
    basePath,
    onClose,
    onConfirm,
}: NewPageModalProps) {
    const { t } = useTranslation();

    const { createGitCommit } = useGit();

    const { showErrorToast, showSuccessToast } = useToast();

    const handleConfirm = async (pageConfig: PageConfig): Promise<void> => {
        try {
            const { error } = await window.engine.createPage(
                { ...pageConfig, id: getId() },
                ENV_TYPES.NEXTJS,
                basePath
            );

            if (error) {
                showErrorToast(error);
                return;
            }

            showSuccessToast(
                `Page ${pageConfig.pageName} has been successfully added.`
            );
            // commit after creating the page
            createGitCommit(basePath, `Add page ${pageConfig.pageName}`);
            onConfirm?.();

            formik.resetForm();
        } catch (error) {
            showErrorToast(error);
        }
    };

    const validationSchema = Yup.object({
        pageName: Yup.string()
            .required(t('thisFieldRequired', { name: t('pageName') }))
            .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet')),

        path: Yup.string()
            .required(t('thisFieldRequired', { name: t('path') }))
            .matches(
                PATTERNS.VALID_SEGMENT_PATTERN,
                t(
                    'Invalid Next.js path format. Examples: /about, /[id], /[[...slug]]'
                )
            ),
    });

    const formik = useFormik<PageConfig>({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: (values, actions) => {
            actions.setSubmitting(false);
            handleConfirm(values);
        },
    });

    const handleNameBlur = async (
        e: FocusEvent<HTMLInputElement>
    ): Promise<void> => {
        formik.handleBlur(e);

        if (formik.values.path) return;
        const generatedPath = `${formik.values.pageName.toLowerCase().replace(/\s+/g, '-')}`;
        formik.setFieldValue('path', generatedPath);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogTitle>{t('createNewPage')}</DialogTitle>
                <DialogDescription>
                    {t('comonDialogtDescription', { name: 'Page' })}
                </DialogDescription>
                <form
                    className="needs-validation space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        formik.handleSubmit();
                    }}
                >
                    <div className="grid grid-cols-1 gap-4">
                        <TextInput
                            id="pageName"
                            label={t('pageName')}
                            onChange={formik.handleChange}
                            onBlur={handleNameBlur}
                            value={formik.values.pageName || ''}
                            isTouched={formik.touched.pageName}
                            error={formik.errors.pageName}
                            isRequired
                        />
                        <TextInput
                            id="path"
                            label="Path"
                            placeholder="e.g. /docs/[[...slug]] or /(auth)/dashboard"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.path || ''}
                            isTouched={formik.touched.path}
                            error={formik.errors.path}
                            isRequired
                        />
                    </div>
                    <DialogFooter className="flex justify-between">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={formik.isSubmitting}
                            color="primary"
                        >
                            {formik.isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
