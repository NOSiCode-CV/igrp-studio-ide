import { useState, useEffect } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@renderer/components/ui/popover';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Switch } from '@renderer/components/ui/switch';
import { SchemaField } from '../../types/schema';
import { PackageCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { Separator } from '@renderer/components/ui/separator';
import MonacoEditor from '@renderer/components/monaco-editor';

interface FieldOptionsPopoverProps {
    field: SchemaField;
    onUpdate: (updatedField: SchemaField) => void;
}

export function FieldOptionsPopover({
    field,
    onUpdate,
}: FieldOptionsPopoverProps) {
    const { t } = useTranslation();

    const [localField, setLocalField] = useState<SchemaField>(field);

    useEffect(() => {
        setLocalField(field);
    }, [field]);

    const handleChange = (key: keyof SchemaField, value: any) => {
        setLocalField((prev) => ({ ...prev, [key]: value }));
		const updatedField = { ...field, [key]: value  };
        onUpdate(updatedField);
    };

    const handleChangeEditor = (_value)=>{

    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center h-6 w-6"
                    size={'icon'}
                    title={t('Open advanced settings')}
                >
                    <PackageCheck className="w-4 h-4" /> {/* Settings icon */}
                    <span className="sr-only">{t('Advanced')}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[425px]">
                <Tabs defaultValue="dataType">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="dataType">
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
                        <div className="grid grid-cols-2 gap-2">
                            <div className="grid grid-cols-3 gap-2 col-span-2">
                                <div className="flex items-center space-x-2">
                                    <Label
                                        htmlFor="required"
                                        className="text-sm"
                                    >
                                        Required
                                    </Label>
                                    <Switch
                                        id="required"
                                        checked={localField.required || false}
                                        onCheckedChange={(checked) =>
                                            handleChange('required', checked)
                                        }
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Label
                                        htmlFor="nullable"
                                        className="text-sm"
                                    >
                                        Nullable
                                    </Label>
                                    <Switch
                                        id="nullable"
                                        checked={localField.nullable || false}
                                        onCheckedChange={(checked) =>
                                            handleChange('nullable', checked)
                                        }
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Label
                                        htmlFor="deprecated"
                                        className="text-sm"
                                    >
                                        Deprecated
                                    </Label>
                                    <Switch
                                        id="deprecated"
                                        checked={localField.deprecated || false}
                                        onCheckedChange={(checked) =>
                                            handleChange('deprecated', checked)
                                        }
                                    />
                                </div>
                            </div>
                            <Separator className="col-span-2" />
                            {(localField.type === 'string' ||
                                localField.type === 'number' ||
                                localField.type === 'integer') && (
                                <>
                                    <div className="grid grid-cols-3 gap-2 col-span-2">
                                        <div className="items-center space-x-2">
                                            <Label
                                                htmlFor="enum"
                                                className="text-sm"
                                            >
                                                Enum
                                            </Label>
                                            <Switch
                                                id="enum"
                                                value={
                                                    localField.enum?.join(
                                                        ','
                                                    ) || ''
                                                }
                                                className="h-6 text-sm"
                                                onCheckedChange={(checked) =>
                                                    handleChange(
                                                        'enum',
                                                        checked
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="items-center space-x-2">
                                            <Label
                                                htmlFor="const"
                                                className="text-sm"
                                            >
                                                Const
                                            </Label>
                                            <Switch
                                                id="const"
                                                value={localField.const || ''}
                                                className="col-span-2 h-6 text-sm"
                                                onCheckedChange={(checked) =>
                                                    handleChange(
                                                        'const',
                                                        checked
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="items-center gap-4">
                                        <Label
                                            htmlFor="format"
                                            className="text-sm"
                                        >
                                            Format
                                        </Label>
                                        <Input
                                            id="format"
                                            value={localField.format || ''}
                                            className="col-span-2 h-6 text-sm"
                                            onChange={(e) =>
                                                handleChange(
                                                    'format',
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="items-center gap-4">
                                        <Label
                                            htmlFor="default"
                                            className="text-sm"
                                        >
                                            Default
                                        </Label>
                                        <Input
                                            id="default"
                                            value={localField.default || ''}
                                            className="col-span-2 h-6 text-sm"
                                            onChange={(e) =>
                                                handleChange(
                                                    'default',
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="items-center gap-4 col-span-2">
                                        <Label
                                            htmlFor="examples"
                                            className="text-sm"
                                        >
                                            Examples
                                        </Label>
                                        <Input
                                            id="examples"
                                            value={
                                                localField.examples?.join(
                                                    ','
                                                ) || ''
                                            }
                                            className="col-span-2 h-6 text-sm"
                                            onChange={(e) =>
                                                handleChange(
                                                    'examples',
                                                    e.target.value
                                                        .split(',')
                                                        .map((item) =>
                                                            item.trim()
                                                        )
                                                )
                                            }
                                        />
                                    </div>
                                </>
                            )}
                            {(localField.type === 'number' ||
                                localField.type === 'integer') && (
                                <>
                                    <div className="items-center gap-4">
                                        <Label
                                            htmlFor="minimum"
                                            className="text-sm"
                                        >
                                            Minimum
                                        </Label>
                                        <Input
                                            id="minimum"
                                            type="number"
                                            value={localField.minimum || ''}
                                            className="col-span-2 h-6 text-sm"
                                            onChange={(e) =>
                                                handleChange(
                                                    'minimum',
                                                    parseFloat(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="items-center gap-4">
                                        <Label
                                            htmlFor="maximum"
                                            className="text-sm"
                                        >
                                            Maximum
                                        </Label>
                                        <Input
                                            id="maximum"
                                            type="number"
                                            value={localField.maximum || ''}
                                            className="col-span-2 h-6 text-sm"
                                            onChange={(e) =>
                                                handleChange(
                                                    'maximum',
                                                    parseFloat(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="items-center gap-4">
                                        <Label
                                            htmlFor="multipleOf"
                                            className="text-sm"
                                        >
                                            Multiple Of
                                        </Label>
                                        <Input
                                            id="multipleOf"
                                            type="number"
                                            value={localField.multipleOf || ''}
                                            className="col-span-2 h-6 text-sm"
                                            onChange={(e) =>
                                                handleChange(
                                                    'multipleOf',
                                                    parseFloat(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                </>
                            )}
                            <div className="col-span-2 items-center gap-4">
                                <Label htmlFor="title" className="text-sm">
                                    Title
                                </Label>
                                <Input
                                    id="title"
                                    value={localField.title || ''}
                                    className=" h-6 text-sm"
                                    onChange={(e) =>
                                        handleChange('title', e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="jsonSchema">
                        <MonacoEditor
                            content={JSON.stringify(field, null, 2)}
                            onChange={handleChangeEditor}
                        />
                    </TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
}
