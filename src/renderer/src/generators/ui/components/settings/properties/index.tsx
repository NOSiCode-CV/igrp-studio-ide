import {
    IGRPCombobox,
    IGRPDatePicker,
    IGRPOptionsProps,
    IGRPRadioGroup,
} from '@igrp/igrp-framework-react-design-system';
import DynamicKeyValueForm from '@renderer/components/domain-form';
import IconBrowser from '@renderer/components/icon/icon-browser';
import MultipleSelector from '@renderer/components/multiples-selector';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@renderer/components/ui/accordion';
import { Button } from '@renderer/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@renderer/components/ui/popover';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Switch } from '@renderer/components/ui/switch';
import { cn } from '@renderer/lib/utils';
import { capitalize, getLabel } from '@renderer/utils';
import { MoreVertical, Plus } from 'lucide-react';

import React, { useEffect, useState } from 'react';
import { Option } from '@renderer/generators/ui/hooks/useCustomCode';
import { StateComponent } from '../../sidebar/custom-code/custom-code-state';
import { State } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { getDynamicSegments, RouteSegment } from './route-parser';
import { Badge } from '@renderer/components/ui/badge';

interface Segment {
    name: string;
    tag: string;
    value?: string;
}

interface settingsProps {
    propsComp: Record<string, any>;
    formValues: Record<string, any>;
    pageOptions?: any;
    statesOptions: Option[];
    columnsOptions: IGRPOptionsProps[];
    tag: string;
    onInputChange: (fieldPath: string, value: any) => void;
    onSelectState: (field: string, value: State) => void;
}

const toMap = (items: any) => {
    return (
        items &&
        items.map((value: string) => ({
            value,
            label: value,
        }))
    );
};

const toMapPages = (items: any) => {
    return (
        items &&
        items.map(({ label, metadata }) => ({
            value: metadata.path,
            label,
        }))
    );
};

const getNestedValue = (obj: any, path: string) => {
    return path
        .split('.')
        .reduce(
            (acc, key) =>
                acc && acc[key] !== undefined ? acc[key] : undefined,
            obj
        );
};

const RenderPropsConfig = ({
    propsComp,
    formValues,
    pageOptions,
    statesOptions,
    columnsOptions,
    tag,
    onInputChange,
    onSelectState,
}: settingsProps) => {
    const renderField = (key: string, fieldConfig: any, parentKey?: string) => {
        const { enum: enumValues, type: typeDefault, items } = fieldConfig;
        const label = getLabel(key);
        const type = enumValues ? 'enum' : typeDefault;

        const fieldPath = parentKey ? `${parentKey}.${key}` : key;

        const value = getNestedValue(formValues, fieldPath);

        if (fieldConfig.type === 'object' && fieldConfig.properties) {
            const props = fieldConfig.properties;
            return (
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem key={key} value={key}>
                        <AccordionTrigger>{label}</AccordionTrigger>
                        <AccordionContent className="space-y-3">
                            {Object.keys(props).map((nestedKey) =>
                                renderField(
                                    nestedKey,
                                    props[nestedKey],
                                    parentKey ? `${parentKey}.${key}` : key
                                )
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        } else if (key === 'iconName') {
            return (
                <IconBrowser
                    selectedIcon={value}
                    onSelectedIcon={(icon: string) => {
                        onInputChange(fieldPath, icon);
                    }}
                />
            );
        } else if (key === 'options') {
            return (
                <DynamicKeyValueForm
                    onAdd={(opt) => {
                        onInputChange(fieldPath, opt);
                    }}
                />
            );
        } else if (key === 'href') {
            return (
                <SlugBindingConfig
                    key={key}
                    label={Label}
                    value={value}
                    fieldPath={fieldPath}
                    parentKey={parentKey}
                    pageOptions={pageOptions}
                    onInputChange={onInputChange}
                    columnsOptions={columnsOptions}
                    segments={formValues['segments']}
                />
            );
        }

        return (
            <div
                className={cn(
                    type === 'boolean' &&
                        'flex flex-1 space-x-3 align-middle justify-between space-y-2',
                    type !== 'boolean' && 'flex flex-col space-y-2',
                    'group'
                )}
                key={key}
            >
                <Label htmlFor={key} className="flex justify-between ">
                    <span>{label}</span>
                    {type !== 'boolean' && (
                        <FieldActions
                            field={key}
                            statesOptions={statesOptions}
                            value={value}
                            tag={tag}
                            type={type}
                            onSelectState={onSelectState}
                        />
                    )}
                </Label>

                {(() => {
                    switch (type) {
                        case 'boolean':
                            return (
                                <div>
                                    <FieldActions
                                        field={key}
                                        statesOptions={statesOptions}
                                        value={value}
                                        tag={tag}
                                        type={type}
                                        onSelectState={onSelectState}
                                    />

                                    <Switch
                                        id={
                                            parentKey
                                                ? `${parentKey}.${key}`
                                                : key
                                        }
                                        name={key}
                                        checked={value}
                                        onCheckedChange={(checked) => {
                                            onInputChange(fieldPath, checked);
                                        }}
                                    />
                                </div>
                            );
                        case 'enum':
                            return (
                                <IGRPCombobox
                                    value={value}
                                    onChange={(value) =>
                                        onInputChange(fieldPath, value)
                                    }
                                    options={toMap(enumValues)}
                                    className="w-full"
                                />
                            );
                        case 'string':
                        case 'any':
                            return (
                                <Input
                                    id={parentKey ? `${parentKey}.${key}` : key}
                                    type="text"
                                    name={key}
                                    value={value}
                                    onChange={(e) =>
                                        onInputChange(fieldPath, e.target.value)
                                    }
                                />
                            );
                        case 'number':
                            return (
                                <Input
                                    id={parentKey ? `${parentKey}.${key}` : key}
                                    type="number"
                                    name={key}
                                    value={value}
                                    onChange={(e) =>
                                        onInputChange(fieldPath, e.target.value)
                                    }
                                />
                            );
                        case 'date':
                            return (
                                <IGRPDatePicker
                                    name={
                                        parentKey ? `${parentKey}.${key}` : key
                                    }
                                    date={value}
                                    onDateChange={(value) =>
                                        onInputChange(fieldPath, value)
                                    }
                                    className=""
                                    id={parentKey ? `${parentKey}.${key}` : key}
                                />
                            );
                        case 'array':
                            return (
                                <MultipleSelector
                                    value={value}
                                    onChange={(value) =>
                                        onInputChange(fieldPath, value)
                                    }
                                    options={toMap(items?.enum)}
                                />
                            );

                        default:
                            return null;
                    }
                })()}
            </div>
        );
    };

    return (
        <div className="space-y-3">
            {Object.keys(propsComp).map((key, index) => {
                return (
                    <React.Fragment key={index}>
                        {renderField(key, propsComp[key])}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const FieldActions = ({
    field,
    statesOptions,
    value,
    tag,
    type,
    onSelectState,
}: {
    field: string;
    value: string;
    tag: string;
    type: string;
    statesOptions: Option[];
    onSelectState: (field: string, value: State) => void;
}) => {
    const [open, setOpen] = useState<boolean>(false);

    const state: State = {
        id: '',
        name: `${tag.charAt(0).toLowerCase() + tag.slice(1)}${capitalize(field)}`,
        type: type || 'string',
        imports: [],
        defaultValue: value,
    };

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical className="w-3 h-3" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Select an existing state or create a new one to bind a
                        dynamic value.
                    </p>
                    <div className="space-y-2">
                        <Label>State</Label>
                        <IGRPCombobox
                            value={''}
                            onChange={(selectedState) =>
                                onSelectState(
                                    field,
                                    selectedState
                                        ? {
                                              id: '',
                                              name: selectedState as string,
                                              type: '',
                                              imports: [],
                                              defaultValue: undefined,
                                              generate: true,
                                          }
                                        : {}
                                )
                            }
                            options={statesOptions}
                            className="w-full"
                            placeholder="Select State"
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button
                            variant={'secondary'}
                            size={'sm'}
                            onClick={() => setOpen(!open)}
                            className="w-full"
                        >
                            <span><Plus/></span>
                            Generate New State
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            <StateComponent setOpen={setOpen} open={open} state={state} />
        </>
    );
};

const SlugBindingConfig = ({
    value,
    fieldPath,
    key,
    label,
    parentKey,
    segments,
    pageOptions,
    columnsOptions,
    onInputChange,
}: {
    value: string;
    fieldPath: string;
    key: string;
    parentKey?: string;
    label: any;
    columnsOptions: IGRPOptionsProps[];
    pageOptions: Option;
    segments: Segment[];
    onInputChange: (fieldPath: string, value: any) => void;
}) => {
    const [linkType, setLinkType] = useState<string>();
    const [selectedPagePath, setSelectedPagePath] = useState<string>();
    const [dynamicSegments, setDynamicPagePath] = useState(
        getDynamicSegments(selectedPagePath) ?? []
    );

    useEffect(() => {
        setDynamicPagePath(getDynamicSegments(selectedPagePath));
    }, [selectedPagePath]);

    useEffect(() => {
        const defaultType =
            value &&
            Array.isArray(pageOptions) &&
            pageOptions.some((page) => page.value === value)
                ? 'LINK'
                : 'PAGE';

        setLinkType(defaultType);
        setSelectedPagePath(value);
    }, [value]);

    return (
        <>
            <Label htmlFor={key}>{label}</Label>
            <IGRPRadioGroup
                id={parentKey ? `${parentKey}.${key}` : key}
                name={key}
                value={linkType}
                onValueChange={(e) => {
                    setLinkType(e);
                    setSelectedPagePath(value);
                }}
                options={[
                    { value: 'LINK', label: 'Link' },
                    { value: 'PAGE', label: 'Page' },
                ]}
            />
            {linkType === 'LINK' ? (
                <Input
                    id={parentKey ? `${parentKey}.${key}` : key}
                    type="email"
                    name={key}
                    value={value}
                    onChange={(e) => onInputChange(fieldPath, e.target.value)}
                />
            ) : (
                <div className="space-y-4">
                    <IGRPCombobox
                        value={value}
                        onChange={(value) => {
                            onInputChange(fieldPath, value as string);
                            setSelectedPagePath(value as string);
                        }}
                        options={toMapPages(pageOptions)}
                        placeholder="Select Page"
                        className="w-full"
                    />
                    {selectedPagePath && dynamicSegments.length > 0 && (
                        <div className="space-y-2">
                            <Label>Available Dynamic Segments</Label>
                            <div className="flex flex-wrap gap-2">
                                {dynamicSegments.map((segment, index) => (
                                    <Badge key={index} variant="outline">
                                        {segment.name} ({segment.type})
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    {selectedPagePath && dynamicSegments.length === 0 && (
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                This route has no dynamic segments. Only static
                                routes detected.
                            </p>
                        </div>
                    )}

                    {selectedPagePath && dynamicSegments.length > 0 && (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Map route segments to table columns
                            </p>

                            <DynamicKeyValueForm
                                required
                                defaultItems={
                                    (segments &&
                                        segments.map((item: Segment) => ({
                                            name: item.name,
                                            columnName: item.tag,
                                            value: '',
                                        }))) ||
                                    []
                                }
                                onAdd={(items) =>
                                    onInputChange(
                                        'segments',
                                        items.map((item) => ({
                                            name: item.name,
                                            tag: item.columnName,
                                            value: undefined,
                                        }))
                                    )
                                }
                                fieldPairs={[
                                    {
                                        key: 'name',
                                        label: 'Name',
                                        options:
                                            dynamicSegments.map(
                                                (segment: RouteSegment) => ({
                                                    label: `${segment.name} (${segment.type})`,
                                                    value: segment.originalSegment,
                                                })
                                            ) || [],
                                        placeholder: 'Select Route Segment',
                                    },
                                    {
                                        key: 'columnName',
                                        label: 'Column Name',
                                        options: columnsOptions,
                                    },
                                ]}
                            />
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default RenderPropsConfig;
