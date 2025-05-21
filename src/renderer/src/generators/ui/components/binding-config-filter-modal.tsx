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
import { useDroppedComponents } from '../dnd/DroppedComponentsContext';
import { DialogClose } from '@radix-ui/react-dialog';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system';

interface BindingFilterType {
    componentId: string;
    name: string;
    columnId: string;
}

const defaultFieldType: BindingFilterType = {
    componentId: '',
    name: '',
    columnId: '',
};

interface BindingProps {
    path: string;
    comp: StructuredComponent;
    tableColumns?: StructuredComponent[];
    open: boolean;
    setOpen: (open: boolean) => void;
}

export const BindingConfigurationFilterModal = ({
    comp,
    tableColumns,
    open,
    setOpen,
}: BindingProps) => {
    const { t } = useTranslation();

    const [columnsOptions, setColumnsOptions] = useState<IGRPOptionsProps[]>(
        []
    );

    const [componentMap, setComponentMap] = useState<
        Map<string, StructuredComponent>
    >(new Map());

    const { getTypeByComponentId, handleUpdateChildComponent, components } =
        useDroppedComponents();

    const { tag, id: componentId } = comp;

    const compType = getTypeByComponentId(componentId);

    const columns = [
        {
            key: 'name',
            name: t('Filter Column'),
            type: 'text',
            readonly: true,
        },
        {
            key: 'columnId',
            name: t('Table Column'),
            type: 'select',
            options: columnsOptions,
        },
    ];

    const formik: FormikProps<any> = useFormik({
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

            if (componentId) {
                values.fields.forEach((field: any) => {
                    const id = field.componentId;
                    const columnId = field.columnId;
                    const component = componentMap.get(id);
                    if (component && columnId) {
                        handleUpdateChildComponent(id, {
                            ...component,
                            properties: {
                                ...component.properties,
                                columnId,
                            },
                        });
                    }
                });
            }

            setOpen(false);
        },
    });

    useEffect(() => {
        const options =
            tableColumns
                ?.filter(
                    (column) =>
                        column?.properties?.dataProperties &&
                        !column.properties.dataProperties.isVirtual &&
                        column.properties.dataProperties.isType
                )
                .map((column) => {
                    return {
                        value: column.tag,
                        label: column.properties.headerTitle,
                    };
                }) ?? [];
        setColumnsOptions(options);
    }, [tableColumns]);

    useEffect(() => {
        // Auto-add fields from children if not already in the list
        if (comp.children?.length) {
            const { fields, componentMap: updatedMap } = extractValidFields(
                comp.children
            );

            formik.setFieldValue('fields', [...fields]);
            setComponentMap(updatedMap);
        }
    }, [components, comp.children]);

    const extractValidFields = (
        components: StructuredComponent[]
    ): {
        fields: BindingFilterType[];
        componentMap: Map<string, StructuredComponent>;
    } => {
        const componentMap: Map<string, StructuredComponent> = new Map();
        const fields: BindingFilterType[] = [];

        const processComponent = (child: StructuredComponent) => {
            if (!child) return;

            componentMap.set(child.id, child);

            fields.push({
                ...defaultFieldType,
                name: child.tag,
                componentId: child.id,
                columnId: child.properties.columnId,
            });

            // Process children recursively
            if (Array.isArray(child.children)) {
                child.children.forEach(processComponent);
            }
        };

        components.forEach(processComponent);

        return { fields, componentMap };
    };

    const handleChange = (element: string, position: number, result: any) => {
        handleChangeValueObject(formik, element, position, result, 'fields');
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 flex flex-col overflow-hidden [--header-height-three:calc(--spacing(75))] sm:max-w-[800px] lg:max-w-[900px] max-w-7xl max-h-[70vh]">
                    <ScrollArea className="h-full p-4">
                        <DialogHeader className="mb-4">
                            <DialogTitle>
                                Binding Filter Configuration
                            </DialogTitle>
                            <DialogDescription>
                                Make changes to your Binding Configuration here.
                                Click save when you're done.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={formik.handleSubmit}
                            className="space-y-4"
                        >
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
