import { State } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { nanoid } from '@reduxjs/toolkit';
import { Button } from '@renderer/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import { PATTERNS } from '@renderer/constants/appConstants';
import {
    SelectInput,
    TextInput,
} from '@renderer/generators/api/components/inputs-form';
import { useDroppedComponents } from '@renderer/generators/ui/dnd/DroppedComponentsContext';
import { FormikProps, useFormik } from 'formik';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';
import { ImportComponent } from './custom-code-imports';

const returnTypeOptions = [
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'object', label: 'Object' },
    { value: 'array', label: 'Array' },
    { value: 'void', label: 'Void' },
    { value: 'any', label: 'Any' },
];

interface StateComponentProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    state?: any;
}

const StateComponent = ({ open, setOpen, state }: StateComponentProps) => {
    const { addState, updateState } = useDroppedComponents();
    const { t } = useTranslation();

    const stateValidationSchema = Yup.object().shape({
        name: Yup.string()
            .required(t('fieldRequired', { name: t('State name') }))
            .matches(
                PATTERNS.SPECIAL_CHARACTERS,
                t('msgSpecialCharactersRegex')
            ),
        type: Yup.string().required(
            t('fieldRequired', { name: t('State type') })
        ),
        defaultValue: Yup.string(),
    });

    const formik: FormikProps<State> = useFormik({
        enableReinitialize: true,
        initialValues: state || {
            id: '',
            name: '',
            type: 'string',
            defaultValue: '',
            imports: [],
        },
        validationSchema: stateValidationSchema,
        onSubmit: (values, actions) => {
            try {
                const stateData = {
                    ...values,
                };

                if (stateData.id === '') {
                    addState({
                        ...stateData,
                        id: `state_${nanoid(6).replace(/-/g, '')}`,
                    });
                } else {
                    updateState(stateData.id, stateData);
                }

                setOpen(false);
            } catch (error) {
                console.error('Submission failed:', error);
            } finally {
                actions.setSubmitting(false);
            }
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-hidden sm:max-w-[800px] lg:max-w-[900px] max-w-[90vw] w-full">
                <DialogHeader>
                    <DialogTitle>
                        <div className="flex items-center gap-2 justify-between">
                            <div>
                                {state ? 'Edit State' : 'Create State'}{' '}
                                <span className="text-muted-foreground">
                                    {state ? state.name : ''}
                                </span>
                            </div>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        {state
                            ? 'Edit your state configuration'
                            : 'Define a new state variable'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={formik.handleSubmit} className="space-y-4">
                    <TextInput
                        label={t('Name')}
                        id="name"
                        placeholder="myState"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        isTouched={formik.touched.name}
                        error={formik.errors.name}
                        isRequired
                    />

                    <SelectInput
                        label={t('Type')}
                        id="type"
                        value={formik.values.type}
                        onChange={(value) =>
                            formik.setFieldValue('type', value)
                        }
                        options={returnTypeOptions}
                    />

                    <TextInput
                        label={t('defaultValue')}
                        id="defaultValue"
                        placeholder="defaultValue"
                        value={formik.values.defaultValue}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        isTouched={formik.touched.defaultValue}
                        error={formik.errors.defaultValue}
                        isRequired
                    />

                    <ImportComponent
                        initialImports={formik.values?.imports || []}
                        onChange={(imports) =>
                            formik.setFieldValue('imports', imports)
                        }
                    />

                    <DialogFooter className="space-x-2">
                        <DialogClose>Close</DialogClose>
                        <Button type="submit" disabled={formik.isSubmitting}>
                            {formik.isSubmitting && (
                                <Loader2 className="animate-spin" />
                            )}
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export { StateComponent };
