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
import { Switch } from '@renderer/components/ui/Switch';
import { Separator } from '@renderer/components/ui/separator';
import { Input } from '@renderer/components/ui/input';
import { toInitCap } from '@renderer/utils/helpers';

interface PopoverProps {
    children?: ReactNode;
    index: number;
    row: any;
    changeValue: (element: string, position: number, value: any) => void;
}

export function PopoverController({ index, row, changeValue }: PopoverProps) {
    const { t } = useTranslation();

    const [isInteger, setIsInteger] = useState(false);
    const [isBoolean, setIsBoolean] = useState(false);

    useEffect(() => {
        setIsInteger(row?.['type'] === 'integer' || row?.['type'] === 'long');
        setIsBoolean(row?.['type'] === 'boolean');
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
                            <PackageCheck className="w-4 h-4" />{' '}
                            {/* Settings icon */}
                            <span className="sr-only">{t('Advanced')}</span>
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                    {t('Open advanced settings')}
                </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-100" align="end" side="bottom">
                <Tabs defaultValue="dataType">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="dataType">
                            {' '}
                            {t('Data Type')}
                        </TabsTrigger>
                        <TabsTrigger value="jsonSchema">
                            {t('JSON Schema')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dataType" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Configure additional options for this field.
                        </p>
                        <div className="flex flex-1 gap-2">
                            {['isRequired', 'nullable', 'deprecated'].map(
                                (field) => (
                                    <div
                                        key={`${field}-${index}`}
                                        className="flex flex-1 items-center gap-4"
                                    >
                                        <Label htmlFor={`${field}-${index}`}>
                                            {toInitCap(field)}
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
                                )
                            )}
                        </div>
                        <Separator orientation="horizontal" />
                        {!isBoolean && (
                            <div className="flex flex-1 gap-2">
                                {['emun', 'const'].map((field) => (
                                    <div
                                        key={`${field}-${index}`}
                                        className="flex items-center gap-4"
                                    >
                                        <Label htmlFor={`${field}-${index}`}>
                                            {toInitCap(field)}
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
                            </div>
                        )}
                        {isInteger && (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <Label htmlFor="minimunm">minimunm</Label>
                                    <Input
                                        id="minimunm"
                                        type={'number'}
                                        className="h-8 w-28"
                                        placeholder=">=0"
                                        value={row?.['minimunm'] || ''}
                                        onChange={(ev) =>
                                            changeValue(
                                                'minimunm',
                                                index,
                                                ev.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="maximum">minimunm</Label>
                                    <Input
                                        id="maximum"
                                        type={'number'}
                                        className="h-8 w-28"
                                        placeholder=">=0"
                                        value={row?.['maximum'] || ''}
                                        onChange={(ev) =>
                                            changeValue(
                                                'maximum',
                                                index,
                                                ev.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="m">minimunm</Label>
                                    <Input
                                        id="multipleOf"
                                        placeholder=">=0"
                                        type={'multipleOf'}
                                        className="h-8 w-28"
                                        value={row?.['multipleOf'] || ''}
                                        onChange={(ev) =>
                                            changeValue(
                                                'multipleOf',
                                                index,
                                                ev.target.value
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            {!isInteger && !isBoolean && (
                                <>
                                    <div className="space-y-1">
                                        <Label htmlFor="minLength">
                                            minLength
                                        </Label>
                                        <Input
                                            id="minLength"
                                            className="h-8"
                                            value={row?.['minLength'] || ''}
                                            onChange={(ev) =>
                                                changeValue(
                                                    'minLength',
                                                    index,
                                                    ev.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="maxLength">
                                            maxLength
                                        </Label>
                                        <Input
                                            id="maxLength"
                                            className="h-8"
                                            value={row?.['maxLength'] || ''}
                                            onChange={(ev) =>
                                                changeValue(
                                                    'maxLength',
                                                    index,
                                                    ev.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </>
                            )}
                            <div className="space-y-1">
                                <Label htmlFor="default">default</Label>
                                <Input
                                    id="default"
                                    className="h-8"
                                    value={row?.['default'] || ''}
                                    onChange={(ev) =>
                                        changeValue(
                                            'default',
                                            index,
                                            ev.target.value
                                        )
                                    }
                                />
                            </div>
                            {!isBoolean && (
                                <>
                                    <div className="space-y-1">
                                        <Label htmlFor="regex">Pattern</Label>
                                        <Input
                                            id="pattern"
                                            className="h-8"
                                            value={row?.['pattern'] || ''}
                                            onChange={(ev) =>
                                                changeValue(
                                                    'pattern',
                                                    index,
                                                    ev.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <Label htmlFor="examples">
                                            examples
                                        </Label>
                                        <Input
                                            id="examples"
                                            className="h-8"
                                            value={row?.['examples'] || ''}
                                            onChange={(ev) =>
                                                changeValue(
                                                    'examples',
                                                    index,
                                                    ev.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="jsonSchema"></TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
}
