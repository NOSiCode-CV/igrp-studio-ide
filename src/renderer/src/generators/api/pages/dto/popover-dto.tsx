import { Combobox } from '@igrp/igrp-framework-react-design-system';
import { Button } from '@renderer/components/ui/button';
import { Switch } from '@renderer/components/ui/switch';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@renderer/components/ui/popover';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toInitCap } from '@renderer/utils/helpers';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { PackageCheck } from 'lucide-react';
import { Separator } from '@renderer/components/ui/separator';

interface PopoverDtoProps {
    children?: ReactNode;
    index: number;
    row: any;
    collectionTypes: any[];
    changeValue: (element: string, position: number, value: any) => void;
}

export function PopoverDto({
    index,
    row,
    collectionTypes,
    changeValue,
}: PopoverDtoProps) {
    const { t } = useTranslation();

    const [isInteger, setIsInteger] = useState(false);
    const [isBoolean, setIsBoolean] = useState(false);

    useEffect(() => {
        setIsInteger(
            row?.['type'] === 'integer' ||
                row?.['type'] === 'long' ||
                row?.['type'] === 'biginteger' ||
                row?.['type'] === 'double'
        );
        setIsBoolean(row?.['type'] === 'boolean');
    }, [row]);

    const shouldShowField = (field: string) => {
        if (field === 'positive') {
            return isInteger; // Show "positive" only for integer types
        }
        if (field === 'isEmail' || field === 'isUrl') {
            return !isBoolean && !isInteger;
        }
        return true;
    };

    return (
        <Popover>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center"
                            size={'icon'}
                        >
                            <PackageCheck className="w-4 h-4" />
                            <span className="sr-only">{t('advanced')}</span>
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                    {t('openAdvancedSettings')}
                </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-100" align="end" side="bottom">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Tabs defaultValue="validations">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="validations">
                                    {t('validations')}
                                </TabsTrigger>
                                <TabsTrigger value="others">
                                    {t('others')}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent
                                value="validations"
                                className="space-y-4"
                            >
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t('setValidationsForDataObjects')}
                                </p>
                                <div className="flex flex-1 gap-2">
                                    {['required', 'before', 'after'].map(
                                        (field) => (
                                            <div
                                                key={`${field}-${index}`}
                                                className="flex flex-1 items-center gap-4"
                                            >
                                                <Label
                                                    htmlFor={`${field}-${index}`}
                                                >
                                                    {toInitCap(t(field))}
                                                </Label>
                                                <Switch
                                                    id={`${field}-${index}`}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        changeValue(
                                                            field,
                                                            index,
                                                            checked
                                                        )
                                                    }
                                                    checked={
                                                        row?.[field] || false
                                                    }
                                                />
                                            </div>
                                        )
                                    )}
                                </div>
                                <Separator orientation="horizontal" />
                                <div className="flex flex-1 gap-2">
                                    {['positive', 'isEmail', 'isUrl']
                                        .filter((field) =>
                                            shouldShowField(field)
                                        )
                                        .map((field) => (
                                            <div
                                                key={`${field}-${index}`}
                                                className="flex flex-1 items-center gap-4"
                                            >
                                                <Label
                                                    htmlFor={`${field}-${index}`}
                                                >
                                                    {toInitCap(t(field))}
                                                </Label>
                                                <Switch
                                                    id={`${field}-${index}`}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        changeValue(
                                                            field,
                                                            index,
                                                            checked
                                                        )
                                                    }
                                                    checked={
                                                        row?.[field] || false
                                                    }
                                                />
                                            </div>
                                        ))}
                                </div>
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="minLength">
                                            {t('minLength')}
                                        </Label>
                                        <Input
                                            id="minLength"
                                            type="number"
                                            className="h-8"
                                            value={row?.['minLength'] || ''}
                                            placeholder=">=0"
                                            onChange={(ev) =>
                                                changeValue(
                                                    'minLength',
                                                    index,
                                                    Number(ev.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxLength">
                                            {t('maxLength')}
                                        </Label>
                                        <Input
                                            id="maxLength"
                                            type="number"
                                            className="h-8"
                                            value={row?.['maxLength'] || ''}
                                            placeholder=">=0"
                                            onChange={(ev) =>
                                                changeValue(
                                                    'maxLength',
                                                    index,
                                                    Number(ev.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="regex">
                                            {t('regex')}
                                        </Label>
                                        <Input
                                            id="regex"
                                            className="col-span-2 h-8"
                                            value={row?.['regex'] || ''}
                                            onChange={(ev) =>
                                                changeValue(
                                                    'regex',
                                                    index,
                                                    ev.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="others" className="space-y-4">
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t('setOtherSettingsForDataObjects')}
                                </p>
                                {['primaryKey'].map((field) => (
                                    <div
                                        key={`${field}-${index}`}
                                        className="flex flex-1 items-center gap-4"
                                    >
                                        <Label htmlFor={`${field}-${index}`}>
                                            {t('identifier')}
                                        </Label>
                                        <Switch
                                            id={`${field}-${index}`}
                                            onCheckedChange={(checked) =>
                                                changeValue(
                                                    field,
                                                    index,
                                                    checked
                                                )
                                            }
                                            checked={row?.[field] || false}
                                        />
                                    </div>
                                ))}
                                <Separator orientation="horizontal" />
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <div className="space-y-2 flex flex-col">
                                        <Label htmlFor="collectionType">
                                            {t('collectionType')}
                                        </Label>
                                        <Combobox
                                            key={`${index}`}
                                            name={'collectionType'}
                                            placeholder={t(
                                                'selectCollectionType'
                                            )}
                                            options={collectionTypes}
                                            value={
                                                row?.['collectionType'] || ''
                                            }
                                            onChange={(selectedOption) => {
                                                changeValue(
                                                    'collectionType',
                                                    index,
                                                    selectedOption
                                                );
                                            }}
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
