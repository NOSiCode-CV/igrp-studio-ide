import {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
    memo,
} from 'react';
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
import { ITabelContainer } from '../generators/api/types/Interfaces';

/**********************************************************************
 *  Helper sub‑components                                              *
 **********************************************************************/

/**
 * Cell with "grouped" items (checkboxes / selects packed together)
 */
const GroupedItems: FunctionComponent<{
    items: any[];
    row: any;
    rowIndex: number;
    changeValue: (key: string, row: number, value: any) => void;
}> = memo(({ items, row, rowIndex, changeValue }) => {
    if (!items?.length) return null;

    return (
        <div className="flex gap-2 items-center">
            {items.map((item, i) => {
                const commonProps = {
                    key: i,
                    className: 'w-auto h-8',
                } as const;

                // single checkbox wrapped by tooltip for label
                if (item.type === 'checkbox') {
                    return (
                        <TooltipProvider key={i}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Checkbox
                                        id={`${item.key}_${rowIndex}`}
                                        onCheckedChange={(checked) =>
                                            changeValue(
                                                item.key,
                                                rowIndex,
                                                checked
                                            )
                                        }
                                        checked={row?.[item.key] || false}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>{item.name}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                }

                // simple select inside groups
                if (item.type === 'select') {
                    return (
                        <IGRPCombobox
                            {...commonProps}
                            placeholder={`Select ${item.name}`}
                            options={item.options || []}
                            value={row?.[item.key] ?? ''}
                            onChange={(val) =>
                                changeValue(item.key, rowIndex, val)
                            }
                            key={`${item.key}_${rowIndex}`}
                        />
                    );
                }

                // delegates to popover‑based editors
                if (item.type?.startsWith('popover')) {
                    const PopoverCmp =
                        item.type === 'popoverController'
                            ? PopoverController
                            : item.type === 'popoverModel'
                              ? PopoverModel
                              : item.type === 'popoverDto'
                                ? PopoverDto
                                : RelationPopover;

                    return (
                        <PopoverCmp
                            key={i}
                            row={row}
                            index={rowIndex}
                            changeValue={(
                                field: string,
                                posOrValue: any,
                                value?: any
                            ) => {
                                // normalise (PopoverModel passes position)
                                const finalValue = value ?? posOrValue;
                                changeValue(field, rowIndex, finalValue);
                            }}
                            options={item.options || []}
                            collectionTypes={item.options}
                            field={row}
                        />
                    );
                }
                return null;
            })}
        </div>
    );
});
GroupedItems.displayName = 'GroupedItems';

/**
 * Generic field renderer (input / select / custom popovers …)
 * Extracted from original `renderField` for clarity.
 */
const CellEditor: FunctionComponent<{
    type: string;
    row: any;
    rowIndex: number;
    columnKey: string;
    options: any;
    dynamicOptions: Record<string, any[]>;
    selectValue: any;
    selectMultiValues: any[];
    readonly?: boolean;
    formik: any;
    columns: any[];
    name: string;
    formData: any[];
    touched: any;
    errors: any;
    setFormData: (d: any) => void;
    changeValue: (key: string, row: number, value: any) => void;
    handleDependentChange: (key: string, row: number, value: any) => void;
}> = memo(
    ({
        type,
        row,
        rowIndex,
        columnKey,
        options,
        dynamicOptions,
        selectValue,
        selectMultiValues,
        readonly,
        changeValue,
        handleDependentChange,
        touched,
        errors,
    }) => {
        const [handleInput, setHandleInput] = useState(row?.[columnKey] || '');

        const handleChange = useCallback(
            (key: string, index: number, value: string) => {
                setHandleInput(value);
                changeValue(key, index, value);
            },
            [changeValue]
        );

        return (() => {
            switch (type) {
                case 'text':
                case 'number':
                    return (
                        <Input
                            key={`${rowIndex}-${columnKey}`}
                            className={cn(
                                'h-8 text-sm',
                                errors?.[columnKey]?.[rowIndex] &&
                                    touched?.[columnKey]?.[rowIndex]
                                    ? 'border-destructive'
                                    : ''
                            )}
                            type={type}
                            value={handleInput}
                            onChange={(e) => {
                                handleChange(
                                    columnKey,
                                    rowIndex,
                                    e.target.value
                                );
                            }}
                            readOnly={readonly}
                        />
                    );
                case 'label':
                    return (
                        <Label htmlFor={`${columnKey}_${rowIndex}`}>
                            {row?.[columnKey] || ''}
                        </Label>
                    );
                case 'select':
                    return (
                        <IGRPCombobox
                            key={`${rowIndex}-${columnKey}`}
                            placeholder={`Select ${columnKey}`}
                            options={
                                dynamicOptions[`${rowIndex}-${columnKey}`] ||
                                options
                            }
                            value={selectValue}
                            onChange={(val) =>
                                handleDependentChange(columnKey, rowIndex, val)
                            }
                            className="w-full h-8"
                        />
                    );
                case 'multiSelect':
                    return (
                        <MultipleSelector
                            placeholder={`Select ${columnKey}`}
                            options={
                                dynamicOptions[`${rowIndex}-${columnKey}`] ||
                                options
                            }
                            value={selectMultiValues}
                            onChange={(val) =>
                                changeValue(columnKey, rowIndex, val)
                            }
                        />
                    );
                case 'checkbox':
                    return (
                        <Checkbox
                            id={`${columnKey}_${rowIndex}`}
                            onCheckedChange={(checked) =>
                                changeValue(columnKey, rowIndex, checked)
                            }
                            checked={row?.[columnKey] || false}
                        />
                    );
                case 'popover':
                    return (
                        <PopoverController
                            row={row}
                            changeValue={(el, val) =>
                                changeValue(el, rowIndex, val)
                            }
                            options={options || []}
                        />
                    );
                case 'popoverModel':
                    return (
                        <PopoverModel
                            index={rowIndex}
                            row={row}
                            changeValue={(el, pos, val) =>
                                changeValue(el, pos, val)
                            }
                            options={options}
                        />
                    );
                case 'popoverDto':
                    return (
                        <PopoverDto
                            index={rowIndex}
                            row={row}
                            changeValue={(el, pos, val) =>
                                changeValue(el, pos, val)
                            }
                            collectionTypes={options}
                        />
                    );
                case 'popoverRelation':
                    return (
                        <RelationPopover
                            field={row}
                            changeValue={(el, val) =>
                                changeValue(el, rowIndex, val)
                            }
                            options={options || []}
                        />
                    );
                case 'typeSelectorDropdown':
                    return (
                        <TypeSelectorDropdown
                            type={row?.[columnKey] || ''}
                            onTypeChange={(dt) =>
                                changeValue(columnKey, rowIndex, dt)
                            }
                            schemaTypes={options}
                            variant="outline"
                        />
                    );
                default:
                    return null;
            }
        })();
    }
);

CellEditor.displayName = 'CellEditor';

/**********************************************************************
 * Main component                                                      *
 **********************************************************************/
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
    /********************** state + effects ***************************/
    const [formData, setFormData] = useState(data || []);
    const [dynamicOptions, setDynamicOptions] = useState<Record<string, any[]>>(
        {}
    );

    // keep internal state in sync with external data
    useEffect(() => setFormData(data), [data]);

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

    // initialise dependent fields once at mount / data change
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

    /********************** drag & drop *******************************/
    const onDragEnd = ({ source, destination }: any) => {
        if (
            !destination ||
            (source.droppableId === destination.droppableId &&
                source.index === destination.index)
        )
            return;
        const updated = [...formData];
        const [moved] = updated.splice(source.index, 1);
        updated.splice(destination.index, 0, moved);
        setFormData(updated);
        formik.setFieldValue(name, updated);
    };

    /********************** sub‑renders ******************************/
    const TableHeaderRow = () => (
        <TableHeader>
            <TableRow>
                {columns.map(({ name: colName, width }, i) => (
                    <TableHead style={{ width }} key={i}>
                        {i === 0 ? (
                            <span className="flex items-center">
                                <button className="me-1" disabled>
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </button>
                                {colName}
                            </span>
                        ) : (
                            colName
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
    );

    /**
     * Single table row extracted to its own component for readability.
     */
    const FormListRow: FunctionComponent<{
        row: any;
        rowIndex: number;
        className?: string;
    }> = ({ row, rowIndex, className }) => {
        const rowId = row.id || `row-${name}-${rowIndex}`;

        return (
            <Draggable draggableId={rowId} index={rowIndex} key={rowId}>
                {(provided) => (
                    <TableRow
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn('group/item')}
                    >
                        {columns.map((col, colIdx) => {
                            // helpers for select / multiSelect value mapping
                            const selectValue =
                                col.type === 'select'
                                    ? ((
                                          dynamicOptions?.[
                                              `${rowIndex}-${col.key}`
                                          ] || col.options
                                      )?.find(
                                          (opt: any) =>
                                              opt.value === row[col.key]
                                      )?.value ?? '')
                                    : '';
                            const selectMultiValues =
                                col.type === 'multiSelect'
                                    ? (col.options
                                          ?.filter((opt: any) =>
                                              row[col.key]?.includes(opt.value)
                                          )
                                          .map((opt: any) => opt.value) ?? [])
                                    : [];

                            return (
                                <TableCell
                                    key={colIdx}
                                    className={cn('py-1!', className)}
                                >
                                    <div className="flex">
                                        {colIdx === 0 && (
                                            <button
                                                className="opacity-0 group-hover/item:opacity-100 cursor-move me-1 p-0"
                                                {...provided.dragHandleProps}
                                            >
                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                        )}
                                        {col.type === 'group' &&
                                        col.items?.length ? (
                                            <GroupedItems
                                                items={col.items}
                                                row={row}
                                                rowIndex={rowIndex}
                                                changeValue={changeValue}
                                            />
                                        ) : (
                                            <CellEditor
                                                type={col.type}
                                                row={row}
                                                rowIndex={rowIndex}
                                                columnKey={col.key}
                                                options={col.options}
                                                dynamicOptions={dynamicOptions}
                                                selectValue={selectValue}
                                                selectMultiValues={
                                                    selectMultiValues
                                                }
                                                readonly={col.readonly}
                                                changeValue={changeValue}
                                                handleDependentChange={
                                                    handleDependentChange
                                                }
                                                formik={formik}
                                                columns={columns}
                                                name={name}
                                                formData={formData}
                                                setFormData={setFormData}
                                                touched={touched}
                                                errors={errors}
                                            />
                                        )}
                                    </div>
                                </TableCell>
                            );
                        })}
                        {removeRow && (
                            <TableCell className="py-1!">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive opacity-0 group-hover:item:opacity-100"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        removeRow(rowIndex);
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

    /********************** render ******************************/
    return (
        <>
            <FormErrors />
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId={name}>
                    {(prov) => (
                        <Table ref={prov.innerRef} {...prov.droppableProps}>
                            <TableHeaderRow />
                            <TableBody>
                                {formData.map((row, i) => {
                                    const isDataArray =
                                        row.options &&
                                        row?.options?.columns?.length > 0;

                                    return (
                                        <>
                                            <FormListRow
                                                key={row.id || i}
                                                row={row}
                                                rowIndex={i}
                                            />
                                            {isDataArray &&
                                                row?.options?.columns.map(
                                                    (col, ii) => {
                                                        return (
                                                            <FormListRow
                                                                key={
                                                                    col.id || ii
                                                                }
                                                                row={col}
                                                                rowIndex={ii}
                                                                className="pl-10"
                                                            />
                                                        );
                                                    }
                                                )}
                                        </>
                                    );
                                })}
                                {prov.placeholder}
                            </TableBody>
                        </Table>
                    )}
                </Droppable>
            </DragDropContext>
        </>
    );
};
