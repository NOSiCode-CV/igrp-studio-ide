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
import { FocusEvent, useEffect, useState } from 'react';
import {
    CheckboxInput,
    TextInput,
} from '@renderer/generators/api/components/inputs-form';
import { camelCase } from 'lodash-es';
import { PageDefinition } from './page-manager';
import { getDynamicSegments } from '@renderer/generators/ui/components/settings/properties/route-parser';

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
    args: [],
} as any;

interface CreatePageModalProps {
    isOpen: boolean;
    basePath: string;
    pageEditing?: PageDefinition;
    currentComponent?: PageDefinition;
    onClose: () => void;
    onConfirm: () => void;
}

export function CreatePageModal({
    isOpen,
    basePath,
    onClose,
    onConfirm,
    pageEditing,
    currentComponent,
}: CreatePageModalProps) {
    const { t } = useTranslation();

    const { createGitCommit } = useGit();

    const { showErrorToast, showSuccessToast } = useToast();

    const [formInitialValues, setFormInitialValues] =
        useState<PageConfig>(initialValues);

    useEffect(() => {
        const loadCurrentData = async () => {
            if (currentComponent?.path) {
                try {
                    const currentData = await window.api.getJsonContent(
                        currentComponent.path
                    );
                    setFormInitialValues({
                        ...initialValues,
                        ...currentData,
                    });
                } catch (error) {
                    console.warn('Failed to load current data:', error);
                    // Fallback to currentComponent.content if API call fails
                    setFormInitialValues({
                        ...initialValues,
                        ...currentComponent.content,
                    });
                }
            } else if (currentComponent?.content) {
                setFormInitialValues({
                    ...initialValues,
                    ...currentComponent.content,
                });
            } else {
                setFormInitialValues(initialValues);
            }
        };

        loadCurrentData();
    }, [currentComponent, isOpen]);

    const handleConfirm = async (pageConfig: PageConfig): Promise<void> => {
        try {
            // Auto-generate args based on path
            const dynamicSegments = getDynamicSegments(pageConfig.path);
            if (dynamicSegments.length > 0) {
                const generatedArgs = dynamicSegments.map((segment) => ({
                    id: getId(),
                    type: 'string', // Default type for dynamic segments
                    name: segment.name,
                    isList: false,
                    isOptional: segment.type === 'optional-catch-all',
                    isInterface: false,
                    isFunction: false,
                    isState: false,
                }));

                // Add args to pageConfig (we'll need to extend the interface)
                (pageConfig as any).args = generatedArgs;
            }

            const { error } = await window.engine.createPage(
                { ...pageConfig },
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
        initialValues: formInitialValues,
        validationSchema,
        onSubmit: async (values, actions) => {
            const newValues = pageEditing
                ? {
                      ...values,
                      path: `${pageEditing?.content?.path}/${values.path}`,
                      parentName: pageEditing?.content.pageName,
                  }
                : values;

            newValues.id = newValues.id || getId();

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

    // Auto-generate args when path changes
    useEffect(() => {
        const path = formik.values.path;
        if (path) {
            const dynamicSegments = getDynamicSegments(path);
            if (dynamicSegments.length > 0) {
                const generatedArgs = dynamicSegments.map((segment) => ({
                    id: getId(),
                    type: 'string', // Default type for dynamic segments
                    name: segment.name,
                    isList: false,
                    isOptional: segment.type === 'optional-catch-all',
                    isInterface: false,
                    isFunction: false,
                    isState: false,
                }));

                // Only update if args are different from current ones
                const currentArgNames =
                    (formik.values as any).args?.map((a: any) => a.name) || [];
                const newArgNames = generatedArgs.map((a) => a.name);

                if (
                    JSON.stringify(currentArgNames.sort()) !==
                    JSON.stringify(newArgNames.sort())
                ) {
                    formik.setFieldValue('args', generatedArgs);
                }
            } else {
                // Clear args if no dynamic segments found
                if (
                    (formik.values as any).args &&
                    (formik.values as any).args.length > 0
                ) {
                    formik.setFieldValue('args', []);
                }
            }
        }
    }, [formik.values.path]);

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

                        {/* Show generated dynamic args */}
                        {(formik.values as any).args &&
                            (formik.values as any).args.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Dynamic Arguments (Auto-generated)
                                    </label>
                                    <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                                        {(formik.values as any).args.map(
                                            (arg: any, index: number) => (
                                                <div
                                                    key={index}
                                                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border"
                                                >
                                                    {arg.name} ({arg.type}){' '}
                                                    {arg.isOptional
                                                        ? '(optional)'
                                                        : ''}
                                                </div>
                                            )
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        These arguments will be automatically
                                        generated based on the dynamic segments
                                        in your path.
                                    </p>
                                </div>
                            )}

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
