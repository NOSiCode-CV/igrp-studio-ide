
import { Button, ModalHeader, ModalBody, Form, Input, FormGroup, FormFeedback, Modal, Label } from 'reactstrap';
import { useFormik } from "formik";
import { PageConfig } from "@igrp/nextjs-engine/dist/interfaces/types";
import useToast from "@renderer/components/useToast";
import * as Yup from "yup";
import { PATTERNS } from '@renderer/utils/constants';
import { useTranslation } from 'react-i18next';

const initialValues: PageConfig = {
    type: 'page',
    pageName: '',
    path: 'teste'
};


interface UiProps {
    basePath: string;
    show?: boolean;
    onConfirmClick?: () => void;
    onCloseClick?: () => void;
}

const UiNewPage = ({ basePath, show, onConfirmClick, onCloseClick }: UiProps) => {

    const { t } = useTranslation();

    const { showErrorToast, showSuccessToast } = useToast();

    const handleSaveButtonClick = async (pageConfig: PageConfig): Promise<void> => {
        try {
            const { error } = await window.api.createPage(pageConfig, basePath);

            if (error) {
                showErrorToast(error);
                return;
            }

            showSuccessToast(`Page ${pageConfig.pageName} has been successfully added.`);
            if (onConfirmClick) onConfirmClick();
            validation.resetForm();
        } catch (error) {
            showErrorToast(error);
        }
    };

    const validationSchema = Yup.object({
        pageName: Yup.string().required(t("thisFieldRequired", { name: "Page Name" }))
            .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet'))
    });


    const validation = useFormik<PageConfig>({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: (values, actions) => {
            actions.setSubmitting(false);
            handleSaveButtonClick(values);
        },
    });

    return (
        <>
            <Modal
                isOpen={show}
                toggle={onConfirmClick}
                centered
                backdrop="static"
                fade={false}
            >
                <ModalHeader className="modal-title">Add Page</ModalHeader>
                <ModalBody className="">
                    <Form
                        className="needs-validation"
                        onSubmit={(e) => {
                            e.preventDefault();
                            validation.handleSubmit();
                        }}
                    >
                        <div className="">
                            <FormGroup>
                                <Label htmlFor="appName" className="form-label fw-medium fs-13">Page Name</Label>
                                <Input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter your model name"
                                    id="pageName"
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    value={validation.values.pageName || ""}
                                    invalid={!!(validation.touched.pageName && validation.errors.pageName)}
                                />
                                {validation.touched.pageName && validation.errors.pageName && (
                                    <FormFeedback type="invalid">
                                        {validation.errors.pageName}
                                    </FormFeedback>
                                )}
                            </FormGroup>
                            <div className="hstack gap-2 justify-content-end">
                                <Button color="light" onClick={onCloseClick}>Close</Button>
                                <Button
                                    type="submit"
                                    disabled={validation.isSubmitting}
                                    color="primary"
                                >
                                    {validation.isSubmitting ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    </Form>
                </ModalBody>
            </Modal>
        </>
    );
};

export default UiNewPage;