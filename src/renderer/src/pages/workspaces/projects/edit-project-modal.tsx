'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    IGRPDialogPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPButtonPrimitive,
    IGRPInputPrimitive,
    IGRPLabelPrimitive,
    IGRPTextAreaPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ProjectData } from 'src/main/types';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { LabelRequired } from '@renderer/components/label-required';
import { PATTERNS } from '@renderer/constants/appConstants';
import { Upload, X } from 'lucide-react';
import { ProjectIcon } from '@renderer/components/shared-ui';

interface EditProjectModalProps {
    project: ProjectData;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
    project,
    isOpen,
    onClose,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const { actions: { updateProject } } = useWorkspace();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validationSchema = Yup.object().shape({
        name: Yup.string()
            .required(t('fieldRequired', { name: t('projectName') }))
            .matches(
                PATTERNS.SPECIAL_CHARACTERS_PROJECT_NAME,
                t('msgSpecialCharactersRegex')
            )
            .max(100, t('maxLengthExceeded', { max: 100 })),
        config: Yup.object().shape({
            description: Yup.string().max(500, t('maxLengthExceeded', { max: 500 })),
        }),
    });

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: project.name || '',
            config: {
                description: project.config?.description || '',
                ...project.config,
            },
            themeColor: project.themeColor || '#000000',
            icon: project.icon || '',
        },
        validationSchema,
        onSubmit: async (values, actions) => {
            setIsSubmitting(true);
            try {
                const updatedProject = {
                    ...project,
                    name: values.name,
                    config: {
                        ...project.config,
                        description: values.config.description,
                    },
                    themeColor: values.themeColor,
                    icon: values.icon,
                };

                await updateProject(project.id, updatedProject);
                onSuccess?.();
                onClose();
            } catch (error) {
                console.error('Error updating project:', error);
            } finally {
                setIsSubmitting(false);
                actions.setSubmitting(false);
            }
        },
    });

    const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert(t('invalidFileType'));
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert(t('fileTooLarge'));
            return;
        }

        try {
            // Create a unique filename
            const timestamp = Date.now();
            const fileExtension = file.name.split('.').pop();
            const fileName = `project-icon-${timestamp}.${fileExtension}`;
            
            // For now, we'll store the file name as the icon path
            // In a real implementation, you'd want to save the file to the workspace
            formik.setFieldValue('icon', `icons/${fileName}`);
        } catch (error) {
            console.error('Error handling icon upload:', error);
        }
    };

    const handleRemoveIcon = () => {
        formik.setFieldValue('icon', '');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        if (isOpen && formik.values.name) {
            // Focus on the name input when modal opens
            const nameInput = document.getElementById('project-name');
            if (nameInput) {
                nameInput.focus();
                (nameInput as HTMLInputElement).select();
            }
        }
    }, [isOpen]);

    return (
        <IGRPDialogPrimitive open={isOpen} onOpenChange={onClose}>
            <IGRPDialogContentPrimitive className="overflow-hidden max-h-[80svh] sm:max-w-[700px] lg:max-w-[800px] max-w-4xl">
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>
                        {t('editProject')}
                    </IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        {t('editProjectDescription')}
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>

                <form onSubmit={formik.handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {/* Project Icon */}
                        <div className="space-y-2">
                            <IGRPLabelPrimitive>{t('projectIcon')}</IGRPLabelPrimitive>
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                    {formik.values.icon ? (
                                        <ProjectIcon
                                            project={{ ...project, icon: formik.values.icon }}
                                            workspacePath=""
                                        />
                                    ) : (
                                        <div className="text-gray-400 text-xs text-center">
                                            {t('noIcon')}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleIconUpload}
                                        className="hidden"
                                    />
                                    <IGRPButtonPrimitive
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {t('uploadIcon')}
                                    </IGRPButtonPrimitive>
                                    {formik.values.icon && (
                                        <IGRPButtonPrimitive
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRemoveIcon}
                                            className="w-full"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            {t('removeIcon')}
                                        </IGRPButtonPrimitive>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Project Name */}
                        <div className="space-y-2">
                            <LabelRequired>{t('projectName')}</LabelRequired>
                            <IGRPInputPrimitive
                                id="project-name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder={t('enterProjectName')}
                                maxLength={100}
                            />
                            {formik.touched.name && formik.errors.name && (
                                <p className="text-xs text-destructive">
                                    {formik.errors.name}
                                </p>
                            )}
                        </div>

                        {/* Project Description */}
                        <div className="space-y-2">
                            <IGRPLabelPrimitive htmlFor="description">
                                {t('description')}
                            </IGRPLabelPrimitive>
                            <IGRPTextAreaPrimitive
                                id="description"
                                value={formik.values.config.description}
                                onChange={(e) =>
                                    formik.setFieldValue('config.description', e.target.value)
                                }
                                onBlur={formik.handleBlur}
                                placeholder={t('projectDescription')}
                                maxLength={500}
                                rows={3}
                            />
                            {formik.touched.config && formik.errors.config && (
                                <p className="text-xs text-destructive">
                                    {typeof formik.errors.config === 'object' && 'description' in formik.errors.config ? String(formik.errors.config.description) : ''}
                                </p>
                            )}
                        </div>

                        {/* Theme Color */}
                        <div className="space-y-2">
                            <IGRPLabelPrimitive htmlFor="themeColor">
                                {t('themeColor')}
                            </IGRPLabelPrimitive>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    id="themeColor"
                                    value={formik.values.themeColor}
                                    onChange={(e) => formik.setFieldValue('themeColor', e.target.value)}
                                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                                />
                                <IGRPInputPrimitive
                                    value={formik.values.themeColor}
                                    onChange={(e) => formik.setFieldValue('themeColor', e.target.value)}
                                    placeholder="#000000"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>

                    <IGRPDialogFooterPrimitive>
                        <IGRPButtonPrimitive
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            {t('cancel')}
                        </IGRPButtonPrimitive>
                        <IGRPButtonPrimitive
                            type="submit"
                            disabled={isSubmitting || !formik.isValid}
                        >
                            {isSubmitting ? t('saving') : t('saveChanges')}
                        </IGRPButtonPrimitive>
                    </IGRPDialogFooterPrimitive>
                </form>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    );
};
