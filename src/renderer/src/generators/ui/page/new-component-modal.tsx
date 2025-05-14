import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
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
import { ComponentConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { getId } from '@renderer/utils/helpers';
import IconBrowser from '@renderer/components/icon/icon-browser';

const initialValues: ComponentConfig = {
    type: 'component',
    name: '',
    path: 'teste',
    icon: '',
    id: getId(),
};

interface NewComponentModalProps {
    isOpen: boolean;
    basePath: string;
    onClose: () => void;
    onConfirm: () => void;
}

export function NewComponentModal({
    isOpen,
    basePath,
    onClose,
    onConfirm,
}: NewComponentModalProps) {
    const { t } = useTranslation();

    const { createGitCommit } = useGit();

    const { showErrorToast, showSuccessToast } = useToast();

    const handleConfirm = async (
        pageConfig: ComponentConfig
    ): Promise<void> => {
        try {
            const { error } = await window.engine.createPage(
                pageConfig,
                ENV_TYPES.NEXTJS,
                basePath
            );

            if (error) {
                showErrorToast(error);
                return;
            }

            showSuccessToast(
                `Component ${pageConfig.name} has been successfully added.`
            );
            // commit after creating the page
            createGitCommit(basePath, t("addComponent", { name: pageConfig.name }));
            onConfirm?.();

            formik.resetForm();
        } catch (error) {
            console.log(error);
            showErrorToast(error);
        }
    };

    const validationSchema = Yup.object({
        name: Yup.string()
            .required(t('thisFieldRequired', { name: t('componentName') }))
            .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet')),
    });

    const formik = useFormik<ComponentConfig>({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: (values, actions) => {
            actions.setSubmitting(false);
            handleConfirm(values);
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogTitle>{t('createNewComponent')}</DialogTitle>
                <DialogDescription>
                    {t('comonDialogtDescription', { name: 'Component' })}
                </DialogDescription>
                <form
                    className="needs-validation"
                    onSubmit={(e) => {
                        e.preventDefault();
                        formik.handleSubmit();
                    }}
                >
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 items-center gap-3">
                            <Label htmlFor="componentName">
                                {t('componentName')}
                            </Label>
                            <Input
                                id="name"
                                className="col-span-3"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.name || ''}
                            />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <IconBrowser
                                onSelectedIcon={(icon) => {
                                    formik.setFieldValue('icon', icon);
                                }}
                                selectedIcon={''}
                            />
                        </div>
                    </div>
                    <DialogFooter className='flex justify-between'>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={formik.isSubmitting}
                            color="primary"
                        >
                            {formik.isSubmitting ? t("saving") : t("save")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
