'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
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
import { Combobox } from '@igrp/igrp-design-system';

interface RelationPopoverProps {
    field: any;
    changeValue: (element: string, value: any) => void;
    options: any;
}

export function RelationPopover({
    field,
    options,
    changeValue,
}: RelationPopoverProps) {
    const [open, setOpen] = useState(false);
    const { modelsOptions, models } = options;
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
    const [availableColumns, setAvailableColumns] = useState<{value: string, label: string}[]>([]);

    useEffect(() => {
        if (localRelation.entity) {
            const model = models.find((t) => t.name === localRelation.entity);
            if (model) {
                const targetTable = model.content.attributes.map((attr) => ({
                    value: attr.name,
                    label: attr.name,
                }));
                setAvailableColumns(targetTable || []);
            } else {
                setAvailableColumns([]);
            }
        } else {
            setAvailableColumns([]);
        }
    }, [localRelation.entity, models]);

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
                <div className="space-y-3">
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
                                type: value as 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany',
                            })
                        }
                        sourceField={field.name}
                        targetField={localRelation.entity || 'entity'}
                    />
                    <div className="grid grid-cols-2 gap-2">
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
                        <div className="space-y-2 flex flex-col">
                            <Label htmlFor="entity">Entity</Label>
                            <Combobox
                                name="entity"
                                value={localRelation.entity}
                                options={modelsOptions}
                                placeholder="Select target table"
                                onChange={(value) =>
                                    setLocalRelation({
                                        ...localRelation,
                                        entity: value,
                                        referencedColumnName: '',
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label htmlFor="referencedColumnName">
                                Reference Column Name
                            </Label>
                            <Combobox
                                name="entity"
                                value={localRelation.referencedColumnName}
                                options={availableColumns}
                                placeholder="Select reference column"
                                onChange={(value) =>
                                    setLocalRelation({
                                        ...localRelation,
                                        referencedColumnName: value,
                                    })
                                }
                            />
                        </div>
                    </div>

                    {(localRelation.cardinality === 'twoWay' ||
                        localRelation.type === 'ManyToMany') && (
                        <div className="space-y-2">
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
