import { PageConfig } from '@igrp/nextjs-engine/dist/interfaces/types'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import useToast from "@renderer/components/useToast";
import * as Yup from "yup";
import { useTranslation } from 'react-i18next';
import { useFormik } from "formik";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@renderer/components/ui/dialog'
import { PATTERNS } from '@renderer/constants/appConstants';
import { useGit } from '@renderer/hooks/useGit';

const initialValues: PageConfig = {
    type: 'page',
    pageName: '',
    path: 'teste'
};

interface NewPageModalProps {
    isOpen: boolean
    basePath: string
    onClose: () => void
    onConfirm: () => void
}

export function NewPageModal({ isOpen, basePath, onClose, onConfirm }: NewPageModalProps) {

    const { t } = useTranslation();

    const {createGitCommit} = useGit();

    const { showErrorToast, showSuccessToast } = useToast();

    const handleConfirm = async (pageConfig: PageConfig): Promise<void> => {
        try {
            const { error } = await window.api.createPage(pageConfig, basePath);

            if (error) {
                showErrorToast(error);
                return;
            }

            showSuccessToast(`Page ${pageConfig.pageName} has been successfully added.`);
            // commit after creating the page
            createGitCommit(basePath, `Add page ${pageConfig.pageName}`);
            if (onConfirm) onConfirm();

            formik.resetForm();
        } catch (error) {
            showErrorToast(error);
        }
    };

    const validationSchema = Yup.object({
        pageName: Yup.string().required(t("thisFieldRequired", { name: "Page Name" }))
            .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet'))
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
                <DialogTitle className="">Create New Page</DialogTitle>
                <DialogDescription>
                    {t('dialogDescription')}
                </DialogDescription>
                <form
                    className="needs-validation"
                    onSubmit={(e) => {
                        e.preventDefault();
                        formik.handleSubmit();
                    }}
                >
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="pageName">
                                Page Name
                            </Label>
                            <Input
                                id="pageName"
                                className="col-span-3"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.pageName || ""}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={formik.isSubmitting}
                            color="primary"
                        >
                            {formik.isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}