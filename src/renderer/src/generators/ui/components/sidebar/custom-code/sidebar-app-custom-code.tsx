import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuTriggerPrimitive,
    IGRPLabelPrimitive,
    IGRPSidebarGroupPrimitive,
    IGRPSidebarInsetPrimitive,
    IGRPSidebarMenuButtonPrimitive,
    IGRPSidebarMenuItemPrimitive,
    IGRPSidebarMenuPrimitive,
    IGRPSidebarMenuSubButtonPrimitive,
    IGRPSidebarMenuSubItemPrimitive,
    IGRPSidebarMenuSubPrimitive
} from '@igrp/igrp-framework-react-design-system'
import type {
    CodeSnippetsRegisterConfig,
    CustomFunctionConfig,
    Import,
    State
} from '@igrp/igrp-studio-nextjs-engine/types'
import { nanoid } from '@reduxjs/toolkit'
import AlertIGRPDialogPrimitiveDelete from '@renderer/components/alert-dialog-delete'
import { EmptyList } from '@renderer/components/empty-list'
import MonacoEditor from '@renderer/components/monaco-editor'
import { PATTERNS } from '@renderer/constants/appConstants'
import { type FormikProps, useFormik } from 'formik'
import { ChevronRight, FunctionSquare, Loader, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { type JSX, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import { useDroppedComponents } from '../../../dnd/DroppedComponentsContext'
import useCustomCode from '../../../hooks/useCustomCode'
import { ImportComponent } from './custom-code-imports'
import { SnnipetComponent } from './custom-code-snippet'
import { StateComponent } from './custom-code-state'
import { FunctionSettingsSidebar } from './functions-settings'

interface ResourceListProps<T> {
    title: string
    items: T[]
    searchTerm: string
    onEdit: (item: T) => void
    onDelete?: (item: T) => void
    renderItemName: (item: T) => string
    editModal?: React.ReactNode
}

const SidebarAppCustomCode = ({ searchTerm }: { searchTerm: string }): JSX.Element => {
    const { removeFunction, removeState } = useDroppedComponents()

    const { snippets, functions, states, isLoading } = useCustomCode()

    const [currentFunction, setCurrentFunction] = useState<CustomFunctionConfig | null>(null)
    const [currentState, setCurrentState] = useState<State | null>(null)
    const [currentSnnipet, setCurrentSnippet] = useState<CodeSnippetsRegisterConfig | null>(null)
    const [openFnc, setOpenFnc] = useState(false)
    const [openState, setOpenState] = useState(false)
    const [openSnippet, setOpenSnippet] = useState(false)

    const hasResources = functions.length > 0 || states.length > 0 || snippets.length > 0

    return (
        <>
            {isLoading ? (
                <div className="flex items-center justify-center h-screen">
                    <Loader />
                </div>
            ) : hasResources ? (
                <>
                    <ResourceList
                        title="Functions"
                        items={functions}
                        searchTerm={searchTerm}
                        onEdit={(fnc) => {
                            setCurrentFunction(fnc)
                            setOpenFnc(true)
                        }}
                        onDelete={(fnc) => removeFunction(fnc.id)}
                        renderItemName={(fnc) => fnc.name}
                        editModal={
                            openFnc && (
                                <FncComponent
                                    open={openFnc}
                                    setOpen={setOpenFnc}
                                    funct={currentFunction || undefined}
                                />
                            )
                        }
                    />

                    <ResourceList
                        title="States"
                        items={states}
                        searchTerm={searchTerm}
                        onEdit={(state) => {
                            setCurrentState(state)
                            setOpenState(true)
                        }}
                        onDelete={(state) => removeState(state.id)}
                        renderItemName={(state) => state.name}
                        editModal={
                            openState && (
                                <StateComponent
                                    open={openState}
                                    setOpen={setOpenState}
                                    state={currentState || undefined}
                                />
                            )
                        }
                    />

                    <ResourceList
                        title="Snippets"
                        items={snippets}
                        searchTerm={searchTerm}
                        onEdit={(snippet) => {
                            setCurrentSnippet(snippet)
                            setOpenSnippet(true)
                        }}
                        renderItemName={(snippet) => snippet.title}
                        editModal={
                            openSnippet && (
                                <SnnipetComponent
                                    open={openSnippet}
                                    setOpen={setOpenSnippet}
                                    snippet={currentSnnipet}
                                />
                            )
                        }
                    />
                </>
            ) : (
                <div className="p-4">
                    <EmptyList
                        icon={<FunctionSquare />}
                        title="No Functions"
                        description="Create your first custom function to add functionality to your page!"
                        className="py-12"
                    />
                </div>
            )}
        </>
    )
}

const ResourceList = <
    T extends {
        id?: string
        name: string
        actions?: { deletable?: boolean; editable?: boolean }
    }
>({
    title,
    items,
    searchTerm,
    onEdit,
    onDelete,
    renderItemName,
    editModal
}: ResourceListProps<T>): JSX.Element => {
    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const [isDelete, setIsDelete] = useState<boolean>(false)
    const [currentItem, setCurrentItem] = useState<T | null>(null)
    return (
        <>
            {filteredItems.length > 0 && (
                <>
                    <IGRPSidebarGroupPrimitive>
                        <IGRPSidebarMenuPrimitive>
                            <IGRPSidebarMenuItemPrimitive key={title}>
                                <IGRPSidebarMenuButtonPrimitive asChild>
                                    <span className="font-medium">{title}</span>
                                </IGRPSidebarMenuButtonPrimitive>
                                <IGRPSidebarMenuSubPrimitive>
                                    {filteredItems.map((item, index) => {
                                        const hasDelete = item.actions
                                            ? item.actions.deletable
                                            : onDelete && item.id

                                        const hasEdit = item.actions
                                            ? item.actions.editable
                                            : !!item.id

                                        return (
                                            <IGRPSidebarMenuSubItemPrimitive key={index}>
                                                <IGRPSidebarMenuSubButtonPrimitive asChild>
                                                    <div className="flex items-center justify-between w-full group/item relative">
                                                        <span className="">
                                                            {renderItemName(item)}
                                                        </span>
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2  opacity-0 group-hover/item:opacity-100">
                                                            {hasEdit && (
                                                                <IGRPButtonPrimitive
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6"
                                                                    onClick={() => onEdit(item)}
                                                                >
                                                                    <Pencil className="h-3 w-3" />
                                                                </IGRPButtonPrimitive>
                                                            )}
                                                            {hasDelete && (
                                                                <IGRPButtonPrimitive
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                                                    onClick={() => {
                                                                        setCurrentItem(item)
                                                                        setIsDelete(!isDelete)
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </IGRPButtonPrimitive>
                                                            )}
                                                        </div>
                                                    </div>
                                                </IGRPSidebarMenuSubButtonPrimitive>
                                            </IGRPSidebarMenuSubItemPrimitive>
                                        )
                                    })}
                                </IGRPSidebarMenuSubPrimitive>
                            </IGRPSidebarMenuItemPrimitive>
                        </IGRPSidebarMenuPrimitive>
                    </IGRPSidebarGroupPrimitive>
                </>
            )}
            {editModal}
            <AlertIGRPDialogPrimitiveDelete
                isOpen={isDelete}
                onClose={() => setIsDelete(false)}
                onConfirm={() => currentItem && onDelete?.(currentItem)}
                hasTrigger={false}
            />
        </>
    )
}

const CustomCodeMenu = (): React.ReactNode => {
    const [openfnc, setOpenFnc] = useState<boolean>(false)
    const [openState, setOpenState] = useState<boolean>(false)

    return (
        <>
            <IGRPDropdownMenuPrimitive>
                <IGRPDropdownMenuTriggerPrimitive asChild>
                    <IGRPButtonPrimitive variant={'outline'} size={'icon'}>
                        <Plus />
                    </IGRPButtonPrimitive>
                </IGRPDropdownMenuTriggerPrimitive>
                <IGRPDropdownMenuContentPrimitive className="w-48">
                    <IGRPDropdownMenuItemPrimitive onClick={() => setOpenFnc(true)}>
                        <div className="flex flex-1 justify-between items-center">
                            <span>Function</span>
                            <ChevronRight className="w-8 h-8" />
                        </div>
                    </IGRPDropdownMenuItemPrimitive>
                    <IGRPDropdownMenuItemPrimitive onClick={() => setOpenState(true)}>
                        <div className="flex flex-1 justify-between items-center">
                            <span>State</span>
                            <ChevronRight className="w-8 h-8" />
                        </div>
                    </IGRPDropdownMenuItemPrimitive>
                </IGRPDropdownMenuContentPrimitive>
            </IGRPDropdownMenuPrimitive>
            {openfnc && <FncComponent open={openfnc} setOpen={setOpenFnc} />}
            {openState && <StateComponent open={openState} setOpen={setOpenState} />}
        </>
    )
}

const FncComponent = ({
    open,
    setOpen,
    funct
}: {
    funct?: CustomFunctionConfig
    open: boolean
    setOpen: (prompt: boolean) => void
}): JSX.Element => {
    const { addFunction, updateFunction } = useDroppedComponents()
    const codeRef = useRef<string>('')
    const { t } = useTranslation()

    // Define return type options
    // Add this validation schema outside your component
    const functionValidationSchema = Yup.object().shape({
        name: Yup.string()
            .required(t('fieldRequired', { name: t('Function name') }))
            .matches(PATTERNS.SPECIAL_CHARACTERS, t('msgSpecialCharactersRegex')),
        returnValue: Yup.object().shape({
            type: Yup.string().required(t('fieldRequired', { name: t('Return type') })),
            isNullable: Yup.boolean(),
            isList: Yup.boolean()
        })
    })

    const formik: FormikProps<CustomFunctionConfig> = useFormik<CustomFunctionConfig>({
        enableReinitialize: true,
        initialValues: {
            id: '',
            name: '',
            code: '',
            returnValue: {
                type: 'void',
                isNullable: false,
                isList: false
            },
            imports: [],
            arguments: [],
            isAsync: false,
            ...funct
        },
        validationSchema: functionValidationSchema,
        onSubmit: (values, actions) => {
            try {
                const fncData: CustomFunctionConfig = {
                    ...values,
                    code: codeRef.current,
                    arguments: values.arguments || []
                }

                if (fncData.id === '') {
                    addFunction({
                        ...fncData,
                        id: `fnc_${nanoid(6).replace(/-/g, '')}`
                    })
                } else {
                    updateFunction(fncData.id, fncData)
                }

                setOpen(false)
            } catch (error) {
                console.error('Submission failed:', error)
            } finally {
                actions.setSubmitting(false)
            }
        }
    })

    const handleChangeImport = (importObj: Import): void => {
        formik.setFieldValue('imports', [...(formik.values.imports || []), importObj])
    }

    useEffect(() => {
        if (funct) {
            codeRef.current = funct.code
        }
    }, [funct])

    const editorRef = useRef<any>(null)

    return (
        <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
            <IGRPDialogContentPrimitive className="p-0 flex overflow-hidden [--header-height-three:calc(--spacing(75))] w-full sm:max-w-[800px] lg:max-w-[70vw] max-w-[90vw]">
                <IGRPSidebarInsetPrimitive>
                    <form onSubmit={formik.handleSubmit} className="space-y-4 p-4">
                        <IGRPDialogHeaderPrimitive>
                            <IGRPDialogTitlePrimitive>
                                <div className="flex items-center gap-2 justify-between">
                                    <div>
                                        {funct ? 'Edit Function' : 'Create Function'}{' '}
                                        <span className="text-muted-foreground">
                                            {funct ? funct.name : ''}
                                        </span>
                                    </div>
                                    <IGRPButtonPrimitive
                                        type="submit"
                                        disabled={formik.isSubmitting || !formik.isValid}
                                        className="relative"
                                        size={'sm'}
                                    >
                                        {formik.isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {funct ? 'Saving...' : 'Creating...'}
                                            </>
                                        ) : funct ? (
                                            'Save changes'
                                        ) : (
                                            'Create Function'
                                        )}
                                    </IGRPButtonPrimitive>
                                </div>
                            </IGRPDialogTitlePrimitive>
                            <IGRPDialogDescriptionPrimitive />
                        </IGRPDialogHeaderPrimitive>

                        <ImportComponent
                            initialImports={formik.values?.imports || []}
                            onChange={(imports) => formik.setFieldValue('imports', imports)}
                        />

                        <div className="flex-1 border rounded">
                            <IGRPLabelPrimitive className="block text-sm font-medium text-foreground mb-2 p-2 border-b">
                                {t('Function body')}
                            </IGRPLabelPrimitive>

                            {/* Function Preview */}
                            <div className="border-b bg-background p-3  font-mono text-sm">
                                <div className="text-blue-600">
                                    {formik.values.isAsync ? 'async ' : ''}
                                    function {formik.values.name || 'functionName'}
                                </div>
                                <div className="text-gray-600 ml-4">
                                    (
                                    {formik.values.arguments?.map((arg, index) => (
                                        <span key={arg.id || index}>
                                            {arg.name}
                                            {arg.isOptional ? '?' : ''}: {arg.type}
                                            {arg.isList ? '[]' : ''}
                                            {index < (formik.values.arguments?.length || 0) - 1
                                                ? ', '
                                                : ''}
                                        </span>
                                    )) || 'no arguments'}
                                    )
                                </div>
                                <div className="text-green-600 mt-2">
                                    → {formik.values.returnValue?.type || 'void'}
                                    {formik.values.returnValue?.isList ? '[]' : ''}
                                    {formik.values.returnValue?.isNullable ? ' | null' : ''}
                                </div>
                            </div>

                            <MonacoEditor
                                ref={editorRef}
                                content={funct?.code || ''}
                                filePath=""
                                onChange={(newCode: string) => {
                                    codeRef.current = newCode
                                }}
                                height="40vh"
                                language="typescript"
                            />
                        </div>
                    </form>
                </IGRPSidebarInsetPrimitive>
                <FunctionSettingsSidebar
                    formik={formik}
                    editorRef={editorRef}
                    side="right"
                    componentTag={''}
                    onInsertImport={(importObj) => handleChangeImport(importObj)}
                />
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    )
}

export { SidebarAppCustomCode, CustomCodeMenu }
