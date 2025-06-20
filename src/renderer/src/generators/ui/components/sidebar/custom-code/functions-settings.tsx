import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
} from '@renderer/components/ui/sidebar';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import { useEffect, useState } from 'react';
import {
    Arguments,
    Import,
} from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import {
    CheckboxInput,
    SelectInput,
    TextInput,
} from '@renderer/generators/api/components/inputs-form';
import { useTranslation } from 'react-i18next';
import { Label } from '@renderer/components/ui/label';
import { Separator } from '@renderer/components/ui/separator';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@renderer/components/ui/accordion';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import useCustomCode from '../../../hooks/useCustomCode';
import { TabsFunctions, TabSnipptes, TabStates } from './custom-code-tabs';
import { cn } from '@renderer/lib/utils';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { Input } from '@renderer/components/ui/input';

export const returnTypeOptions = [
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'object', label: 'Object' },
    { value: 'array', label: 'Array' },
    { value: 'void', label: 'Void' },
    { value: 'any', label: 'Any' },
];
interface FunctionParameter {
    id: string;
    name: string;
    type: string;
    isOptional: boolean;
}
interface FunctionSettingsSidebarProps
    extends React.ComponentProps<typeof Sidebar> {
    formik?: any;
    componentTag: string;
    editorRef?: React.RefObject<any>;
    onInsertImport?: (importObj: Import) => void;
}

export const FunctionSettingsSidebar = ({
    formik,
    editorRef,
    componentTag,
    onInsertImport,
    ...props
}: FunctionSettingsSidebarProps) => {
    const { t } = useTranslation();

    const { states, snippets, functions } = useCustomCode();

    const [arguments_, setArguments] = useState<Arguments[]>(
        formik && formik.values?.arguments ? formik.values?.arguments : []
    );

    useEffect(() => {
        if (formik) formik.setFieldValue('arguments', arguments_);
    }, [arguments_]);

    return (
        <Sidebar
            {...props}
            collapsible="none"
            className="top-(--header-height-two)! h-[calc(100svh-var(--header-height-three))]!"
            style={
                {
                    '--sidebar-width': '380px',
                } as React.CSSProperties
            }
        >
            <SidebarHeader>
                <div className="flex flex-col mt-2">
                    <h1 className="text-2xl font-bold mb-1">
                        Function Settings
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Manage your parameters below.
                    </p>
                </div>
            </SidebarHeader>
            <SidebarContent className="gap-4 p-2">
                <Tabs defaultValue={formik ? 'props' : 'states'}>
                    <TabsList
                        className={cn(
                            'grid w-full grid-cols-4',
                            !formik ? 'grid-cols-3' : ''
                        )}
                    >
                        {formik && (
                            <TabsTrigger value="props">Props</TabsTrigger>
                        )}
                        <TabsTrigger value="states">States</TabsTrigger>
                        <TabsTrigger value="functions">Functions</TabsTrigger>
                        <TabsTrigger value="snippets">Snippets</TabsTrigger>
                    </TabsList>
                    {formik && (
                        <TabsContent value="props" className="space-y-4">
                            <TextInput
                                label={t('name')}
                                id="name"
                                placeholder={t('enterName')}
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                isTouched={formik.touched.name}
                                error={formik.errors.name}
                                isRequired
                            />
                            <CheckboxInput
                                label="IsAsync"
                                id="IsAsync"
                                value={formik.values.isAsync}
                                onChange={(checked) => {
                                    formik.setFieldValue('isAsync', checked);
                                }}
                                onBlur={formik.handleBlur}
                                error={formik.errors.isAsync}
                            />
                            <Separator />
                            <div className="flex flex-col gap-2">
                                <SelectInput
                                    label={t('Return Type')}
                                    id="returnValue.type"
                                    value={formik.values.returnValue?.type}
                                    onChange={(value) => {
                                        formik.setFieldValue(
                                            'returnValue.type',
                                            value
                                        );
                                    }}
                                    options={returnTypeOptions}
                                />

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center space-x-2">
                                        <CheckboxInput
                                            label={t('Is List')}
                                            id="returnValue.isList"
                                            value={
                                                formik.values.returnValue
                                                    ?.isList
                                            }
                                            onChange={(checked) => {
                                                formik.setFieldValue(
                                                    'returnValue.isList',
                                                    checked
                                                );
                                            }}
                                            className="flex-1"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <CheckboxInput
                                            label={t('Nullable')}
                                            id="returnValue.isNullable"
                                            value={
                                                formik.values.returnValue
                                                    ?.isNullable
                                            }
                                            onChange={(checked) => {
                                                formik.setFieldValue(
                                                    'returnValue.isNullable',
                                                    checked
                                                );
                                            }}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <FunctionArguments
                                value={arguments_}
                                onChange={setArguments}
                                returnTypeOptions={returnTypeOptions}
                            />
                        </TabsContent>
                    )}
                    <TabsContent value="states" className="space-y-4">
                        <TabStates states={states} editorRef={editorRef} />
                    </TabsContent>
                    <TabsContent value="snippets" className="space-y-4">
                        <TabSnipptes
                            snippets={snippets}
                            editorRef={editorRef}
                            componentTag={componentTag}
                        />
                    </TabsContent>
                    <TabsContent value="functions" className="space-y-4">
                        <TabsFunctions
                            functions={functions}
                            editorRef={editorRef}
                            currentFunction={formik?.values}
                            onInsertImport={onInsertImport}
                        />
                    </TabsContent>
                </Tabs>
            </SidebarContent>
        </Sidebar>
    );
};

interface FunctionArgumentsProps {
    value: Arguments[];
    onChange: (args: Arguments[]) => void;
    returnTypeOptions: { value: string; label: string }[];
}

export const FunctionArguments = ({
    value: arguments_,
    onChange,
    returnTypeOptions,
}: FunctionArgumentsProps) => {
    const removeArgument = (id: string) => {
        onChange(arguments_.filter((arg) => arg.id !== id));
    };

    const addArgument = () => {
        const newId = (
            Number.parseInt(arguments_[arguments_.length - 1]?.id || '0') + 1
        ).toString();
        onChange([
            ...arguments_,
            {
                id: newId,
                name: `argument${arguments_.length + 1}`,
                type: 'string',
                isList: false,
                isOptional: false,
                isInterface: false,
                isFunction: false,
                isState: false,
                functionParameters: [],
                stateParameterType: 'boolean',
                stateParameterName: 'value',
            },
        ]);
    };

    const updateArgument = (id: string, updates: Partial<Arguments>) => {
        onChange(
            arguments_.map((arg) =>
                arg.id === id ? { ...arg, ...updates } : arg
            )
        );
    };

    const addFunctionParameter = (argumentId: string) => {
        const newParameter: FunctionParameter = {
            id: Date.now().toString(),
            name: '',
            type: 'string',
            isOptional: false,
        };

        updateArgument(argumentId, {
            functionParameters: [
                ...(arguments_.find((arg) => arg.id === argumentId)
                    ?.functionParameters || []),
                newParameter,
            ],
        });
    };

    const removeFunctionParameter = (
        argumentId: string,
        parameterId: string
    ) => {
        const argument = arguments_.find((arg) => arg.id === argumentId);
        if (argument) {
            updateArgument(argumentId, {
                functionParameters: argument.functionParameters.filter(
                    (param) => param.id !== parameterId
                ),
            });
        }
    };

    const updateFunctionParameter = (
        argumentId: string,
        parameterId: string,
        updates: Partial<FunctionParameter>
    ) => {
        const argument = arguments_.find((arg) => arg.id === argumentId);
        if (argument) {
            updateArgument(argumentId, {
                functionParameters: argument.functionParameters.map((param) =>
                    param.id === parameterId ? { ...param, ...updates } : param
                ),
            });
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <Label>Define Arguments</Label>
            <Accordion type="single" collapsible className="w-full">
                {arguments_.map((arg, index) => (
                    <AccordionItem value={`argName-${index}`} key={arg.id}>
                        <AccordionTrigger>
                            <div className="flex justify-between items-center w-full">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">
                                        Argument {index + 1}
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                        {arg.type}
                                        {arg.isList ? '[]' : ''}
                                        {arg.isOptional ? '?' : ''}
                                    </span>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="border rounded-lg bg-gray-50 space-y-4 p-3">
                            <div className="p-1 space-y-3">
                                <TextInput
                                    id={`argName-${arg.id}`}
                                    label="Name"
                                    value={arg.name}
                                    onChange={(e) =>
                                        updateArgument(arg.id, {
                                            name: e.target.value,
                                        })
                                    }
                                />

                                <div className="space-y-2">
                                    <SelectInput
                                        label="Type"
                                        id="type"
                                        value={arg.type}
                                        onChange={(value) =>
                                            updateArgument(arg.id, {
                                                type: value as string,
                                            })
                                        }
                                        options={returnTypeOptions}
                                    />
                                    <div className="flex items-center gap-4 justify-between">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className="flex items-center space-x-2">
                                                <CheckboxInput
                                                    id={`isList-${arg.id}`}
                                                    value={arg.isList}
                                                    onChange={() =>
                                                        updateArgument(arg.id, {
                                                            isList: !arg.isList,
                                                        })
                                                    }
                                                    label="Is List"
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <CheckboxInput
                                                    id={`isOptional-${arg.id}`}
                                                    value={arg.isOptional}
                                                    onChange={() =>
                                                        updateArgument(arg.id, {
                                                            isOptional:
                                                                !arg.isOptional,
                                                        })
                                                    }
                                                    label="isOptional"
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <CheckboxInput
                                                    id={`isInterface-${arg.id}`}
                                                    value={arg.isInterface}
                                                    onChange={() =>
                                                        updateArgument(arg.id, {
                                                            isInterface:
                                                                !arg.isInterface,
                                                        })
                                                    }
                                                    label="isInterface"
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <CheckboxInput
                                                    id={`isFunction-${arg.id}`}
                                                    value={arg.isFunction}
                                                    onChange={() =>
                                                        updateArgument(arg.id, {
                                                            isFunction:
                                                                !arg.isFunction,
                                                        })
                                                    }
                                                    label="isFunction"
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <CheckboxInput
                                                    id={`isState-${arg.id}`}
                                                    value={arg.isState}
                                                    onChange={() =>
                                                        updateArgument(arg.id, {
                                                            isState:
                                                                !arg.isState,
                                                        })
                                                    }
                                                    label="isState"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {arg.isFunction && (
                                        <div className="mt-6 p-4 border rounded-lg bg-white">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-medium">
                                                    Function Configuration
                                                </h4>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label>Parameters</Label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            addFunctionParameter(
                                                                arg.id
                                                            )
                                                        }
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Add Parameter
                                                    </Button>
                                                </div>

                                                {arg.functionParameters.length >
                                                    0 &&
                                                    arg.functionParameters.map(
                                                        (param, paramIndex) => (
                                                            <div
                                                                key={param.id}
                                                                className="flex items-center gap-2 p-3 border rounded bg-gray-50"
                                                            >
                                                                <div className="flex-1">
                                                                    <Input
                                                                        placeholder={`Parameter ${paramIndex + 1} name`}
                                                                        value={
                                                                            param.name
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateFunctionParameter(
                                                                                arg.id,
                                                                                param.id,
                                                                                {
                                                                                    name: e
                                                                                        .target
                                                                                        .value,
                                                                                }
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <SelectInput
                                                                        label=""
                                                                        name="type"
                                                                        id={`funcParamName-${arg.id}`}
                                                                        value={
                                                                            param.type
                                                                        }
                                                                        onChange={(
                                                                            value
                                                                        ) =>
                                                                            updateFunctionParameter(
                                                                                arg.id,
                                                                                param.id,
                                                                                {
                                                                                    type: value,
                                                                                }
                                                                            )
                                                                        }
                                                                        options={
                                                                            returnTypeOptions
                                                                        }
                                                                    />
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`paramOptional-${param.id}`}
                                                                        checked={
                                                                            param.isOptional
                                                                        }
                                                                        onCheckedChange={(
                                                                            checked
                                                                        ) =>
                                                                            updateFunctionParameter(
                                                                                arg.id,
                                                                                param.id,
                                                                                {
                                                                                    isOptional:
                                                                                        checked as boolean,
                                                                                }
                                                                            )
                                                                        }
                                                                    />
                                                                    <Label
                                                                        htmlFor={`paramOptional-${param.id}`}
                                                                        className="text-sm"
                                                                    >
                                                                        Optional
                                                                    </Label>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        removeFunctionParameter(
                                                                            arg.id,
                                                                            param.id
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                </Button>
                                                            </div>
                                                        )
                                                    )}

                                                {arg.functionParameters
                                                    .length === 0 && (
                                                    <p className="text-sm text-gray-500 text-center py-4">
                                                        No parameters defined.
                                                        Click "Add Parameter" to
                                                        add function parameters.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {arg.isState && (
                                        <div className="mt-6 p-4 border rounded-lg bg-white">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-medium">
                                                    State Setter Configuration
                                                </h4>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <SelectInput
                                                        label="Parameter Type"
                                                        id={`stateParamType-${arg.id}`}
                                                        onChange={(value) =>
                                                            updateArgument(
                                                                arg.id,
                                                                {
                                                                    stateParameterType:
                                                                        value,
                                                                }
                                                            )
                                                        }
                                                        options={
                                                            returnTypeOptions
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <TextInput
                                                        label="Parameter Name"
                                                        id={`stateParamName-${arg.id}`}
                                                        value={
                                                            arg.stateParameterName
                                                        }
                                                        onChange={(e) =>
                                                            updateArgument(
                                                                arg.id,
                                                                {
                                                                    stateParameterName:
                                                                        e.target
                                                                            .value,
                                                                }
                                                            )
                                                        }
                                                        placeholder="Parameter name"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                                                <strong>Preview:</strong>{' '}
                                                {arg.name || 'stateSetter'}: (
                                                {arg.stateParameterType}:{' '}
                                                {arg.stateParameterName}) =&gt;
                                                void
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-1 justify-end">
                                        <Button
                                            variant={'ghost'}
                                            size={'icon'}
                                            className="text-destructive text-sm text-right"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeArgument(arg.id);
                                            }}
                                        >
                                            <Trash2 size={14} />
                                            <span className="sr-only">
                                                Remove
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            <Button
                onClick={addArgument}
                className="w-full"
                variant="outline"
                type="button"
            >
                <Plus className="h-4 w-4 mr-2" /> Add Argument
            </Button>
        </div>
    );
};
