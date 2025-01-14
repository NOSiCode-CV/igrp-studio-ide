'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@renderer/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@renderer/components/ui/popover';
import { Label } from '@renderer/components/ui/label';
import { Input } from '@renderer/components/ui/input';
import { RelationTypeSelector } from './relation-type-selector';
import { Switch } from '@renderer/components/ui/Switch';

const tables = [
    { name: 'Users', columns: ['id', 'name', 'email'] },
    { name: 'Posts', columns: ['id', 'title', 'content', 'author_id'] },
    { name: 'Comments', columns: ['id', 'content', 'post_id', 'user_id'] },
];

interface RelationPopoverProps {
    field: any;
    changeValue: (element: string, value: any) => void;
}

export function RelationPopover({ field, changeValue }: RelationPopoverProps) {
    const [open, setOpen] = useState(false);

    const [localRelation, setLocalRelation] = useState(
        field.relation || {
            type: 'OneToOne',
            target: '',
            targetColumn: '',
            cardinality: 'oneWay',
            inversedBy: '',
        }
    );
    const [availableColumns, setAvailableColumns] = useState<string[]>([]);

    useEffect(() => {
        if (localRelation.target) {
            const targetTable = tables.find(
                (t) => t.name === localRelation.target
            );
            setAvailableColumns(targetTable?.columns || []);
        } else {
            setAvailableColumns([]);
        }
    }, [localRelation.target, tables]);

    const handleUpdate = () => {
        changeValue('relation', localRelation);
        setOpen(false);
    };

    return (
        <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
                <Button variant="link" className="w-full justify-start">
                    {field.relation && field.relation.target
                        ? `${field.relation.type} with ${field.relation.target}.${field.relation.targetColumn}`
                        : 'Set Relation'}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96">
                <div className="space-y-5">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">
                            Relation Settings
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Configure the relation for this field.
                        </p>
                    </div>
                    <RelationTypeSelector
                        value={localRelation.type}
                        onChange={(value) =>
                            setLocalRelation({
                                ...localRelation,
                                type: value,
                            })
                        }
                        sourceField={field.name}
                        targetField={localRelation.target || 'Target'}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-2">
                            <Label htmlFor="target">Target Table</Label>
                            <Select
                                value={localRelation.target}
                                onValueChange={(value) =>
                                    setLocalRelation({
                                        ...localRelation,
                                        target: value,
                                        targetColumn: '',
                                    })
                                }
                            >
                                <SelectTrigger id="target">
                                    <SelectValue placeholder="Select target table" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tables.map((table) => (
                                        <SelectItem
                                            key={table.name}
                                            value={table.name}
                                        >
                                            {table.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="targetColumn">Target Column</Label>
                            <Select
                                value={localRelation.targetColumn}
                                onValueChange={(value) =>
                                    setLocalRelation({
                                        ...localRelation,
                                        targetColumn: value,
                                    })
                                }
                            >
                                <SelectTrigger id="targetColumn">
                                    <SelectValue placeholder="Select target column" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableColumns.map((column) => (
                                        <SelectItem key={column} value={column}>
                                            {column}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="cardinality"
                            checked={localRelation.cardinality === 'twoWay'}
                            onCheckedChange={(checked) =>
                                setLocalRelation({
                                    ...localRelation,
                                    cardinality: checked ? 'twoWay' : 'oneWay',
                                })
                            }
                        />
                        <Label htmlFor="cardinality">
                            Two-way relationship
                        </Label>
                    </div>
                    {localRelation.cardinality === 'twoWay' && (
                        <div className="grid gap-2">
                            <Label htmlFor="inversedBy">
                                Field Name in {localRelation.target}
                            </Label>
                            <Input
                                id="inversedBy"
                                value={localRelation.inversedBy || ''}
                                onChange={(e) =>
                                    setLocalRelation({
                                        ...localRelation,
                                        inversedBy: e.target.value,
                                    })
                                }
                                placeholder="e.g., posts"
                            />
                        </div>
                    )}
                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => changeValue('relation', undefined)}
                        >
                            Remove Relation
                        </Button>
                        <Button onClick={handleUpdate}>Apply</Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
