import React, { FunctionComponent, useEffect, useState } from 'react';
import { ITabelContainer } from '../generators/api/types/Interfaces';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@renderer/components/ui/table';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Input } from '@renderer/components/ui/input';
import { GripVertical, Plus, Trash } from 'lucide-react';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import MultipleSelector from '@renderer/components/multiples-selector';
import { cn } from '@renderer/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { PopoverController } from '../generators/api/pages/controller/popover';
import { PopoverModel } from '../generators/api/pages/model/popover';
import { PopoverDto } from '../generators/api/pages/dto/popover-dto';
import { RelationPopover } from '../generators/api/pages/model/relation-popover';
import { TypeSelectorDropdown } from '@renderer/components/type-selector-dropdown';
import { Label } from './ui/label';
import { FormValidationPopover } from '../generators/ui/components/form-validation-popover';

// Component registry for popover types
const POPOVER_COMPONENTS = {
    popoverController: PopoverController,
    popoverModel: PopoverModel,
    popoverDto: PopoverDto,
    popoverFormValidation: FormValidationPopover,
    popoverRelation: RelationPopover,
} as const;

interface GroupField {
    groupName: string;
    groupIndex: number;
}

interface PopoverProps {
    row: any;
    index: number;
    onChangeValue: any;
    itemOptions: any;
    group?: GroupField;
}

interface ChangeFnProps {
    key: string;
    index: number;
    value: any;
    group?: GroupField;
}

// Props mapping for each popover type
const POPOVER_PROPS_MAPPING = {
    popoverController: (props: PopoverProps) => {
        const { row, index, onChangeValue, itemOptions, group } = props;
        return {
            index,
            row,
            changeValue: (element: string, value: any) =>
                onChangeValue({ key: element, index, value, group }),
            options: itemOptions || [],
        };
    },
    popoverModel: (props: PopoverProps) => {
        const { row, index, onChangeValue, itemOptions, group } = props;
        return {
            index,
            row,
            changeValue: (element: string, position: number, value: any) =>
                onChangeValue({ key: element, index: position, value, group }),
            options: itemOptions || [],
        };
    },
    popoverDto: (props: PopoverProps) => {
        const { row, index, onChangeValue, itemOptions, group } = props;
        return {
            index,
            row,
            changeValue: (element: string, position: number, value: any) =>
                onChangeValue({ key: element, index: position, value, group }),
            collectionTypes: itemOptions || [],
        };
    },
    popoverFormValidation: (props: PopoverProps) => {
        const { row, index, onChangeValue, group } = props;
        return {
            index,
            field: row,
            fieldType: row.type || 'string',
            changeValue: (element: string, position: number, value: any) =>
                onChangeValue({ key: element, index: position, value, group }),
        };
    },
    popoverRelation: (props: PopoverProps) => {
        const { row, index, onChangeValue, itemOptions, group } = props;
        return {
            field: row,
            changeValue: (element: string, value: any) => {
                onChangeValue({ key: element, index, value, group });
            },
            options: itemOptions || [],
        };
    },
} as const;

export const FormList: FunctionComponent<ITabelContainer> = ({
    data,
    formik,
    errors,
    touched,
    changeValue,
    addRow,
    removeRow,
    columns,
    name,
    btnLabels,
}) => {
    const [formData, setFormData] = useState(data || []);
    const [dynamicOptions, setDynamicOptions] = useState<Record<string, any[]>>(
        {}
    );

    // Atualiza o formData quando os dados mudam
    useEffect(() => {
        setFormData(data);
    }, [data]);

    // Atualiza campos dependentes
    const updateDependentFields = (
        key: string,
        index: number,
        selectedValue: any
    ) => {
        const dependentColumn = columns.find((col) => col.dependsOn === key);
        if (dependentColumn && dependentColumn.getOptions) {
            const updatedOptions = dependentColumn.getOptions(selectedValue);
            if (
                JSON.stringify(
                    dynamicOptions[`${index}-${dependentColumn.key}`]
                ) !== JSON.stringify(updatedOptions)
            ) {
                setDynamicOptions((prevOptions) => ({
                    ...prevOptions,
                    [`${index}-${dependentColumn.key}`]: updatedOptions,
                }));
            }
            const newValue = updatedOptions.length
                ? updatedOptions[0].value
                : '';
            if (formData[index][dependentColumn.key] !== newValue) {
                const updatedRow = {
                    ...formData[index],
                    [dependentColumn.key]: newValue,
                };
                const newFormData = [...formData];
                newFormData[index] = updatedRow;
                setFormData(newFormData);
            }
        }
    };

    // Atualiza campos dependentes ao carregar os dados
    useEffect(() => {
        if (formData && formData.length > 0)
            formData.forEach((row, index) => {
                columns.forEach((col) => {
                    if (col.dependsOn && row[col.dependsOn]) {
                        updateDependentFields(
                            col.dependsOn,
                            index,
                            row[col.dependsOn]
                        );
                    }
                });
            });
    }, [formData, columns]);

    // Função para atualizar as opções de um campo baseado em outro
    const handleDependentChange = (
        key: string,
        index: number,
        selectedValue: any
    ) => {
        changeValue(key, index, selectedValue);
        const dependentColumn = columns.find((col) => col.dependsOn === key);
        if (dependentColumn && dependentColumn.getOptions) {
            const updatedOptions = dependentColumn.getOptions(selectedValue);
            setDynamicOptions((prevOptions) => ({
                ...prevOptions,
                [`${index}-${dependentColumn.key}`]: updatedOptions,
            }));
        }
    };

    // Função de arrastar e soltar
    const onDragEnd = (result: any) => {
        const { source, destination } = result;
        if (!destination) return;
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }
        const updatedData = Array.from(formData);
        const [movedItem] = updatedData.splice(source.index, 1);
        updatedData.splice(destination.index, 0, movedItem);
        setFormData(updatedData);
        formik.setFieldValue(name, updatedData);
    };

    /********************** errors ******************************/
    const FormErrors = () =>
        Array.isArray(errors) ? (
            <div className="px-3">
                {errors.map((err, idx) => {
                    if (typeof err === 'string')
                        return (
                            <p
                                key={idx}
                                className="text-xs text-destructive italic"
                            >
                                {err}
                            </p>
                        );
                    if (typeof err === 'object' && err !== null)
                        return Object.entries(err).map(([k, msg], subIdx) =>
                            msg ? (
                                <p
                                    key={`${idx}-${subIdx}`}
                                    className="text-xs text-destructive italic"
                                >
                                    <strong>{k.toUpperCase()}: </strong>
                                    {msg as string}
                                </p>
                            ) : null
                        );
                    return null;
                })}
            </div>
        ) : null;

    // Renderização do cabeçalho da tabela
    const renderTableHeader = () => {
        return (
            <>
                <TableHeader>
                    <TableRow>
                        {columns.map(({ name, width }, index) => (
                            <TableHead style={{ width }} key={index}>
                                {index === 0 ? (
                                    <span className="flex items-center">
                                        <button className="me-1" disabled>
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                        {name}
                                    </span>
                                ) : (
                                    name
                                )}
                            </TableHead>
                        ))}
                        <TableHead className="text-right">
                            {addRow && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <IGRPButtonPrimitive
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    addRow();
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="text-igrp h-6 w-6"
                                            >
                                                <Plus size={14} />
                                                <span className="sr-only">{`New ${btnLabels}`}</span>
                                            </IGRPButtonPrimitive>
                                        </TooltipTrigger>
                                        <TooltipContent>{`New ${btnLabels}`}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </TableHead>
                    </TableRow>
                </TableHeader>
            </>
        );
    };

    // Optimized grouped items renderer using component registry
    const renderGroupedItems = ({
        items,
        row,
        index,
        index2,
        group,
        onChangeValue,
    }: any) => {
        return (
            <div className="flex gap-2 align-center">
                {items.map((item: any, itemIndex: number) => {
                    const itemValue = row?.[item.key] || '';
                    const itemOptions = item.options || [];

                    if (!row) return null;

                    // Handle select component
                    if (item.type === 'select') {
                        return (
                            <div key={itemIndex} className="flex items-center">
                                <IGRPCombobox
                                    placeholder={`Select ${item.name}`}
                                    options={itemOptions || []}
                                    value={itemValue}
                                    onChange={(selectedOption) =>
                                        onChangeValue({
                                            key: item.key,
                                            index: index,
                                            value: selectedOption,
                                            group: group,
                                        })
                                    }
                                    className="w-auto h-8"
                                />
                            </div>
                        );
                    }

                    // Handle checkbox component
                    if (item.type === 'checkbox') {
                        return (
                            <div key={itemIndex} className="flex items-center">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex align-center">
                                                <Checkbox
                                                    id={`${item.key}_${index2}`}
                                                    onCheckedChange={(
                                                        checked
                                                    ) => {
                                                        onChangeValue({
                                                            key: item.key,
                                                            index: index,
                                                            value: checked,
                                                            group: group,
                                                        });
                                                    }}
                                                    checked={
                                                        row?.[item.key] || false
                                                    }
                                                />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {item.name}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        );
                    }

                    // Handle popover components using registry
                    if (
                        POPOVER_COMPONENTS[
                            item.type as keyof typeof POPOVER_COMPONENTS
                        ]
                    ) {
                        const PopoverComponent =
                            POPOVER_COMPONENTS[
                                item.type as keyof typeof POPOVER_COMPONENTS
                            ];
                        const propsMapping =
                            POPOVER_PROPS_MAPPING[
                                item.type as keyof typeof POPOVER_PROPS_MAPPING
                            ];

                        // Special case for popoverRelation
                        if (
                            item.type === 'popoverRelation' &&
                            row['type'] !== 'relation'
                        ) {
                            return null;
                        }
                        const props = propsMapping({
                            row,
                            index,
                            onChangeValue,
                            itemOptions,
                            group,
                        });

                        return (
                            <div key={itemIndex} className="flex items-center">
                                <PopoverComponent {...(props as any)} />
                            </div>
                        );
                    }

                    return null;
                })}
            </div>
        );
    };

    // Optimized field renderer using component registry
    const renderField = (
        row: any,
        index: number,
        key: string,
        type: string,
        options: any,
        selectValue: any,
        selectMultiValues: any,
        readonly: boolean,
        onChangeValue: (props: ChangeFnProps) => void,
        group?: GroupField
    ) => {
        // Handle input types (text, number)
        if (type === 'text' || type === 'number') {
            return (
                <Input
                    className={cn(
                        'h-8 text-sm',
                        errors?.[index]?.[key] && touched?.[index]?.[key]
                            ? 'border-destructive'
                            : ''
                    )}
                    type={type}
                    value={row?.[key] || ''}
                    onChange={(ev) =>
                        onChangeValue({
                            key,
                            index,
                            value: ev.target.value,
                            group,
                        })
                    }
                    readOnly={readonly}
                />
            );
        }

        // Handle label type
        if (type === 'label') {
            return (
                <Label htmlFor={`${key}_${index}`}>{row?.[key] || ''}</Label>
            );
        }

        // Handle select type
        if (type === 'select') {
            return (
                <IGRPCombobox
                    key={`${index}-${key}`}
                    placeholder={`Select ${key}`}
                    options={dynamicOptions[`${index}-${key}`] || options}
                    value={selectValue}
                    onChange={(selectedOption) =>
                        handleDependentChange(key, index, selectedOption)
                    }
                    className="w-full h-8"
                />
            );
        }

        // Handle multiSelect type
        if (type === 'multiSelect') {
            return (
                <MultipleSelector
                    placeholder={`Select ${name}`}
                    options={dynamicOptions[`${index}-${key}`] || options}
                    value={selectMultiValues}
                    onChange={(selectedOption) => {
                        onChangeValue({
                            key,
                            index,
                            value: selectedOption,
                            group,
                        });
                    }}
                />
            );
        }

        // Handle checkbox type
        if (type === 'checkbox') {
            return (
                <Checkbox
                    id={`${key}_${index}`}
                    onCheckedChange={(checked) =>
                        onChangeValue({
                            key,
                            index,
                            value: checked,
                            group,
                        })
                    }
                    checked={row?.[key] || false}
                />
            );
        }

        // Handle popover types using registry
        if (type in POPOVER_COMPONENTS) {
            const PopoverComponent =
                POPOVER_COMPONENTS[type as keyof typeof POPOVER_COMPONENTS];
            const propsMapping =
                POPOVER_PROPS_MAPPING[
                    type as keyof typeof POPOVER_PROPS_MAPPING
                ];

            // Special case for popoverRelation
            if (type === 'popoverRelation' && row['type'] !== 'relation') {
                return null;
            }

            const props = propsMapping({
                row,
                index,
                onChangeValue,
                itemOptions: options,
                group,
            });

            return <PopoverComponent {...(props as any)} />;
        }

        // Handle typeSelectorDropdown
        if (type === 'typeSelectorDropdown') {
            return (
                <TypeSelectorDropdown
                    key={`${index}-${key}`}
                    type={row?.[key] || ''}
                    onTypeChange={(dataType: any) =>
                        onChangeValue({
                            key,
                            index,
                            value: dataType,
                            group,
                        })
                    }
                    schemaTypes={options || []}
                    variant={'outline'}
                />
            );
        }

        // Default case - return null or a fallback component
        return null;
    };

    // Renderização das linhas da tabela
    const renderTableRow = (
        rowId: string,
        index: number,
        row: any,
        className: string,
        onChangeValue: (props: ChangeFnProps) => void,
        group?: GroupField
    ) => {
        return (
            <Draggable key={rowId + '-col'} draggableId={rowId} index={index}>
                {(provided: any) => (
                    <TableRow
                        className={`group/item`}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                    >
                        {columns.map(
                            (
                                { key, type, options, items, readonly },
                                index2
                            ) => {
                                const selectValue = ['select'].includes(type)
                                    ? (
                                          dynamicOptions?.[`${index}-${key}`] ||
                                          options
                                      )?.filter(
                                          (d: any) =>
                                              row[key] && d.value === row[key]
                                      )[0]?.value
                                    : '';
                                const selectMultiValues = [
                                    'multiSelect',
                                ].includes(type)
                                    ? options
                                          ?.filter((d: any) =>
                                              row[key]?.includes(d.value)
                                          )
                                          .map((d: any) => d.value)
                                    : [];
                                return (
                                    <TableCell
                                        key={index2}
                                        className={cn('py-1!')}
                                    >
                                        <div className="flex">
                                            {index2 === 0 && (
                                                <button
                                                    className={cn("opacity-0 group-hover/item:opacity-100 cursor-move me-1 p-0", className)}
                                                    {...provided.dragHandleProps}
                                                >
                                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                            )}
                                            {type === 'group' &&
                                            items &&
                                            items?.length > 0
                                                ? renderGroupedItems({
                                                      items,
                                                      row,
                                                      index,
                                                      index2,
                                                      group,
                                                      onChangeValue,
                                                  })
                                                : renderField(
                                                      row,
                                                      index,
                                                      key,
                                                      type,
                                                      options,
                                                      selectValue,
                                                      selectMultiValues,
                                                      readonly || false,
                                                      onChangeValue,
                                                      group
                                                  )}
                                        </div>
                                    </TableCell>
                                );
                            }
                        )}
                        {removeRow && (
                            <TableCell className="py-1!">
                                <IGRPButtonPrimitive
                                    variant="ghost"
                                    size="icon"
                                    className={`text-destructive opacity-0 group-hover/item:opacity-100`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        removeRow(index);
                                    }}
                                >
                                    <Trash />
                                </IGRPButtonPrimitive>
                            </TableCell>
                        )}
                    </TableRow>
                )}
            </Draggable>
        );
    };

    const onChangeValue = (props: ChangeFnProps) => {
        const { key, index, value, group } = props;
        //Chick if row is a subitems
        //TODO: Refatorar para usar o findFieldPath para pegar o path do campo

        if (group) {
            formik.setFieldValue(
                `${name}[${group.groupIndex}].${group.groupName}[${index}].${key}`,
                value
            );
        } else changeValue(key, index, value);
    };

    // Renderização do componente completo
    return (
        <>
            <FormErrors />
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId={`${name}`}>
                    {(provided: any) => (
                        <Table
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {renderTableHeader()}
                            <TableBody>
                                {formData.map((row: any, index: number) => {
                                    const rowId =
                                        row.id || `row-${name}-${index}`;
                                    const isDataArray =
                                        row.fields && row.fields.length > 0;

                                    return (
                                        <React.Fragment key={rowId}>
                                            {renderTableRow(
                                                rowId,
                                                index,
                                                row,
                                                '',
                                                (props: ChangeFnProps) => {
                                                    onChangeValue(props);
                                                }
                                            )}
                                            {isDataArray &&
                                                row?.fields.map(
                                                    (col: any, ii: number) =>
                                                        renderTableRow(
                                                            `col-${index}-${ii}`,
                                                            ii,
                                                            col,
                                                            'mr-6',
                                                            (
                                                                props: ChangeFnProps
                                                            ) => {
                                                                onChangeValue({
                                                                    ...props,
                                                                    group: {
                                                                        groupName:
                                                                            'fields',
                                                                        groupIndex:
                                                                            index,
                                                                    },
                                                                });
                                                            },
                                                            {
                                                                groupName:
                                                                    'fields',
                                                                groupIndex:
                                                                    index,
                                                            }
                                                        )
                                                )}
                                        </React.Fragment>
                                    );
                                })}
                                {provided.placeholder}
                            </TableBody>
                        </Table>
                    )}
                </Droppable>
            </DragDropContext>
        </>
    );
};
