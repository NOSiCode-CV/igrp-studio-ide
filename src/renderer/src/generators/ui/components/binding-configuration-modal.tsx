import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@renderer/components/ui/dialog';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { useEffect, useState } from 'react';
import { FormList } from '@renderer/components/form-list';
import { handleChangeValueObject } from '@renderer/generators/api/helpers';
import { FormikProps, useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import {
    SelectInput,
    TextInput,
} from '@renderer/generators/api/components/inputs-form';
import { SchemaTypeItem } from 'src/main/types';
import { useDroppedComponents } from '../dnd/DroppedComponentsContext';
import { ElementField } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { DialogClose } from '@radix-ui/react-dialog';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import useCustomCode from '../hooks/useCustomCode';
import useToast from '@renderer/hooks/useToast';
import { capitalize } from '@renderer/utils/helpers';
import { COMPONENT } from '../ComponentTypes';

interface LabeledElementField extends ElementField {
    componentId: string;
    name: string;
    type: string;
    validation?: string;
    defaultValue?: string;
    required: boolean;
    label: string;
}

type LabeledTypeDef = {
    componentId: string;
    name: string;
    path: string;
    tags?: string[];
    fields: LabeledElementField[];
};

const defaultFieldType: LabeledElementField = {
    componentId: '',
    name: '',
    type: 'string',
    required: false,
    validation: '',
    defaultValue: '',
    label: '',
};

const FIELD_TYPES: SchemaTypeItem[] = [
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date', label: 'Date' },
    { value: 'array', label: 'Array/Options' },
    { value: 'email', label: 'Email' },
    { value: 'password', label: 'Password' },
    { value: 'tel', label: 'Telephone' },
    { value: 'url', label: 'URL' },
    { value: 'color', label: 'Color' },
    { value: 'file', label: 'File' },
    { value: 'object', label: 'Object' },
];

interface BindingProps {
    path: string;
    comp: StructuredComponent;
    open: boolean;
    setOpen: (open: boolean) => void;
}

export const BindingConfigurationModal = ({
    comp,
    open,
    setOpen,
}: BindingProps) => {
    const { t } = useTranslation();
    const { types, typesOptions } = useCustomCode();
    const { showErrorToast } = useToast();

    const [fieldsTypeOptions, setFieldsTypeOptions] = useState([]);
    const [selectedType, setSelectedType] = useState<string>('');
    const [typeFilePath, setTypeFilePath] = useState<string>('');

    const [componentMap, setComponentMap] = useState<
        Map<string, StructuredComponent>
    >(new Map());

    const {
        createOrUpdateType,
        getTypeByComponentId,
        handleUpdateChildComponent,
        components,
    } = useDroppedComponents();

    const { tag, id: componentId } = comp;

    const compType = getTypeByComponentId(componentId);

    const [newBinding, setNewBinding] = useState<boolean>(
        compType?.path === '' || compType?.path === undefined
    );

    const columns = [
        { key: 'label', name: t('label'), type: 'label' },
        { key: 'name', name: t('name'), type: 'text', readonly: !newBinding },
        ...(!newBinding
            ? [
                  {
                      key: 'newType',
                      name: t('type'),
                      type: 'select',
                      options: fieldsTypeOptions,
                  },
              ]
            : []),

        ...(newBinding
            ? [
                  {
                      key: 'type',
                      name: t('dataType'),
                      type: 'typeSelectorDropdown',
                      options: FIELD_TYPES,
                  },
                  {
                      key: 'required',
                      name: '',
                      type: 'checkbox',
                  },
              ]
            : []),
        { key: 'defaultValue', name: t('defaultValue'), type: 'text' },
    ];

    const validate = () => {
        const fieldNames = formik.values.fields.map((f) => f.name);
        if (new Set(fieldNames).size !== fieldNames.length) {
            showErrorToast('Field names must be unique');
            return false;
        }
        return true;
    };

    const formik: FormikProps<LabeledTypeDef> = useFormik({
        enableReinitialize: true,
        initialValues: {
            componentId,
            name: tag,
            path: '',
            fields: [],
            ...compType,
        },
        onSubmit: (values, actions) => {
            actions.setSubmitting(false);

            if (!validate()) return;

            const { label, ...rest } = values;

            createOrUpdateType({
<<<<<<< HEAD
                ...rest,
                path: !newBinding && typeFilePath ? typeFilePath : '',
            });

            if (componentId) {
                //TODO For revisions
                let defaultValues: any = undefined;
                if (comp.componentName === COMPONENT.Form) {
                    defaultValues = {
                        ...comp.data?.defaultValues,
                        state: {
                            ...comp.data?.defaultValues.state,
                            name: comp.data?.defaultValues.state?.name ?? '',
                            defaultValue: `init${capitalize(values.name)}`,
                            type: comp.data?.defaultValues.state?.type ?? '',
                            id: comp.data?.defaultValues.state?.id ?? '',
                        },
                    };

                    handleUpdateChildComponent(componentId, {
                        ...comp,
                        dataType: values.name,
                        data: {
                            ...comp.data,
                            defaultValues,
                        },
                    });
                } else
                    handleUpdateChildComponent(componentId, {
                        ...comp,
                        dataType: values.name,
                    });
=======
                ...values,
                path: !newBinding && typeFilePath ? typeFilePath : '',
            });

            if (componentId) {
<<<<<<< HEAD
                handleUpdateChildComponent(componentId, {
                    ...comp,
                    dataType: values.name,
                });
>>>>>>> parent of 6a765cf (UI: component table and form)
=======
                //TODO For revisions

                let defaultValues: any = undefined;
                if (comp.componentName === COMPONENT.Form) {
                    defaultValues = {
                        ...comp.data?.defaultValues,
                        state: {
                            ...comp.data?.defaultValues.state,
                            name: comp.data?.defaultValues.state?.name ?? '',
                            defaultValue: `init${capitalize(values.name)}`,
                            type: comp.data?.defaultValues.state?.type ?? '',
                            id: comp.data?.defaultValues.state?.id ?? '',
                        },
                    };

                    handleUpdateChildComponent(componentId, {
                        ...comp,
                        dataType: values.name,
                        data: {
                            ...comp.data,
                            defaultValues,
                        },
                    });
                } else
                    handleUpdateChildComponent(componentId, {
                        ...comp,
                        dataType: values.name,
                    });
>>>>>>> parent of 8b487e9 (Revert "UI: component table and form")

                values.fields.forEach(({ componentId: id, name }) => {
                    const component = componentMap.get(id);
                    if (component) {
                        handleUpdateChildComponent(id, {
                            ...component,
                            tag: name,
                        });
                    }
                });
            }

            setOpen(false);
        },
    });

    const getFields = () => {
        const type: any = types.find((c: any) => c.name === selectedType) || {};

        setTypeFilePath(type.path);

        return type && type?.fields && type?.fields ? type.fields : [];
    };

    useEffect(() => {
        const type = getFields();
        const fieldsTypes = type.map((field: LabeledElementField) => ({
            label: `${field.name} (${field.type})`,
            value: field.name,
        }));

        setFieldsTypeOptions(fieldsTypes);
    }, [selectedType]);

    useEffect(() => {
        // Auto-add fields from children if not already in the list
        if (comp.children?.length) {
            const currentFields = formik.values.fields || [];
            const existingNames = []; /* currentFields.map(
                (f: ElementField) => f.componentId
            ); */

            const { fields, componentMap: updatedMap } = extractValidFields(
                comp.children,
                existingNames
            );

            const updatedFields = fields.map((field) => ({
                ...field,
                ...currentFields.find(
                    (f) => f.componentId === field.componentId
                ),
            }));

            formik.setFieldValue('fields', [...updatedFields]);
            setComponentMap(updatedMap);
        }
    }, [components, comp.children]);

    const extractValidFields = (
        components: StructuredComponent[],
        existingNames: string[] = []
    ): {
        fields: LabeledElementField[];
        componentMap: Map<string, StructuredComponent>;
    } => {
        const componentMap: Map<string, StructuredComponent> = new Map();
        const fields: LabeledElementField[] = [];
        const newExistingNames = new Set(existingNames);

        const processComponent = (child: StructuredComponent) => {
            if (!child) return;

            // Check if component should be included as a field
            const shouldInclude =
                child?.properties?.dataProperties &&
                !child.properties.dataProperties.isVirtual &&
                child.properties.dataProperties.isType;

            if (shouldInclude) {
                if (!newExistingNames.has(child.id)) {
                    fields.push({
                        ...defaultFieldType,
                        name: child.tag,
                        componentId: child.id,
                        label: child.properties.label ?? child.label,
                    });
                    newExistingNames.add(child.id);
                }

                componentMap.set(child.id, child);
            }

            // Process children recursively
            if (Array.isArray(child.children)) {
                child.children.forEach(processComponent);
            }
        };

        components.forEach(processComponent);

        return { fields, componentMap };
    };

    const handleChange = (element: string, position: number, result: any) => {
        if (element === 'newType') {
            const field: any =
                getFields().find((c: any) => c.name === result) || {};

            handleChangeValueObject(
                formik,
                'type',
                position,
                field.type,
                'fields'
            );
            handleChangeValueObject(
                formik,
                'required',
                position,
                field.required,
                'fields'
            );

            handleChangeValueObject(formik, 'name', position, result, 'fields');
        } else {
            handleChangeValueObject(
                formik,
                element,
                position,
                result,
                'fields'
            );
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 flex flex-col overflow-hidden [--header-height-three:calc(--spacing(75))] sm:max-w-[800px] lg:max-w-[900px] max-w-7xl h-[70vh]">
                    <ScrollArea className="h-full p-4">
                        <DialogHeader className="mb-4">
                            <DialogTitle>Binding Configuration</DialogTitle>
                            <DialogDescription>
                                Make changes to your Binding Configuration here.
                                Click save when you're done.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={formik.handleSubmit}
                            className="space-y-4"
                        >
                            <div className="flex">
                                <div className="relative flex rounded-lg border bg-muted p-0.5 text-sm space-x-2">
                                    <Button
                                        type="button"
                                        variant={
                                            newBinding ? 'outline' : 'ghost'
                                        }
                                        onClick={() => setNewBinding(true)}
                                        className="rounded-lg"
                                        size="sm"
                                    >
                                        New
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setNewBinding(false)}
                                        className="rounded-lg"
                                        size="sm"
                                        variant={
                                            !newBinding ? 'outline' : 'ghost'
                                        }
                                    >
                                        Existing
                                    </Button>
                                </div>
                            </div>

                            <TextInput
                                label={t('name')}
                                id="name"
                                placeholder={t('enterName')}
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                isTouched={formik.touched.name}
                                error={formik.errors.name}
                                isRequired
                            />

                            {!newBinding && (
                                <SelectInput
                                    label={t('Types')}
                                    id="types"
                                    placeholder={t('types')}
                                    value={selectedType}
                                    onChange={(value) =>
                                        setSelectedType(value as string)
                                    }
                                    options={typesOptions}
                                    isRequired
                                />
                            )}

                            <div className="border rounded-sm">
                                <FormList
                                    columns={columns}
                                    formik={formik}
                                    data={formik.values.fields}
                                    changeValue={(element, position, result) =>
                                        handleChange(element, position, result)
                                    }
                                    name={'Type'}
                                />
                            </div>

                            <DialogFooter className="space-x-2">
                                <DialogClose>Close</DialogClose>
                                <Button
                                    type="submit"
                                    disabled={formik.isSubmitting}
                                >
                                    {formik.isSubmitting && (
                                        <Loader2 className="animate-spin" />
                                    )}
                                    Save changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
};
