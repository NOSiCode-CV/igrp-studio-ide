import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import useToast from '@renderer/components/useToast';
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
import { useGit } from '@renderer/hooks/useGit';
import { PageConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { getId } from '@renderer/utils/helpers';

const initialValues: PageConfig = {
    type: 'page',
    pageName: '',
    path: 'teste',
    id: getId()
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
                pageConfig,
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogTitle>{t('createNewPage')}</DialogTitle>
                <DialogDescription>{t('comonDialogtDescription', {'name':'Page'})}</DialogDescription>
                <form
                    className="needs-validation"
                    onSubmit={(e) => {
                        e.preventDefault();
                        formik.handleSubmit();
                    }}
                >
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="pageName">{t('pageName')}</Label>
                            <Input
                                id="pageName"
                                className="col-span-3"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.pageName || ''}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
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
