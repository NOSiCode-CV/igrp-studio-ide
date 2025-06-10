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
import { Button } from '@renderer/components/ui/button';
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
    const [dynamicOptions, setDynamicOptions] = useState({});

    // Atualiza o formData quando os dados mudam
    useEffect(() => {
        setFormData(data);
    }, [data]);

    // Atualiza campos dependentes
    const updateDependentFields = (key, index, selectedValue) => {
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
    const handleDependentChange = (key, index, selectedValue) => {
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
                                            <Button
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
                                            </Button>
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

    const renderGroupedItems = ({ items, row, index, index2 }: any) => {
        return (
            <div className="flex gap-2 align-center">
                {items.map((item, itemIndex) => {
                    const itemValue = row[item.key] || '';
                    const itemOptions = item.options || [];
                    return (
                        <div key={itemIndex} className="flex items-center">
                            {item.type === 'select' && (
                                <IGRPCombobox
                                    placeholder={`Select ${item.name}`}
                                    options={itemOptions || []}
                                    value={itemValue}
                                    onChange={(selectedOption) =>
                                        changeValue(
                                            item.key,
                                            index,
                                            selectedOption
                                        )
                                    }
                                    className="w-auto h-8"
                                />
                            )}
                            {item.type === 'checkbox' && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex align-center">
                                                <Checkbox
                                                    id={`${item.key}_${index2}`}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        changeValue(
                                                            item.key,
                                                            index,
                                                            checked
                                                        )
                                                    }
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
                            )}
                            {item.type === 'popoverController' && (
                                <PopoverController
                                    key={itemIndex}
                                    row={row}
                                    changeValue={(element, value) =>
                                        changeValue(element, index, value)
                                    }
                                    options={itemOptions || []}
                                />
                            )}
                            {item.type === 'popoverModel' && (
                                <PopoverModel
                                    key={itemIndex}
                                    index={index}
                                    row={row}
                                    changeValue={(element, position, value) =>
                                        changeValue(element, position, value)
                                    }
                                    options={itemOptions || []}
                                />
                            )}
                            {item.type === 'popoverDto' && (
                                <PopoverDto
                                    key={itemIndex}
                                    index={index}
                                    row={row}
                                    changeValue={(element, position, value) =>
                                        changeValue(element, position, value)
                                    }
                                    collectionTypes={itemOptions || []}
                                />
                            )}
                            {item.type === 'popoverRelation' &&
                                row['type'] === 'relation' && (
                                    <RelationPopover
                                        key={itemIndex}
                                        field={row}
                                        changeValue={(element, value) =>
                                            changeValue(element, index, value)
                                        }
                                        options={itemOptions || []}
                                    />
                                )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Renderização de campos específicos
    const renderField = (
        row,
        index,
        key,
        type,
        options,
        selectValue,
        selectMultiValues,
        readonly,
        onChangeValue
    ) => {
        switch (type) {
            case 'text':
            case 'number':
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
                            onChangeValue(key, index, ev.target.value)
                        }
                        readOnly={readonly}
                    />
                );
            case 'label':
                return (
                    <Label htmlFor={`${key}_${index}`}>
                        {row?.[key] || ''}
                    </Label>
                );
            case 'select':
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
            case 'multiSelect':
                return (
                    <MultipleSelector
                        placeholder={`Select ${name}`}
                        options={dynamicOptions[`${index}-${key}`] || options}
                        value={selectMultiValues}
                        onChange={(selectedOption) => {
                            onChangeValue(key, index, selectedOption);
                        }}
                    />
                );
            case 'checkbox':
                return (
                    <Checkbox
                        id={`${key}_${index}`}
                        onCheckedChange={(checked) =>
                            onChangeValue(key, index, checked)
                        }
                        checked={row?.[key] || false}
                    />
                );
            case 'popover':
                return (
                    <PopoverController
                        key={index}
                        row={row}
                        changeValue={(element, value) =>
                            onChangeValue(element, index, value)
                        }
                        options={options || []}
                    />
                );
            case 'popoverModel':
                return (
                    <PopoverModel
                        key={index}
                        index={index}
                        row={row}
                        changeValue={(element, position, value) =>
                            onChangeValue(element, position, value)
                        }
                        options={options}
                    />
                );
            case 'popoverDto':
                return (
                    <PopoverDto
                        key={index}
                        index={index}
                        row={row}
                        changeValue={(element, position, value) =>
                            onChangeValue(element, position, value)
                        }
                        collectionTypes={options}
                    />
                );
            case 'popoverRelation':
                return (
                    <RelationPopover
                        key={index}
                        field={row}
                        changeValue={(element, value) =>
                            changeValue(element, index, value)
                        }
                        options={options || []}
                    />
                );
            case 'typeSelectorDropdown':
                return (
                    <TypeSelectorDropdown
                        type={row?.[key] || ''}
                        onTypeChange={(dataType: any) =>
                            onChangeValue(key, index, dataType)
                        }
                        schemaTypes={options}
                        variant={'outline'}
                    />
                );
            default:
                return null;
        }
    };

    // Renderização das linhas da tabela
    const renderTableRow = (rowId, index, row, className, onChangeValue) => {
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
                                          (d) =>
                                              row[key] && d.value === row[key]
                                      )[0]?.value
                                    : '';
                                const selectMultiValues = [
                                    'multiSelect',
                                ].includes(type)
                                    ? options
                                          ?.filter((d) =>
                                              row[key]?.includes(d.value)
                                          )
                                          .map((d) => d.value)
                                    : [];
                                return (
                                    <TableCell
                                        key={index2}
                                        className={cn('py-1!', className)}
                                    >
                                        <div className="flex">
                                            {index2 === 0 && (
                                                <button
                                                    className="opacity-0 group-hover/item:opacity-100 cursor-move me-1 p-0"
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
                                                  })
                                                : renderField(
                                                      row,
                                                      index,
                                                      key,
                                                      type,
                                                      options,
                                                      selectValue,
                                                      selectMultiValues,
                                                      readonly,
                                                      onChangeValue
                                                  )}
                                        </div>
                                    </TableCell>
                                );
                            }
                        )}
                        {removeRow && (
                            <TableCell className="py-1!">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`text-destructive opacity-0 group-hover/item:opacity-100`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        removeRow(index);
                                    }}
                                >
                                    <Trash />
                                </Button>
                            </TableCell>
                        )}
                    </TableRow>
                )}
            </Draggable>
        );
    };

    const onChangeValue = (
        row: any,
        rowIndex: number,
        key: string,
        index: number,
        value: any
    ) => {
        //Chick if row is a subitems
        //TODO: Refatorar para usar o findFieldPath para pegar o path do campo
        if (row) {
            formik.setFieldValue(
                `${name}[${rowIndex}].options.columns[${index}].${key}`,
                value
            );
            changeValue(key, index, value);
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
                                        row.options &&
                                        row.options?.columns &&
                                        row.options.columns?.length > 0;

                                    return (
                                        <React.Fragment key={rowId}>
                                            {renderTableRow(
                                                rowId,
                                                index,
                                                row,
                                                '',
                                                (
                                                    key: string,
                                                    index: number,
                                                    value: any
                                                ) => {
                                                    onChangeValue(
                                                        '',
                                                        0,
                                                        key,
                                                        index,
                                                        value
                                                    );
                                                }
                                            )}
                                            {isDataArray &&
                                                row?.options?.columns.map(
                                                    (col: any, ii: number) =>
                                                        renderTableRow(
                                                            col.id ||
                                                                `col-${index}-${ii}`,
                                                            ii,
                                                            col,
                                                            'pl-10',
                                                            (
                                                                key: string,
                                                                _index: number,
                                                                value: any
                                                            ) => {
                                                                onChangeValue(
                                                                    row,
                                                                    index,
                                                                    key,
                                                                    ii,
                                                                    value
                                                                );
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
