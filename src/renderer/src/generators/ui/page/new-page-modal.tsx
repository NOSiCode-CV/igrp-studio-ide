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
import { getId } from '@renderer/utils';
import { Button } from '@renderer/components/ui/button';
import { FocusEvent } from 'react';
import {
    CheckboxInput,
    TextInput,
} from '@renderer/generators/api/components/inputs-form';
import { camelCase } from 'lodash-es';
import { PageDefinition } from './list-pages';

const initialValues: PageConfig = {
    type: 'page',
    pageName: '',
    path: '',
    description: undefined,
    forceDynamic: false,
    id: '',
    types: [],
    states: [],
    functions: [],
    parentName: undefined,
};

interface NewPageModalProps {
    isOpen: boolean;
    basePath: string;
    pageEditing?: PageDefinition;
    currentComponent?: PageDefinition;
    onClose: () => void;
    onConfirm: () => void;
}

export function NewPageModal({
    isOpen,
    basePath,
    onClose,
    onConfirm,
    pageEditing,
    currentComponent,
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
        description: Yup.string().required(
            t('thisFieldRequired', { name: t('pageTitle') })
        ),
        pageName: Yup.string()
            .required(t('thisFieldRequired', { name: t('pageName') }))
            .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet')),

        path: Yup.string()
            .required(t('thisFieldRequired', { name: t('path') }))
            .matches(
                PATTERNS.VALID_SEGMENT_PATTERN,
                'Invalid Next.js path format. Examples: /about, /[id], /[[...slug]]'
            ),
    });

    const formik = useFormik<PageConfig>({
        enableReinitialize: true,
        initialValues: { ...initialValues, ...currentComponent?.content },
        validationSchema,
        onSubmit: (values, actions) => {
            const newValues = pageEditing
                ? {
                      ...values,
                      path: `${pageEditing?.content?.path}/${values.path}`,
                      parentName: pageEditing?.content.pageName,
                  }
                : values;

            console.log(newValues);

            actions.setSubmitting(false);
            handleConfirm(newValues);
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

    const handleDescriptionBlur = async (
        e: FocusEvent<HTMLInputElement>
    ): Promise<void> => {
        formik.handleBlur(e);

        if (formik.values.pageName) return;
        const generatedPath = `${camelCase(e.target.value)}`;
        formik.setFieldValue('pageName', generatedPath);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogTitle>
                    {pageEditing ? t('createSubNewPage') : t('createNewPage')}
                </DialogTitle>
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
                            id="description"
                            label={t('pageTitle')}
                            onChange={formik.handleChange}
                            onBlur={handleDescriptionBlur}
                            value={formik.values.description || ''}
                            isTouched={formik.touched.description}
                            error={formik.errors.description}
                            placeholder="Todo List"
                            isRequired
                        />
                        <TextInput
                            id="pageName"
                            label={t('pageName')}
                            onChange={formik.handleChange}
                            onBlur={handleNameBlur}
                            value={formik.values.pageName || ''}
                            isTouched={formik.touched.pageName}
                            error={formik.errors.pageName}
                            placeholder="TodoList"
                            isRequired
                        />
                        <TextInput
                            id="path"
                            label="Path"
                            placeholder="e.g. docs/[[...slug]] or /(auth)/todo-list"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.path || ''}
                            isTouched={formik.touched.path}
                            error={formik.errors.path}
                            isRequired
                        />

                        <CheckboxInput
                            id="forceDynamic"
                            label={t('forceDynamic')}
                            onChange={formik.handleChange}
                            value={formik.values.forceDynamic}
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
                            {formik.isSubmitting ? t('saving') : t('save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
