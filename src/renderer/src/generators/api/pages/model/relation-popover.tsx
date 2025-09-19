'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronsUpDown } from 'lucide-react';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@renderer/components/ui/popover';
import { Label } from '@renderer/components/ui/label';
import { Input } from '@renderer/components/ui/input';
import { RelationTypeSelector } from './relation-type-selector';
import {
    CascadeTypes,
    Relation,
    RelationshipTypes,
} from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { useTranslation } from 'react-i18next';
import { formatMethods } from '../../helpers';
import { Switch } from '@renderer/components/ui/switch';
import { LabelRequired } from '@renderer/components/label-required';
import { TypeSelectorDropdown } from '@renderer/components/type-selector-dropdown';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import MultipleSelector from '@renderer/components/multiples-selector';

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
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const { modelsOptions, models } = options;

    const [localRelation, setLocalRelation] = useState<Relation>(
        field.relation || {
            type: 'OneToOne',
            entity: '',
            referencedColumnName: '',
            cardinality: 'twoWay',
            inverseJoinColumn: '',
            joinTable: '',
            fetchType: 'lazy',
            mappedBy: '',
            module: '',
            cascadeType: [],
            orphanRemoval: false,
        }
    );
    const [availableColumns, setAvailableColumns] = useState<
        { value: string; label: string }[]
    >([]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchTypes = formatMethods(['lazy', 'eager']);
    const cascadeTypes = formatMethods([
        'ALL',
        'PERSIST',
        'MERGE',
        'REMOVE',
        'REFRESH',
        'DETACH',
    ]);

    useEffect(() => {
        if (localRelation.entity) {
            const model = models.find(
                (t: any) => t.content.name === localRelation.entity
            );
            if (model) {
                const targetTable = model.content.attributes.map((attr: any) => ({
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
        if (!localRelation.entity) {
            setErrors({ ['entity']: t('entityRequired') });
            return;
        }
        if (!localRelation.fetchType) {
            setErrors({
                ['fetchType']: t('fieldRequired', { name: 'Fetch Type' }),
            });
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

        setErrors({});

        changeValue('relation', localRelation);
        setOpen(false);
    };

    return (
        <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
                <IGRPButtonPrimitive variant="link" className="w-full justify-start">
                    {field.relation && field.relation.entity
                        ? `${field.relation.type} ${t('with')} ${field.relation.entity}.${field.relation.referencedColumnName}`
                        : t('setRelation')}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                </IGRPButtonPrimitive>
            </PopoverTrigger>
            <PopoverContent className="w-100 space-y-3">
                <Tabs defaultValue="relationSettings">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="relationSettings">
                            {t('relationSettings')}
                        </TabsTrigger>
                        <TabsTrigger value="others">{t('others')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="relationSettings" className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    {t('configureRelationForField')}
                                </p>
                            </div>
                            <RelationTypeSelector
                                value={localRelation.type}
                                onChange={(value) =>
                                    setLocalRelation({
                                        ...localRelation,
                                        type: value as RelationshipTypes,
                                    })
                                }
                                sourceField={field.name}
                                targetField={localRelation.entity || 'entity'}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                {localRelation.type === 'ManyToMany' && (
                                    <div className="col-span-2 space-y-2 flex flex-col">
                                        <Label htmlFor="joinTable">
                                            {t('entityName')}
                                        </Label>
                                        <div>
                                            <Input
                                                id="joinTable"
                                                value={
                                                    localRelation.joinTable ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    setLocalRelation({
                                                        ...localRelation,
                                                        joinTable:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder={t(
                                                    t('entityNamePlaceholder')
                                                )}
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
                                    </div>
                                )}
                                <div className="space-y-2 flex flex-col">
                                    <Label htmlFor="entity">
                                        {t('entity')}
                                    </Label>
                                    <TypeSelectorDropdown
                                        type={localRelation.entity}
                                        onTypeChange={({ value, module }) =>
                                            setLocalRelation({
                                                ...localRelation,
                                                module,
                                                entity: value,
                                                referencedColumnName: '',
                                            })
                                        }
                                        schemaTypes={modelsOptions}
                                        className={'w-full h-9 text-gray-500'}
                                        variant={'outline'}
                                    >
                                        <ChevronsUpDown />
                                    </TypeSelectorDropdown>
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
                                        value={
                                            localRelation.referencedColumnName
                                        }
                                        options={availableColumns}
                                        onChange={(value) =>
                                            setLocalRelation({
                                                ...localRelation,
                                                referencedColumnName: value as string,
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

                            {localRelation.cardinality === 'twoWay' &&
                                localRelation.type === 'ManyToMany' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="inverseJoinColumn">
                                            {t('fieldNameIn')}{' '}
                                            {localRelation.joinTable}
                                        </Label>
                                        <Input
                                            id="inverseJoinColumn"
                                            value={
                                                localRelation.inverseJoinColumn ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setLocalRelation({
                                                    ...localRelation,
                                                    inverseJoinColumn:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder={t(
                                                t('fieldNamePlaceholder')
                                            )}
                                        />
                                    </div>
                                )}

                            {(localRelation.cardinality === 'twoWay' ||
                                localRelation.type === 'OneToMany') &&
                                localRelation.type !== 'ManyToMany' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="mappedBy">
                                            {t('fieldNameIn')}{' '}
                                            {localRelation.entity}
                                        </Label>
                                        <Input
                                            id="mappedBy"
                                            value={localRelation.mappedBy || ''}
                                            onChange={(e) =>
                                                setLocalRelation({
                                                    ...localRelation,
                                                    mappedBy: e.target.value,
                                                })
                                            }
                                            placeholder={t(
                                               t('fieldNamePlaceholder')
                                            )}
                                        />
                                    </div>
                                )}

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="cardinality"
                                    checked={
                                        localRelation.cardinality === 'twoWay'
                                    }
                                    onCheckedChange={(checked) =>
                                        setLocalRelation({
                                            ...localRelation,
                                            cardinality: checked
                                                ? 'twoWay'
                                                : 'oneWay',
                                        })
                                    }
                                />
                                <Label htmlFor="cardinality">
                                    {t('twoWayRelationship')}
                                </Label>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="others" className="space-y-4">
                        <div className="space-y-2 flex flex-col">
                            <LabelRequired>{t('fetchType')}</LabelRequired>
                            <IGRPCombobox
                                value={localRelation.fetchType}
                                options={fetchTypes}
                                onChange={(value) =>
                                    setLocalRelation({
                                        ...localRelation,
                                        fetchType: value as 'lazy' | 'eager',
                                    })
                                }
                                required
                            />
                            {errors.fetchType && (
                                <p className="text-xs text-red-500">
                                    {errors.fetchType}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="Orphan Removal"
                                checked={localRelation.orphanRemoval}
                                onCheckedChange={(checked) =>
                                    setLocalRelation({
                                        ...localRelation,
                                        orphanRemoval: checked,
                                    })
                                }
                            />
                            <Label htmlFor="orphanRemoval">
                                {t('orphanRemoval')}
                            </Label>
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <LabelRequired>{t('cascadeType')}</LabelRequired>
                            <MultipleSelector
                                value={
                                    localRelation?.cascadeType?.map(
                                        (item) => item.type
                                    ) || []
                                }
                                options={cascadeTypes}
                                onChange={(selectedValues: string[]) => {
                                    setLocalRelation({
                                        ...localRelation,
                                        cascadeType: selectedValues.map(
                                            (value) => ({ type: value as CascadeTypes })
                                        ),
                                    });
                                }}
                                placeholder={t('selectCascadeTypes')}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
                <div className="flex justify-between">
                    <IGRPButtonPrimitive
                        variant="outline"
                        onClick={() => changeValue('relation', undefined)}
                    >
                        {t('removeRelation')}
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive onClick={handleUpdate}>{t('apply')}</IGRPButtonPrimitive>
                </div>
            </PopoverContent>
        </Popover>
    );
}
