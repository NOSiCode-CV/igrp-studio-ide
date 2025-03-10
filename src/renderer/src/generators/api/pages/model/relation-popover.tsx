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
import { Switch } from '@renderer/components/ui/switch';
import { Relation } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { useTranslation } from 'react-i18next'; // Import useTranslation

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
    const { t } = useTranslation(); // Hook for translations
    const [open, setOpen] = useState(false);
    const { modelsOptions, models } = options;
    const [localRelation, setLocalRelation] = useState<Relation>(
        field.relation || {
            type: 'OneToOne',
            entity: '',
            referencedColumnName: '',
            cardinality: 'oneWay',
            inverseJoinColumn: '',
            joinTable: '', // Name of the intermediate table
        }
    );
    const [availableColumns, setAvailableColumns] = useState<
        { value: string; label: string }[]
    >([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (localRelation.entity) {
            const model = models.find(
                (t) => t.content.name === localRelation.entity
            );
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
        // Validate required fields
        if (!localRelation.entity) {
            setErrors({ ['entity']: t('entityRequired') });
            return;
        }
        if (!localRelation.referencedColumnName) {
            setErrors({
                ['referencedColumnName']: t('referencedColumnNameRequired'),
            });
            return;
        }
        if (localRelation.type === 'ManyToMany' && !localRelation.joinTable) {
            setErrors({ ['joinTable']: t('joinTableRequired') });
            return;
        }

        // Clear any previous errors
        setErrors({});

        // Update the relation
        changeValue('relation', localRelation);
        setOpen(false);
    };

    return (
        <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
                <Button variant="link" className="w-full justify-start">
                    {field.relation && field.relation.entity
                        ? `${field.relation.type} ${t('with')} ${field.relation.entity}.${field.relation.referencedColumnName}`
                        : t('setRelation')}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-100">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">
                            {t('relationSettings')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            {t('configureRelationForField')}
                        </p>
                    </div>
                    <RelationTypeSelector
                        value={localRelation.type}
                        onChange={(value) =>
                            setLocalRelation({
                                ...localRelation,
                                type: value as
                                    | 'OneToOne'
                                    | 'OneToMany'
                                    | 'ManyToOne'
                                    | 'ManyToMany',
                            })
                        }
                        sourceField={field.name}
                        targetField={localRelation.entity || 'entity'}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        {localRelation.type === 'ManyToMany' && (
                            <div className="col-span-2 gap-2">
                                <Label htmlFor="joinTable">
                                    {t('entityName')}
                                </Label>
                                <Input
                                    id="joinTable"
                                    value={localRelation.joinTable || ''}
                                    onChange={(e) =>
                                        setLocalRelation({
                                            ...localRelation,
                                            joinTable: e.target.value,
                                        })
                                    }
                                    placeholder={t('entityNamePlaceholder')}
                                />
                                <p className="text-xs text-muted-foreground ">
                                    {t('entityNameDescription')}
                                </p>
                                {errors.joinTable && (
                                    <p className="text-xs text-red-500">
                                        {errors.joinTable}
                                    </p>
                                )}
                            </div>
                        )}
                        <div className="space-y-2 flex flex-col">
                            <Label htmlFor="entity">{t('entity')}</Label>
                            <IGRPCombobox
                                value={localRelation.entity}
                                options={modelsOptions}
                                placeholder={t('selectTargetTable')}
                                onChange={(value) =>
                                    setLocalRelation({
                                        ...localRelation,
                                        entity: value,
                                        referencedColumnName: '',
                                    })
                                }
                            />
                            {errors.entity && (
                                <p className="text-xs text-red-500">
                                    {errors.entity}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label htmlFor="referencedColumnName">
                                {t('referenceColumnName')}
                            </Label>
                            <IGRPCombobox
                                value={localRelation.referencedColumnName}
                                options={availableColumns}
                                placeholder={t('selectReferenceColumn')}
                                onChange={(value) =>
                                    setLocalRelation({
                                        ...localRelation,
                                        referencedColumnName: value,
                                    })
                                }
                            />
                            {errors.referencedColumnName && (
                                <p className="text-xs text-red-500">
                                    {errors.referencedColumnName}
                                </p>
                            )}
                        </div>
                    </div>

                    {(localRelation.cardinality === 'twoWay' ||
                        localRelation.type === 'ManyToMany') && (
                        <div className="space-y-2">
                            <Label htmlFor="inverseJoinColumn">
                                {t('fieldNameIn')}{' '}
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
                                placeholder={t('fieldNamePlaceholder')}
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
                            {t('twoWayRelationship')}
                        </Label>
                    </div>
                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => changeValue('relation', undefined)}
                        >
                            {t('removeRelation')}
                        </Button>
                        <Button onClick={handleUpdate}>{t('apply')}</Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
