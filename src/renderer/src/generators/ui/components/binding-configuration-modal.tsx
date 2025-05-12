import { Badge } from '@renderer/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter,
} from '@renderer/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { EngineService } from '@renderer/services/EngineService';
import { useEffect, useState } from 'react';
import useStudio from '@renderer/hooks/use-studio';
import { FormList } from '@renderer/components/form-list';
import { handleChangeValueObject } from '@renderer/generators/api/helpers';
import { useFormik } from 'formik';
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

const defaultFieldType: ElementField = {
    componentId: '',
    name: '',
    type: 'string',
    required: false,
    validation: '',
    defaultValue: '',
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
}

export const BindingConfigurationModal = ({ comp }: BindingProps) => {
    const { t } = useTranslation();
    const { basePath } = useStudio();

    const [newBinding, setNewBinding] = useState<boolean>(true);
    const [formTypes, setFormTypes] = useState([]);
    const [typeMaps, setTypeMaps] = useState([]);
    const [types, setTypes] = useState([]);
    const [selectedType, setSelectedType] = useState<string>('');

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

    const columns = [
        { key: 'name', name: t('name'), type: 'text', readonly: !newBinding },
        ...(!newBinding
            ? [
                  {
                      key: 'newType',
                      name: t('type'),
                      type: 'select',
                      options: typeMaps,
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

    const validate = (values) => {
        const errors: any = {};
        // Ensure field names are unique
        const fieldNames = values.fields.map((f) => f.name);
        if (new Set(fieldNames).size !== fieldNames.length) {
            errors.fields = 'Field names must be unique';
        }
        return errors;
    };

    const formik: any = useFormik({
        enableReinitialize: true,
        initialValues: compType || {
            componentId,
            name: tag,
            path: '',
            fields: [],
        },
        onSubmit: (values, actions) => {
            console.log(values);
            actions.setSubmitting(false);

            createOrUpdateType(values);

            if (componentId) {
                handleUpdateChildComponent(componentId, {
                    ...comp,
                    dataType: values.name,
                });

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
        },
    });

    const loadMetadata = async () => {
        const { result }: any = await EngineService.getAppMetadata(basePath);
        console.log('Loaded metadata:', result); // Log to console
        if (result) {
            const fTypes = result.form.types.map((type) => ({
                label: type.name,
                value: type.name,
            }));

            setFormTypes(fTypes);

            setTypes(result.form.types);
        }
    };

    const getFields = () => {
        const type: any = types.find((c: any) => c.name === selectedType) || {};
        return type && type?.fields && type?.fields ? type.fields : [];
    };

    useEffect(() => {
        const fieldsTypes = getFields().map((field) => ({
            label: `${field.name} (${field.type})`,
            value: field.name,
        }));

        setTypeMaps(fieldsTypes);
    }, [selectedType]);

    useEffect(() => {
        window.electron.ipcRenderer.on('folder-change', loadMetadata);

        return () => {
            window.electron.ipcRenderer.removeListener(
                'message-update',
                loadMetadata
            );
        };
    }, []);

    useEffect(() => {
        loadMetadata();

        // Auto-add fields from children if not already in the list
        if (comp.children?.length) {
            const currentFields = formik.values.fields || [];
            const existingNames = currentFields.map(
                (f: ElementField) => f.componentId
            );

            const { fields, componentMap: updatedMap } = extractValidFields(
                comp.children,
                existingNames
            );

            formik.setFieldValue('fields', [...currentFields, ...fields]);
            setComponentMap(updatedMap);
        }
    }, [comp.children, components]);

    const extractValidFields = (
        components: StructuredComponent[],
        existingNames: string[] = []
    ): {
        fields: ElementField[];
        componentMap: Map<string, StructuredComponent>;
    } => {
        const componentMap: Map<string, StructuredComponent> = new Map();
        const fields: ElementField[] = [];
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
            <Dialog>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Badge
                                variant={'secondary'}
                                className="rounded-sm cursor-pointer my-0.5"
                            >
                                <span className="text-xs">Binding Config</span>
                            </Badge>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Binding Configuration</p>
                    </TooltipContent>
                </Tooltip>
                <DialogContent className="flex flex-col overflow-hidden [--header-height-three:calc(--spacing(75))] sm:max-w-[800px] lg:max-w-[900px] max-w-7xl h-[70vh]">
                    <DialogHeader>
                        <DialogTitle>Binding Configuration</DialogTitle>
                        <DialogDescription>
                            Make changes to your Binding Configuration here.
                            Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={formik.handleSubmit} className="space-y-4">
                        <div className="flex">
                            <div className="relative flex rounded-lg border bg-muted p-0.5 text-sm space-x-2">
                                <Button
                                    type="button"
                                    variant={newBinding ? 'outline' : 'ghost'}
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
                                    variant={!newBinding ? 'outline' : 'ghost'}
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
                                options={formTypes}
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
                            <DialogClose>close</DialogClose>
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
                </DialogContent>
            </Dialog>
        </>
    );
};
