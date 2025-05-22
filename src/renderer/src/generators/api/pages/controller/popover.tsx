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
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@renderer/components/ui/switch';
import { Separator } from '@renderer/components/ui/separator';
import { Input } from '@renderer/components/ui/input';
import { toInitCap } from '@renderer/utils/helpers';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import MonacoEditor from '@renderer/components/monaco-editor';

interface PopoverProps {
    row: any;
    changeValue: (element: string, value: any) => void;
    options: any;
}

export function PopoverController({ options, row, changeValue }: PopoverProps) {
    const { t } = useTranslation();

    const [isInteger, setIsInteger] = useState(false);
    const [isBoolean, setIsBoolean] = useState(false);
    const [isConst, setIsConst] = useState(false);
    const [isEnum, setIsEnum] = useState(false);

    const { enumTypes } = options;

    useEffect(() => {
        setIsInteger(row?.['type'] === 'integer' || row?.['type'] === 'long');
        setIsBoolean(row?.['type'] === 'boolean');
    }, [row]);

    const handleChangeEditor = (_value) => {};

    const changeConst = (key, value) => {
        setIsConst(key === 'const' && value);
        setIsEnum(key === 'enum' && value);
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
            <PopoverContent className="w-[425px]" align="end" side="bottom">
                <Tabs defaultValue="dataType">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="dataType">
                            {t('dataType')}
                        </TabsTrigger>
                        <TabsTrigger value="jsonSchema">
                            {t('jsonSchema')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dataType" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                        {t('configureFieldOptions')}
                        </p>
                        <div className="flex flex-1 gap-2">
                            {['isRequired', 'nullable', 'deprecated'].map(
                                (field) => (
                                    <div
                                        key={`${field}`}
                                        className="flex flex-1 items-center gap-4"
                                    >
                                        <Label htmlFor={`${field}`}>
                                            {toInitCap(field)}
                                        </Label>
                                        <Switch
                                            id={`${field}`}
                                            onCheckedChange={(checked) =>
                                                changeValue(field, checked)
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
                                {['enum', 'const'].map((field) => (
                                    <div
                                        key={`${field}`}
                                        className="flex items-center gap-4"
                                    >
                                        <Label htmlFor={`${field}`}>
                                            {toInitCap(field)}
                                        </Label>
                                        <Switch
                                            id={`${field}`}
                                            onCheckedChange={(checked) =>
                                                changeConst(field, checked)
                                            }
                                            checked={
                                                field === 'const'
                                                    ? isConst
                                                    : isEnum
                                            }
                                        />
                                    </div>
                                ))}
                                {isConst && (
                                    <Input
                                        id="const"
                                        className="h-8"
                                        value={row?.['const'] || ''}
                                        onChange={(ev) =>
                                            changeValue(
                                                'const',
                                                ev.target.value
                                            )
                                        }
                                    />
                                )}
                                {isEnum && (
                                    <IGRPCombobox
                                        className="h-8"
                                        value={row?.['enum'] || ''}
                                        onChange={(ev) =>
                                            changeValue('enum', ev)
                                        }
                                        options={enumTypes}
                                    />
                                )}
                            </div>
                        )}
                        {isInteger && (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <Label htmlFor="minimunm">{t('minimum')}</Label>
                                    <Input
                                        id="minimunm"
                                        type={'number'}
                                        className="h-8 w-28"
                                        placeholder=">=0"
                                        value={row?.['minimunm'] || ''}
                                        onChange={(ev) =>
                                            changeValue(
                                                'minimunm',
                                                ev.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="maximum">{t('minimum')}</Label>
                                    <Input
                                        id="maximum"
                                        type={'number'}
                                        className="h-8 w-28"
                                        placeholder=">=0"
                                        value={row?.['maximum'] || ''}
                                        onChange={(ev) =>
                                            changeValue(
                                                'maximum',
                                                ev.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="m">{t('minimum')}</Label>
                                    <Input
                                        id="multipleOf"
                                        placeholder=">=0"
                                        type={'multipleOf'}
                                        className="h-8 w-28"
                                        value={row?.['multipleOf'] || ''}
                                        onChange={(ev) =>
                                            changeValue(
                                                'multipleOf',
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
                                        {t('minLength')}
                                        </Label>
                                        <Input
                                            id="minLength"
                                            className="h-8"
                                            value={row?.['minLength'] || ''}
                                            onChange={(ev) =>
                                                changeValue(
                                                    'minLength',
                                                    ev.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="maxLength">
                                        {t('maxLength')}
                                        </Label>
                                        <Input
                                            id="maxLength"
                                            className="h-8"
                                            value={row?.['maxLength'] || ''}
                                            onChange={(ev) =>
                                                changeValue(
                                                    'maxLength',
                                                    ev.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </>
                            )}
                            <div className="space-y-1">
                                <Label htmlFor="default">{t('default')}</Label>
                                <Input
                                    id="default"
                                    className="h-8"
                                    value={row?.['default'] || ''}
                                    onChange={(ev) =>
                                        changeValue('default', ev.target.value)
                                    }
                                />
                            </div>
                            {!isBoolean && (
                                <>
                                    <div className="space-y-1">
                                        <Label htmlFor="regex">{t('pattern')}</Label>
                                        <Input
                                            id="pattern"
                                            className="h-8"
                                            value={row?.['pattern'] || ''}
                                            onChange={(ev) =>
                                                changeValue(
                                                    'pattern',
                                                    ev.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <Label htmlFor="examples">
                                        {t('examples')}
                                        </Label>
                                        <Input
                                            id="examples"
                                            className="h-8"
                                            value={row?.['examples'] || ''}
                                            onChange={(ev) =>
                                                changeValue(
                                                    'examples',
                                                    ev.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="jsonSchema">
                        <MonacoEditor
                            content={JSON.stringify(row, null, 2)}
                            filePath=""
                            onChange={handleChangeEditor}
                            height="20vh"
                        />
                    </TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
}
