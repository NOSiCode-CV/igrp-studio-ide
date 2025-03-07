import { useState, useRef, useEffect } from 'react';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { TableCell, TableRow } from '@renderer/components/ui/table';
import { Trash2, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { SchemaField } from '../../types/schema';
import { TypeSelectorDropdown } from '@renderer/components/TypeSelectorDropdown';
import { PopoverController } from '../../pages/controller/popover';

interface SchemaFieldRowProps {
    id: string;
    field: SchemaField;
    depth: number;
    onUpdate: (updatedField: SchemaField, index?: number) => void;
    onDelete: (index?: number) => void;
    onAddSubfield: (parentId: string, parentType: 'object' | 'array') => void;
    onAlert: (message: string | null) => void;
    isNew?: boolean;
    index?: number;
    schemaTypes?: { label: string; value: string }[];
    enumTypes?: { label: string; value: string }[];
}

export function SchemaFieldRow({
    id,
    field,
    depth,
    onUpdate,
    onDelete,
    onAddSubfield,
    onAlert,
    isNew = false,
    index,
    schemaTypes,
    enumTypes,
}: SchemaFieldRowProps) {
    if (!field) return;

    const [isExpanded, setIsExpanded] = useState(
        field.type === 'object' || field.type === 'array'
    );
    const [name, setName] = useState(field.name || '');
    const [type, setType] = useState<string>(field.type);
    const [description, setDescrition] = useState(field.description || '');

    const nameInputRef = useRef<HTMLInputElement>(null);
    const descInputRef = useRef<HTMLInputElement>(null);

    const isObjectEmpty =
        type === 'object' &&
        (!field.properties || Object.keys(field.properties).length === 0);

    useEffect(() => {
        if (isNew && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isNew]);

    useEffect(() => {
        setName(field.name || '');
        setType(field.type);
        setDescrition(field.description || '');
    }, [field]);

    const handleSave = () => {
        if (name.trim() === '') {
            onAlert('Field name cannot be empty. Please enter a valid name.');
            return;
        }
        const updatedField = { ...field, name, type, description };
        if ((type === 'object' || type === 'array') && !field.properties) {
            updatedField.properties = {};
        }
        onUpdate(updatedField, index);
        onAlert(null);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };

    const handleNameBlur = () => {
        if (name.trim() === '') {
            onAlert('Field name cannot be empty. Please enter a valid name.');
            return;
        }
        if (field.name !== name) {
            const isDuplicate = checkForDuplicateName(name);
            if (isDuplicate) {
                onAlert(
                    `Field name "${name}" is duplicate. Please choose a unique name.`
                );
            } else {
                handleSave();
            }
        }
    };

    const handleTypeChange = (newType: any) => {
        // Check if the field's value is an object
        const isValueObject = typeof newType === 'object' && newType !== null;

        const type = isValueObject ? newType.value : newType;

        const objectType = isValueObject ? newType.type : '';

        const updatedField = {
            ...field,
            type,
            objectType
        };

        if (type === 'object') {
            updatedField.properties = updatedField.properties || {};
            setIsExpanded(true);
        } else if (type === 'array') {
            updatedField.properties = updatedField.properties || {
                ['Items']: { type: 'string', name: 'Item 1', description: '' },
            };
            setIsExpanded(true);
        }else {
            delete updatedField.properties;
        }

        setType(type);

        onUpdate(updatedField, index);
    };

    const handleDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDescrition(e.target.value);
    };

    const handleDescBlur = () => {
        const updatedField = { ...field, name, type, description };
        onUpdate(updatedField, index);
    };

    const handleAddSubfield = () => {
        onAddSubfield(id, field.type as 'object' | 'array');
    };

    const checkForDuplicateName = (newName: string): boolean => {
        if ((type === 'object' || type === 'array') && field.properties) {
            return Object.keys(field.properties).some(
                (key) => key !== field.name && key === newName
            );
        }
        return false;
    };

    const renderSubfields = () => {
        if ((type === 'object' || type === 'array') && field.properties) {
            return Object.entries(field.properties).map(
                ([subId, subfield], subIndex) => (
                    <SchemaFieldRow
                        key={subId}
                        id={subId}
                        field={{ ...subfield, name: subId }}
                        depth={depth + 1}
                        onUpdate={(updatedSubfield) => {
                            const newProperties = {
                                ...field.properties,
                                [subId]: updatedSubfield,
                            };
                            onUpdate(
                                { ...field, properties: newProperties },
                                index
                            );
                        }}
                        onDelete={() => {
                                // @ts-ignore - Suppress TypeScript error for subId
                              const { [subId]: _, ...newProperties } =
                                field.properties; 
                            onUpdate(
                                { ...field, properties: newProperties },
                                index
                            );
                        }}
                        onAddSubfield={onAddSubfield}
                        onAlert={onAlert}
                        index={subIndex}
                        schemaTypes={schemaTypes}
                    />
                )
            );
        }
        return null;
    };

    return (
        <>
            <TableRow
                className={`group group/opt ${isNew ? 'bg-muted/50' : ''}`}
            >
                <TableCell
                    style={{ paddingLeft: `${depth * 28 + 8}px` }}
                    className="flex flex-1 py-1!"
                >
                    {(type === 'object' || type === 'array') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 mr-2"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronRight size={14} />
                            )}
                        </Button>
                    )}
                    <Input
                        ref={nameInputRef}
                        value={name}
                        onChange={handleNameChange}
                        onBlur={handleNameBlur}
                        className="w-full text-sm h-8"
                        placeholder={
                            index !== undefined && type === 'array'
                                ? `Item ${index + 1}`
                                : 'fieldName'
                        }
                    />
                </TableCell>
                <TableCell className="py-1!">
                    <div className="flex flex-1 items-center">
                        <TypeSelectorDropdown
                            type={type}
                            onTypeChange={(t) => handleTypeChange(t)}
                            schemaTypes={schemaTypes}
                        />
                        <PopoverController
                            row={field}
                            changeValue={(element, value) => {
                                // Create a new updated field object
                                const updatedField = {
                                    ...field,
                                    [element]: value,
                                };

                                // Pass the updated field and its index to the onUpdate function
                                onUpdate(updatedField, index);
                            }}
                            options={{ enumTypes }}
                        />
                    </div>
                </TableCell>
                <TableCell className="py-1!">
                    <Input
                        ref={descInputRef}
                        value={description}
                        onChange={handleDescChange}
                        onBlur={handleDescBlur}
                        className="w-full text-sm h-8"
                    />
                </TableCell>
                <TableCell className="text-right py-1!">
                    <div className="flex justify-end space-x-1 opacity-0 group-hover/opt:opacity-100">
                        {(type === 'object' || type === 'array') && (
                            <Button
                                onClick={handleAddSubfield}
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-green-500"
                            >
                                <Plus size={14} />
                                <span className="sr-only">Add Subfield</span>
                            </Button>
                        )}
                        <Button
                            onClick={() => onDelete(index)}
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500"
                        >
                            <Trash2 size={14} />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
            {isExpanded && (
                <>
                    {isObjectEmpty && (
                        <TableRow>
                            <TableCell
                                colSpan={3}
                                style={{
                                    paddingLeft: `${(depth + 1) * 20 + 8}px`,
                                }}
                            >
                                <Button
                                    variant="ghost"
                                    className="h-6 w-full text-sm text-muted-foreground justify-start"
                                    onClick={handleAddSubfield}
                                >
                                    No fields defined. Add
                                </Button>
                            </TableCell>
                        </TableRow>
                    )}
                    {renderSubfields()}
                </>
            )}
        </>
    );
}
