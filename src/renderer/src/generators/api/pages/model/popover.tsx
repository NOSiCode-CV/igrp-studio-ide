import { Button } from '@renderer/components/ui/button';
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { PackageCheck } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toInitCap } from '@renderer/utils/helpers';
import { Switch } from '@renderer/components/ui/switch';
import { Separator } from '@renderer/components/ui/separator';
import { Input } from '@renderer/components/ui/input';
import { Combobox } from '@igrp/igrp-design-system';

interface PopoverProps {
    children?: ReactNode;
    index: number;
    row: any;
    options: { label: string; value: string }[];
    changeValue: (element: string, position: number, value: any) => void;
}

export function PopoverModel({
    index,
    row,
    options,
    changeValue,
}: PopoverProps) {
    const { t } = useTranslation();

    const [isPrimary, setIsPrimary] = useState(false);

    useEffect(() => {
        setIsPrimary(row?.['primaryKey'] === true);
    }, [row]);

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
                            {/* Settings icon */}
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
                        <Tabs defaultValue="dataType">
                            <TabsList className="grid w-full grid-cols-1">
                                <TabsTrigger value="dataType">
                                    {t('dataType')}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="dataType" className="space-y-4">
                                <div className="flex flex-1 gap-2">
                                    {['unique', 'nullable', 'primaryKey'].map(
                                        (field) => (
                                            <div
                                                key={`${field}-${index}`}
                                                className="flex flex-1 items-center gap-4"
                                            >
                                                <Label
                                                    htmlFor={`${field}-${index}`}
                                                >
                                                    {toInitCap(field)}
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
                                <div className="grid grid-cols-2 gap-2">
                                    <>
                                        {isPrimary && (
                                            <div className="space-y-2 col-span-2 flex flex-col">
                                                <Label htmlFor="generationType">
                                                    Generation Type
                                                </Label>
                                                <Combobox
                                                    name={'generationType'}
                                                    placeholder={`Select Generation Type`}
                                                    options={options}
                                                    value={
                                                        row?.[
                                                            'generationType'
                                                        ] || 'IDENTITY'
                                                    }
                                                    onChange={(value) =>
                                                        changeValue(
                                                            'generationType',
                                                            index,
                                                            value
                                                        )
                                                    }
                                                    className='w-full'
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="length">
                                                Length
                                            </Label>
                                            <Input
                                                id="length"
                                                className="h-8"
                                                value={row?.['length'] || ''}
                                                onChange={(ev) =>
                                                    changeValue(
                                                        'length',
                                                        index,
                                                        ev.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="defaultValue">
                                                Default Value
                                            </Label>
                                            <Input
                                                id="defaultValue"
                                                className="h-8"
                                                value={
                                                    row?.['defaultValue'] || ''
                                                }
                                                onChange={(ev) =>
                                                    changeValue(
                                                        'defaultValue',
                                                        index,
                                                        ev.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    </>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
