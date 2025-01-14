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
import { Relation } from '@igrp/spring-engine/dist/interfaces/types';

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

    const [localRelation, setLocalRelation] = useState<Relation>(
        field.relation || {
            type: 'OneToOne',
            entity: '',
            referencedColumnName: '',
            cardinality: 'oneWay',
            inverseJoinColumn: '',
            joinTable: '', //Name of the intermediate table
        }
    );
    const [availableColumns, setAvailableColumns] = useState<string[]>([]);

    useEffect(() => {
        if (localRelation.entity) {
            const targetTable = tables.find(
                (t) => t.name === localRelation.entity
            );
            setAvailableColumns(targetTable?.columns || []);
        } else {
            setAvailableColumns([]);
        }
    }, [localRelation.entity, tables]);

    const handleUpdate = () => {
        changeValue('relation', localRelation);
        setOpen(false);
    };

    return (
        <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
                <Button variant="link" className="w-full justify-start">
                    {field.relation && field.relation.entity
                        ? `${field.relation.type} with ${field.relation.entity}.${field.relation.referencedColumnName}`
                        : 'Set Relation'}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-100">
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
                        targetField={localRelation.entity || 'entity'}
                    />
                    <div className="grid grid-cols-2 gap-2 space-y-5">
                        {localRelation.type === 'ManyToMany' && (
                            <div className="col-span-2 gap-2">
                                <Label htmlFor="joinTable">Entity Name</Label>
                                <Input
                                    id="joinTable"
                                    value={localRelation.joinTable || ''}
                                    onChange={(e) =>
                                        setLocalRelation({
                                            ...localRelation,
                                            joinTable: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., UserRole"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Name of the intermediate table, for example
                                    "UserRole".
                                </p>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="entity">Entity</Label>
                            <Select
                                value={localRelation.entity}
                                onValueChange={(value) =>
                                    setLocalRelation({
                                        ...localRelation,
                                        entity: value,
                                        referencedColumnName: '',
                                    })
                                }
                            >
                                <SelectTrigger id="entity">
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
                            <Label htmlFor="referencedColumnName">
                                Reference Column Name
                            </Label>
                            <Select
                                value={localRelation.referencedColumnName}
                                onValueChange={(value) =>
                                    setLocalRelation({
                                        ...localRelation,
                                        referencedColumnName: value,
                                    })
                                }
                            >
                                <SelectTrigger id="referencedColumnName">
                                    <SelectValue placeholder="Select reference column" />
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

                    {(localRelation.cardinality === 'twoWay' ||
                        localRelation.type === 'ManyToMany') && (
                        <div className="grid gap-2">
                            <Label htmlFor="inverseJoinColumn">
                                Field Name in{' '}
                                {localRelation.joinTable ||
                                    localRelation.entity}
                            </Label>
                            <Input
                                id="inverseJoinColumn"
                                value={localRelation.inverseJoinColumn || ''}
                                onChange={(e) =>
                                    setLocalRelation({
                                        ...localRelation,
                                        inverseJoinColumn: e.target.value,
                                    })
                                }
                                placeholder="e.g., posts"
                            />
                        </div>
                    )}
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
