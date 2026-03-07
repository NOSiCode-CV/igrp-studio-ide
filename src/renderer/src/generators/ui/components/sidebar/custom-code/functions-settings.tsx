import {
    IGRPAccordionContentPrimitive,
    IGRPAccordionItemPrimitive,
    IGRPAccordionPrimitive,
    IGRPAccordionTriggerPrimitive,
    IGRPButtonPrimitive,
    IGRPCheckboxPrimitive,
    IGRPInputPrimitive,
    IGRPLabelPrimitive,
    IGRPSeparatorPrimitive,
    IGRPSidebarContentPrimitive,
    IGRPSidebarHeaderPrimitive,
    IGRPSidebarPrimitive,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsPrimitive,
    IGRPTabsTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { Arguments, Import } from '@igrp/igrp-studio-nextjs-engine/types'
import {
    CheckboxInput,
    SelectInput,
    TextInput
} from '@renderer/generators/api/components/inputs-form'
import { useComponents } from '@renderer/generators/ui/hooks/useComponents'
import { RETURN_TYPE_OPTIONS } from '@renderer/generators/ui/utils/contants'
import { cn } from '@renderer/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import { type JSX, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useCustomCode from '../../../hooks/useCustomCode'
import { TabSnipptes, TabStates, TabsFunctions, TabTypes } from './custom-code-tabs'
import { GlobalTabFilter, useGlobalTabFilter } from './global-tab-filter'

interface FunctionSettingsSidebarProps extends React.ComponentProps<typeof IGRPSidebarPrimitive> {
    formik?: any
    componentTag: string
    editorRef?: React.RefObject<any>
    onInsertImport?: (importObj: Import) => void
}

export const FunctionSettingsSidebar = ({
    formik,
    editorRef,
    componentTag,
    onInsertImport,
    ...props
}: FunctionSettingsSidebarProps): JSX.Element => {
    const { t } = useTranslation()
    const { states, snippets, functions, types } = useCustomCode()
    const { filterValue, setFilterValue, clearFilter } = useGlobalTabFilter()
    const { componentArguments } = useComponents()

    const [activeTab, setActiveTab] = useState<string>('states')

    const [arguments_, setArguments] = useState<Arguments[]>(
        formik && formik.values?.arguments ? formik.values?.arguments : []
    )

    useEffect(() => {
        if (formik) formik.setFieldValue('arguments', arguments_)
    }, [arguments_])

    return (
        <IGRPSidebarPrimitive
            {...props}
            collapsible="none"
            className="top-(--header-height-two)! h-[calc(100svh-var(--header-height-three))]!"
            style={
                {
                    '--sidebar-width': '380px'
                } as React.CSSProperties
            }
        >
            <IGRPSidebarHeaderPrimitive>
                <div className="flex flex-col mt-2">
                    <h1 className="text-2xl font-bold mb-1">Function Settings</h1>
                    <p className="text-muted-foreground text-sm">Manage your parameters below.</p>
                </div>
            </IGRPSidebarHeaderPrimitive>
            <IGRPSidebarContentPrimitive className="gap-4 p-2">
                <GlobalTabFilter
                    value={filterValue}
                    onChange={setFilterValue}
                    onClear={clearFilter}
                    activeTab={activeTab}
                />

                <IGRPTabsPrimitive
                    defaultValue={formik ? 'props' : 'states'}
                    onValueChange={setActiveTab}
                >
                    <IGRPTabsListPrimitive
                        className={cn('grid w-full grid-cols-5', !formik ? 'grid-cols-4' : '')}
                    >
                        {formik && (
                            <IGRPTabsTriggerPrimitive value="props">Props</IGRPTabsTriggerPrimitive>
                        )}
                        <IGRPTabsTriggerPrimitive value="states">States</IGRPTabsTriggerPrimitive>
                        <IGRPTabsTriggerPrimitive value="functions">
                            Functions
                        </IGRPTabsTriggerPrimitive>
                        <IGRPTabsTriggerPrimitive value="snippets">
                            Snippets
                        </IGRPTabsTriggerPrimitive>
                        <IGRPTabsTriggerPrimitive value="types">Types</IGRPTabsTriggerPrimitive>
                    </IGRPTabsListPrimitive>
                    {formik && (
                        <IGRPTabsContentPrimitive value="props" className="space-y-4">
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
                                    formik.setFieldValue('isAsync', checked)
                                }}
                                onBlur={formik.handleBlur}
                                error={formik.errors.isAsync}
                            />
                            <IGRPSeparatorPrimitive />
                            <div className="flex flex-col gap-2">
                                <SelectInput
                                    label={t('Return Type')}
                                    id="returnValue.type"
                                    value={formik.values.returnValue?.type}
                                    onChange={(value) => {
                                        formik.setFieldValue('returnValue.type', value)
                                    }}
                                    options={RETURN_TYPE_OPTIONS}
                                />

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center space-x-2">
                                        <CheckboxInput
                                            label={t('Is List')}
                                            id="returnValue.isList"
                                            value={formik.values.returnValue?.isList}
                                            onChange={(checked) => {
                                                formik.setFieldValue('returnValue.isList', checked)
                                            }}
                                            className="flex-1"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <CheckboxInput
                                            label={t('Is Optional')}
                                            id="returnValue.isNullable"
                                            value={formik.values.returnValue?.isNullable}
                                            onChange={(checked) => {
                                                formik.setFieldValue(
                                                    'returnValue.isNullable',
                                                    checked
                                                )
                                            }}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>
                            <IGRPSeparatorPrimitive />
                            <FunctionArguments
                                value={arguments_}
                                onChange={setArguments}
                                returnTypeOptions={RETURN_TYPE_OPTIONS}
                            />
                        </IGRPTabsContentPrimitive>
                    )}
                    <IGRPTabsContentPrimitive value="states" className="space-y-4">
                        <TabStates
                            states={states}
                            pageArguments={componentArguments}
                            editorRef={editorRef}
                            globalFilter={filterValue}
                        />
                    </IGRPTabsContentPrimitive>
                    <IGRPTabsContentPrimitive value="snippets" className="space-y-4">
                        <TabSnipptes
                            snippets={snippets}
                            editorRef={editorRef}
                            componentTag={componentTag}
                            globalFilter={filterValue}
                        />
                    </IGRPTabsContentPrimitive>
                    <IGRPTabsContentPrimitive value="functions" className="space-y-4">
                        <TabsFunctions
                            functions={functions}
                            editorRef={editorRef}
                            currentFunction={formik?.values}
                            onInsertImport={onInsertImport}
                            globalFilter={filterValue}
                        />
                    </IGRPTabsContentPrimitive>
                    <IGRPTabsContentPrimitive value="types" className="space-y-4">
                        <TabTypes
                            types={types}
                            editorRef={editorRef}
                            globalFilter={filterValue}
                            onInsertImport={onInsertImport}
                        />
                    </IGRPTabsContentPrimitive>
                </IGRPTabsPrimitive>
            </IGRPSidebarContentPrimitive>
        </IGRPSidebarPrimitive>
    )
}

interface FunctionArgumentsProps {
    value: Arguments[]
    onChange: (args: Arguments[]) => void
    returnTypeOptions: { value: string; label: string }[]
}

export const FunctionArguments = ({
    value: arguments_,
    onChange,
    returnTypeOptions
}: FunctionArgumentsProps): JSX.Element => {
    const removeArgument = (id: string): void => {
        onChange(arguments_.filter((arg) => arg.id !== id))
    }

    const addArgument = (): void => {
        const newId = (Number.parseInt(arguments_[arguments_.length - 1]?.id || '0') + 1).toString()
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
                functionParameters: []
            }
        ])
    }

    const updateArgument = (id: string, updates: Partial<Arguments>): void => {
        onChange(arguments_.map((arg) => (arg.id === id ? { ...arg, ...updates } : arg)))
    }

    const addFunctionParameter = (argumentId: string): void => {
        const newParameter: Arguments = {
            id: Date.now().toString(),
            name: '',
            type: 'string',
            isOptional: false,
            isList: false,
            isInterface: false,
            isFunction: false,
            isState: false
        }

        updateArgument(argumentId, {
            functionParameters: [
                ...(arguments_.find((arg) => arg.id === argumentId)?.functionParameters || []),
                newParameter
            ]
        })
    }

    const removeFunctionParameter = (argumentId: string, parameterId: string): void => {
        const argument = arguments_.find((arg) => arg.id === argumentId)
        if (argument) {
            updateArgument(argumentId, {
                functionParameters: (argument.functionParameters || []).filter(
                    (param) => param.id !== parameterId
                )
            })
        }
    }

    const updateFunctionParameter = (
        argumentId: string,
        parameterId: string,
        updates: Partial<Arguments>
    ): void => {
        const argument = arguments_.find((arg) => arg.id === argumentId)
        if (argument) {
            updateArgument(argumentId, {
                functionParameters: (argument.functionParameters || []).map((param) =>
                    param.id === parameterId ? { ...param, ...updates } : param
                )
            })
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <IGRPLabelPrimitive>Define Arguments</IGRPLabelPrimitive>
            <IGRPAccordionPrimitive type="single" collapsible className="w-full">
                {arguments_.map((arg, index) => (
                    <IGRPAccordionItemPrimitive value={`argName-${index}`} key={arg.id}>
                        <IGRPAccordionTriggerPrimitive
                            iconName="ChevronDown"
                            showIcon
                            iconPlacement="end"
                        >
                            <div className="flex justify-between items-center w-full">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Argument {index + 1}</span>
                                    <span className="text-gray-400 text-sm">
                                        {arg.type}
                                        {arg.isList ? '[]' : ''}
                                        {arg.isOptional ? '?' : ''}
                                    </span>
                                </div>
                            </div>
                        </IGRPAccordionTriggerPrimitive>
                        <IGRPAccordionContentPrimitive className="border rounded-lg  space-y-4 p-3">
                            <div className="p-1 space-y-3">
                                <TextInput
                                    id={`argName-${arg.id}`}
                                    label="Name"
                                    value={arg.name}
                                    onChange={(e) =>
                                        updateArgument(arg.id, {
                                            name: e.target.value
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
                                                type: value as string
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
                                                            isList: !arg.isList
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
                                                            isOptional: !arg.isOptional
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
                                                            isInterface: !arg.isInterface
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
                                                            isFunction: !arg.isFunction
                                                        })
                                                    }
                                                    label="isFunction"
                                                />
                                            </div>
                                            {/* <div className="flex items-center space-x-2">
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
                                            </div> */}
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
                                                    <IGRPLabelPrimitive>
                                                        Parameters
                                                    </IGRPLabelPrimitive>
                                                    <IGRPButtonPrimitive
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addFunctionParameter(arg.id)}
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Add Parameter
                                                    </IGRPButtonPrimitive>
                                                </div>

                                                {arg?.functionParameters &&
                                                    arg.functionParameters.map(
                                                        (param, paramIndex) => (
                                                            <div
                                                                key={param.id}
                                                                className="flex items-center gap-2 p-3 border rounded bg-gray-50"
                                                            >
                                                                <div className="flex-1">
                                                                    <IGRPInputPrimitive
                                                                        placeholder={`Parameter ${paramIndex + 1} name`}
                                                                        value={param.name}
                                                                        onChange={(e) =>
                                                                            updateFunctionParameter(
                                                                                arg.id,
                                                                                param.id,
                                                                                {
                                                                                    name: e.target
                                                                                        .value
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
                                                                        value={param.type}
                                                                        onChange={(value) =>
                                                                            updateFunctionParameter(
                                                                                arg.id,
                                                                                param.id,
                                                                                {
                                                                                    type: value as string
                                                                                }
                                                                            )
                                                                        }
                                                                        options={returnTypeOptions}
                                                                    />
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <IGRPCheckboxPrimitive
                                                                        id={`paramOptional-${param.id}`}
                                                                        checked={param.isOptional}
                                                                        onCheckedChange={(
                                                                            checked
                                                                        ) =>
                                                                            updateFunctionParameter(
                                                                                arg.id,
                                                                                param.id,
                                                                                {
                                                                                    isOptional:
                                                                                        checked as boolean
                                                                                }
                                                                            )
                                                                        }
                                                                    />
                                                                    <IGRPLabelPrimitive
                                                                        htmlFor={`paramOptional-${param.id}`}
                                                                        className="text-sm"
                                                                    >
                                                                        Optional
                                                                    </IGRPLabelPrimitive>
                                                                </div>
                                                                <IGRPButtonPrimitive
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
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </IGRPButtonPrimitive>
                                                            </div>
                                                        )
                                                    )}

                                                {arg.functionParameters &&
                                                    arg.functionParameters.length === 0 && (
                                                        <p className="text-sm text-gray-500 text-center py-4">
                                                            No parameters defined. Click &quot;Add
                                                            Parameter&quot; to add function
                                                            parameters.
                                                        </p>
                                                    )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-1 justify-end">
                                        <IGRPButtonPrimitive
                                            variant={'ghost'}
                                            size={'icon'}
                                            className="text-destructive text-sm text-right"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeArgument(arg.id)
                                            }}
                                        >
                                            <Trash2 size={14} />
                                            <span className="sr-only">Remove</span>
                                        </IGRPButtonPrimitive>
                                    </div>
                                </div>
                            </div>
                        </IGRPAccordionContentPrimitive>
                    </IGRPAccordionItemPrimitive>
                ))}
            </IGRPAccordionPrimitive>
            <IGRPButtonPrimitive
                onClick={addArgument}
                className="w-full"
                variant="outline"
                type="button"
            >
                <Plus className="h-4 w-4 mr-2" /> Add Argument
            </IGRPButtonPrimitive>
        </div>
    )
}
