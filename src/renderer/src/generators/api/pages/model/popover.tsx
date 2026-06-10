import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Separator } from '@renderer/components/ui/separator'
import { Switch } from '@renderer/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { IGRPCombobox, IGRPSeparator } from '@igrp/igrp-framework-react-design-system'
import { useFramework } from '@renderer/hooks/use-framework'
import { PackageCheck } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from '../../components/inputs-form'
import { defaultPrimaryKeyGenerationType } from './config'

interface PopoverProps {
    children?: ReactNode
    index: number
    row: any
    options: any
    changeValue: (element: string, position: number, value: any) => void
}

export function PopoverModel({ index, row, options, changeValue }: PopoverProps) {
    const { t } = useTranslation()
    const framework = useFramework()

    const [isPrimary, setIsPrimary] = useState(false)

    // `SEQUENCE` is a Spring/JPA-only generation strategy; .NET (EF Core)
    // doesn't expose it, so on .NET this stays false and the sequence-name
    // input is never shown. Left as a literal string check rather than a
    // framework gate because the field simply won't be among `generateTypes`
    // for non-Spring engines.
    const [isSequence, setIsSequence] = useState(false)

    const onChangeGenerationType = (value: string): void => {
        changeValue('generationType', index, value)

        setIsSequence(value === 'SEQUENCE')
    }

    return (
        <Popover>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" className="flex items-center" size={'icon'}>
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
                        <Tabs defaultValue="dataType">
                            <TabsList className="grid w-full grid-cols-1">
                                <TabsTrigger value="dataType">{t('settings')}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="dataType" className="space-y-4">
                                <div className="flex flex-1 gap-2">
                                    {['unique', 'nullable', 'primaryKey'].map((field) => (
                                        <div
                                            key={`${field}-${index}`}
                                            className="flex flex-1 items-center gap-4"
                                        >
                                            <Label htmlFor={`${field}-${index}`}>
                                                {t(field === 'nullable' ? 'required' : field)}
                                            </Label>
                                            <Switch
                                                id={`${field}-${index}`}
                                                onCheckedChange={(checked) => {
                                                    changeValue(field, index, checked)
                                                    setIsPrimary(field === 'primaryKey')
                                                }}
                                                checked={row?.[field] || false}
                                            />
                                        </div>
                                    ))}
                                </div>
                                {options.revision && (
                                    <>
                                        <IGRPSeparator orientation="horizontal" />

                                        <div className="flex flex-1 gap-2">
                                            <div className="flex flex-1 items-center gap-4">
                                                <Label htmlFor={`skipFieldRevision`}>
                                                    {t('skipFieldRevision')}
                                                </Label>
                                                <Switch
                                                    id={`skipFieldRevision-${index}`}
                                                    onCheckedChange={(checked) =>
                                                        changeValue(
                                                            'skipFieldRevision',
                                                            index,
                                                            checked
                                                        )
                                                    }
                                                    checked={row?.['skipFieldRevision'] || false}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                                <Separator orientation="horizontal" />
                                <div className="flex flex-col gap-2">
                                    {isPrimary && (
                                        <>
                                            <div className="space-y-2 col-span-2 flex flex-col">
                                                <Label>{t('generationType')}</Label>
                                                <IGRPCombobox
                                                    placeholder={`Select Generation Type`}
                                                    options={options.generateTypes}
                                                    value={
                                                        row?.['generationType'] ||
                                                        defaultPrimaryKeyGenerationType(framework)
                                                    }
                                                    onChange={(value) =>
                                                        onChangeGenerationType(value as string)
                                                    }
                                                    className="w-full h-8"
                                                />
                                            </div>

                                            {isSequence && (
                                                <TextInput
                                                    label="Sequence Name"
                                                    id="sequenceName"
                                                    className="h-8"
                                                    value={row?.['sequenceName'] || ''}
                                                    onChange={(ev) =>
                                                        changeValue(
                                                            'sequenceName',
                                                            index,
                                                            ev.target.value
                                                        )
                                                    }
                                                    placeholder="Enter the custom sequence name"
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label>{t('length')}</Label>
                                        <Input
                                            id="length"
                                            className="h-8"
                                            value={row?.['length'] || ''}
                                            onChange={(ev) =>
                                                changeValue('length', index, ev.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('defaultValue')}</Label>
                                        <Input
                                            id="defaultValue"
                                            className="h-8"
                                            value={row?.['defaultValue'] || ''}
                                            onChange={(ev) =>
                                                changeValue('defaultValue', index, ev.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
