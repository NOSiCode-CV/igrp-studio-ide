import { PageConfig } from '@igrp/nextjs-engine/dist/interfaces/types'
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@renderer/components/ui/alert-dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import useToast from "@renderer/components/useToast";
import * as Yup from "yup";
import { PATTERNS } from '@renderer/utils/constants';
import { useTranslation } from 'react-i18next';
import { useFormik } from "formik";

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

    const { showErrorToast, showSuccessToast } = useToast();

    const handleConfirm = async (pageConfig: PageConfig): Promise<void> => {
        try {
            const { error } = await window.api.createPage(pageConfig, basePath);

            if (error) {
                showErrorToast(error);
                return;
            }

            showSuccessToast(`Page ${pageConfig.pageName} has been successfully added.`);

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
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <form
                    className="needs-validation"
                    onSubmit={(e) => {
                        e.preventDefault();
                        formik.handleSubmit();
                    }}
                >
                    <AlertDialogHeader>
                        <AlertDialogTitle>Create New Page</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="pageName" className="text-right">
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
                    <AlertDialogFooter>
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
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    )
}