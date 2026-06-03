import { Button } from '@renderer/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@renderer/components/ui/dialog'
import { Label } from '@renderer/components/ui/label'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { IGRPSwitch, type IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system'
import type { FieldValidation } from '@igrp/igrp-studio-nextjs-engine/types'
import { SelectInput, TextInput } from '@renderer/generators/api/components/inputs-form'
import { handleChangeValueObject } from '@renderer/generators/api/helpers'
import useStudio from '@renderer/hooks/use-studio'
import useToast from '@renderer/hooks/useToast'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { capitalize, getId } from '@renderer/utils'
import { useFormikCompat, useZodForm } from '@renderer/lib/form'
import { z } from 'zod'
import { camelCase } from '@renderer/utils'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react/jsx-runtime'
import { useTranslation } from 'react-i18next'
import type { SchemaTypeItem } from 'src/main/types'
import { COMPONENT } from '../../ComponentTypes'
import BindingFormList from './binding-form-list'
import { useDroppedComponents } from '../../contexts/EditorContext'
import useCustomCode from '../../hooks/useCustomCode'

interface LabeledElementField {
    componentId: string
    name: string
    type: string
    validation?: FieldValidation
    defaultValue?: string
    required: boolean
    label: string
    fields?: LabeledElementField[]
    isList?: boolean
    isKey?: boolean
    nullable?: boolean
}

const defaultFieldType: LabeledElementField = {
    componentId: '',
    name: '',
    type: 'string',
    required: false,
    defaultValue: undefined,
    label: '',
    isList: false,
    isKey: false,
    nullable: false
}

/**
 * Types shown in the binding UI. Primitives map 1:1 to `resolveZodTypes`.
 * `email` / `url` / `uuid` are string refinements (z.string().email(), …),
 * persisted as `type: "string"` + `validation.{email|url|uuid}: true`.
 * @see studio/_skills/igrp-studio-metadata/troubleshooting.md
 */
const FIELD_TYPES: SchemaTypeItem[] = [
    { value: 'string', label: 'String' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' },
    { value: 'uuid', label: 'UUID' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date', label: 'Date' },
    { value: 'file', label: 'File' }
]

const STRING_FORMAT_TYPES = ['email', 'url', 'uuid'] as const
type StringFormatType = (typeof STRING_FORMAT_TYPES)[number]

function isStringFormatType(type: string): type is StringFormatType {
    return (STRING_FORMAT_TYPES as readonly string[]).includes(type)
}

/**
 * Map engine widget types and legacy aliases to Zod primitives on load.
 * Returns the original value when no mapping applies so unknown types
 * stay visible. 'object' is intentionally NOT mapped — FormList uses it
 * as a nested-struct marker alongside fields[].
 */
const LEGACY_TYPE_MAP: Record<string, { type: string; isList?: boolean }> = {
    // Engine FIELD_TYPES (utils/constants.ts) — UI widgets → Zod
    text: { type: 'string' },
    password: { type: 'string' },
    tel: { type: 'string' },
    color: { type: 'string' },
    select: { type: 'string' },
    select2: { type: 'string' },
    radio: { type: 'string' },
    time: { type: 'string' },
    range: { type: 'number' },
    checkbox: { type: 'boolean' },
    switch: { type: 'boolean' },
    button: { type: 'boolean' },
    // Legacy / aliases
    string: { type: 'string' },
    boolean: { type: 'boolean' },
    textarea: { type: 'string' },
    array: { type: 'string', isList: true },
    integer: { type: 'number' },
    long: { type: 'number' },
    double: { type: 'number' },
    float: { type: 'number' },
    datetime: { type: 'date' }
}

function applyTypeSelection(
    field: LabeledElementField,
    selectedType: string
): LabeledElementField {
    const validation: FieldValidation = {
        ...(field.validation ?? {}),
        errors: field.validation?.errors ?? []
    }
    delete validation.email
    delete validation.url
    delete validation.uuid

    if (isStringFormatType(selectedType)) {
        validation[selectedType] = true
        return { ...field, type: selectedType, validation }
    }

    const mapped = LEGACY_TYPE_MAP[selectedType]
    return {
        ...field,
        type: mapped?.type ?? selectedType,
        ...(mapped?.isList !== undefined ? { isList: mapped.isList } : {}),
        validation
    }
}

/** Persist UI presets as `string` + validation flags for codegen. */
function fieldToPersistedFormat(field: LabeledElementField): LabeledElementField {
    const nested = field.fields?.map(fieldToPersistedFormat)

    if (isStringFormatType(field.type)) {
        const format = field.type
        const { email: _e, url: _u, uuid: _i, ...restValidation } = field.validation ?? {}
        const validation: FieldValidation = {
            ...restValidation,
            errors: field.validation?.errors ?? [],
            [format]: true
        }
        return {
            ...field,
            type: 'string',
            validation,
            ...(nested ? { fields: nested } : {})
        }
    }

    const mapped = LEGACY_TYPE_MAP[field.type]
    if (!mapped && !nested) return field
    return {
        ...field,
        ...(mapped ? { type: mapped.type, isList: mapped.isList ?? field.isList } : {}),
        ...(nested ? { fields: nested } : {})
    }
}

/**
 * Pick a usable identifier-style name for a field. Dropped components
 * sometimes carry a label but no `tag` (e.g. when imported or built
 * via a path that skips generateTag). Falling through to the label
 * keeps the Name column populated and gives the codegen a meaningful
 * key instead of an empty string.
 */
function deriveFieldName(child: StructuredComponent): string {
    const tag = child.tag?.trim()

    if (tag) return tag
    const label =
        (child.properties?.label as string | undefined)?.trim() ??
        (child.properties?.headerTitle as string | undefined)?.trim() ??
        (child.label as string | undefined)?.trim() ??
        ''
    if (label) return camelCase(label)
    return child.id ?? ''
}

function normalizeFieldType<
    T extends { type: string; isList?: boolean; fields?: any[]; validation?: FieldValidation }
>(field: T): T {
    const mapped = LEGACY_TYPE_MAP[field.type]
    let type = mapped?.type ?? field.type
    const isList = mapped?.isList ?? field.isList

    const v = field.validation
    if (type === 'string' && v) {
        if (v.email) type = 'email'
        else if (v.url) type = 'url'
        else if (v.uuid) type = 'uuid'
    }

    const nested = field.fields ? field.fields.map(normalizeFieldType) : undefined
    if (type === field.type && isList === field.isList && !nested) return field
    return {
        ...field,
        type,
        ...(isList !== field.isList ? { isList } : {}),
        ...(nested ? { fields: nested } : {})
    }
}

interface BindingProps {
    path: string
    comp: StructuredComponent
    open: boolean
    setOpen: (open: boolean) => void
}

export const BindingConfigurationModal = ({ comp, open, setOpen }: BindingProps): JSX.Element => {
    const { t } = useTranslation()
    const { types, typesOptions } = useCustomCode()
    const { showErrorToast } = useToast()
    const { getDataComponent } = useStudio()

    const [selectedType, setSelectedType] = useState<string>('')

    const selectedTypeData = useMemo(
        () => types.find((c: LabeledElementField) => c.name === selectedType),
        [types, selectedType]
    )
    const typeFilePath = selectedTypeData?.path ?? ''
    const fieldsTypeOptions = useMemo<IGRPOptionsProps[]>(
        () =>
            (selectedTypeData?.fields ?? []).map((field: LabeledElementField) => ({
                label: `${field.name} (${field.type})`,
                value: field.name
            })),
        [selectedTypeData]
    )

    const { createOrUpdateType, getTypeByComponentId, handleUpdateChildComponent, components } =
        useDroppedComponents()

    const { tag, id: componentId } = comp

    const compType = getTypeByComponentId(componentId)

    const [newBinding, setNewBinding] = useState<boolean>(
        compType?.path === '' || compType?.path === undefined
    )

    const [formDefaultData, setFormDefaultData] = useState<any>(null)

    const validate = (): boolean => {
        const fieldNames = formik.values.fields.map((f) => f.name)
        if (new Set(fieldNames).size !== fieldNames.length) {
            showErrorToast('Field names must be unique')
            return false
        }
        return true
    }

    const getDefaultValue = (field: LabeledElementField): string => {
        if (field.defaultValue !== '' && field.defaultValue !== undefined) {
            return field.defaultValue
        }
        if (!field.required) return ''

        // List fields default to an empty array regardless of element type.
        if (field.isList) return '[]'

        switch (field.type) {
            case 'number':
                return '0'
            case 'boolean':
                return 'false'
            case 'date':
                return 'new Date()'
            case 'string':
            case 'file':
                return ''
            default:
                return ''
        }
    }

    const initialValues: any = {
        componentId,
        path: '',
        fields: [],
        isEnum: false,
        isMainType: false,
        definitionType: 'auto' as 'zod-object' | 'json-schema' | 'auto',
        tags: [] as string[],
        customInstanceName: '',
        customInitInstanceName: '',
        ...compType,
        // Resolve `name` AFTER the spread so an empty or missing
        // compType.name does not overwrite the component's tag.
        // Falls back to the component name (e.g. 'form', 'table')
        // so the field is never blank when the modal opens.
        name:
            (compType?.name && String(compType.name).trim()) ||
            (tag && String(tag).trim()) ||
            comp.componentName ||
            ''
    }
    const rhfForm = useZodForm<any>({
        schema: z.object({}).passthrough() as never,
        defaultValues: initialValues
    })
    const formik = useFormikCompat<any>(rhfForm, async (values) => {
        if (!validate() || !componentId) return

        const updatedComponent = {
            ...values,
            fields: (values.fields as LabeledElementField[]).map((field) => {
                const persisted = fieldToPersistedFormat(field)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { label, ...rest } = persisted
                return {
                    ...rest,
                    type: rest.type || 'string',
                    defaultValue: getDefaultValue(persisted),
                    ...(rest.fields && {
                        fields: rest.fields.map((nested) => {
                            const nestedPersisted = fieldToPersistedFormat(nested)
                            return {
                                ...nestedPersisted,
                                type: nestedPersisted.type || 'string',
                                defaultValue: getDefaultValue(nestedPersisted)
                            }
                        })
                    })
                }
            })
        }

        createOrUpdateType({
            ...updatedComponent,
            isEnum: !!values.isEnum,
            isMainType: !!values.isMainType,
            definitionType: values.definitionType ?? 'auto',
            tags: Array.isArray(values.tags)
                ? values.tags.filter((tag: string) => tag.trim().length > 0)
                : [],
            customInstanceName: values.customInstanceName?.trim() || undefined,
            customInitInstanceName: values.customInitInstanceName?.trim() || undefined,
            path: !newBinding && typeFilePath ? typeFilePath : ''
        })

        //TODO For revisions]
        if (comp.componentName === COMPONENT.Form) {
            //TODOREVISAR
            const data = formDefaultData
            const newState = {
                state: {
                    id: getId(),
                    type:
                        (data &&
                            'defaultValues' in data &&
                            data.defaultValues?.properties?.type?.default) ??
                        'any',
                    name: `${
                        values.name ??
                        (
                            data &&
                                'defaultValues' in data &&
                                data.defaultValues?.properties?.name?.default
                        ) ??
                        ''
                    }Data`,
                    defaultValue: `init${capitalize(values.name)}`,
                    imports:
                        (data &&
                            'defaultValues' in data &&
                            data.defaultValues?.properties?.imports?.default) ??
                        [],
                    generate: true
                }
            }

            handleUpdateChildComponent(componentId, {
                dataType: values.name,
                data: {
                    ...comp.data,
                    defaultValues: newState
                }
            })
        } else {
            handleUpdateChildComponent(componentId, {
                dataType: values.name
            })
        }

        values.fields.forEach(({ componentId: id, name }) => {
            const component = componentMap.get(id)
            if (component) {
                handleUpdateChildComponent(id, {
                    tag: name
                })
            }
        })

        setOpen(false)
    })

    const isEnum = !!formik.values.isEnum

    /**
     * Enum types collapse to a flat list of named cases — engine codegen
     * derives the discriminated union from `fields[].name` and the
     * stored `defaultValue` for each entry. We hide every column that
     * does not apply (type selector, list/key flags, validation popover).
     */
    const columns = isEnum
        ? [
              { key: 'name', name: t('enumCaseName'), type: 'string' },
              { key: 'defaultValue', name: t('enumCaseValue'), type: 'string' },
              { key: 'label', name: t('label'), type: 'string' }
          ]
        : [
              { key: 'label', name: t('label'), type: 'label' },
              { key: 'name', name: t('name'), type: 'text', readonly: !newBinding },
              ...(!newBinding
                  ? [
                        {
                            key: 'newType',
                            name: t('type'),
                            type: 'select',
                            options: fieldsTypeOptions
                        }
                    ]
                  : []),

              ...(newBinding
                  ? [
                        {
                            key: 'type',
                            name: t('dataType'),
                            type: 'typeSelectorDropdown',
                            options: FIELD_TYPES
                        },
                        {
                            key: 'required',
                            name: 'Required?',
                            type: 'checkbox'
                        },
                        {
                            key: 'nullable',
                            name: 'Nullable?',
                            type: 'checkbox'
                        },
                        {
                            key: 'isList',
                            name: 'IsList?',
                            type: 'checkbox'
                        }
                        /*  {
                            key: 'isKey',
                            name: 'Key?',
                            type: 'checkbox'
                        } */
                    ]
                  : []),
              { key: 'defaultValue', name: t('defaultValue'), type: 'text' },
              {
                  key: 'group',
                  name: '',
                  type: 'group',
                  items: [
                      {
                          key: 'validation',
                          name: '',
                          type: 'popoverFormValidation',
                          options: []
                      }
                  ]
              }
          ]

    const getFields = (): LabeledElementField[] => selectedTypeData?.fields ?? []

    const extractValidFields = (
        components: StructuredComponent[]
    ): {
        fields: LabeledElementField[]
        componentMap: Map<string, StructuredComponent>
    } => {
        const componentMap: Map<string, StructuredComponent> = new Map()
        const fields: LabeledElementField[] = []

        const processComponent = (child: StructuredComponent, parentIsRepeater = false): void => {
            if (!child) return

            // Check if component should be included as a field
            const shouldInclude =
                child?.properties?.dataProperties &&
                !child.properties.dataProperties.isVirtual &&
                child.properties.dataProperties.isType

            const isDynamicRepeater = child.componentName === COMPONENT.FormList

            if (isDynamicRepeater) {
                // Process children first to get the nested fields structure
                const nestedFields: LabeledElementField[] = []
                const nestedComponentMap: Map<string, StructuredComponent> = new Map()

                // Temporary process to get nested structure
                const tempProcess = (nestedChild: StructuredComponent): void => {
                    if (!nestedChild) return

                    const nestedShouldInclude =
                        nestedChild?.properties?.dataProperties &&
                        !nestedChild.properties.dataProperties.isVirtual &&
                        nestedChild.properties.dataProperties.isType

                    if (nestedShouldInclude) {
                        nestedFields.push({
                            ...defaultFieldType,
                            name: deriveFieldName(nestedChild),
                            componentId: nestedChild.id,
                            label: nestedChild.properties.label ?? nestedChild.label
                        })
                        nestedComponentMap.set(nestedChild.id, nestedChild)
                    }

                    if (Array.isArray(nestedChild.children)) {
                        nestedChild.children.forEach(tempProcess)
                    }
                }

                child.children.forEach(tempProcess)

                // Only add the repeater field if it hasn't been added yet
                fields.push({
                    ...defaultFieldType,
                    name: deriveFieldName(child),
                    componentId: child.id,
                    label: child.properties.label ?? child.properties.headerTitle ?? child.label,
                    isList: true,
                    type: 'object',
                    // Add nested fields structure as options
                    fields: nestedFields.map((field) => ({
                        ...defaultFieldType,
                        ...field
                    }))
                })

                // Add all components to the main map
                componentMap.set(child.id, child)
                nestedComponentMap.forEach((value, key) => componentMap.set(key, value))

                return // Skip further processing for repeater children
            }

            if (shouldInclude && !parentIsRepeater) {
                const inferredType = child.properties.dataProperties?.type || 'string'
                fields.push(
                    normalizeFieldType({
                        ...defaultFieldType,
                        name: deriveFieldName(child),
                        componentId: child.id,
                        label: child.properties.label ?? child.properties.headerTitle ?? child.label,
                        type: inferredType
                    })
                )

                componentMap.set(child.id, child)
            }

            // Process children recursively (unless parent is a repeater)
            if (Array.isArray(child.children) && !parentIsRepeater) {
                child.children.forEach((c) => processComponent(c, isDynamicRepeater))
            }
        }

        components.forEach((component) => processComponent(component))

        return { fields, componentMap }
    }

    const updateFieldsWithSubFields = (
        originalFields: LabeledElementField[],
        currentFields: LabeledElementField[]
    ): LabeledElementField[] => {
        return originalFields.map((field) => {
            const currentField = currentFields.find((f) => f.componentId === field.componentId)

            const mergedField: LabeledElementField = {
                ...field,
                ...currentField,
                // Prefer the freshly derived name when the persisted
                // value is empty (legacy data saved before
                // deriveFieldName fell back through label) — otherwise
                // keep whatever the user typed manually.
                name: (currentField?.name && String(currentField.name).trim()) || field.name,
                label: (currentField?.label && String(currentField.label).trim()) || field.label
            }

            if (field.fields && currentField?.fields) {
                mergedField.fields = updateFieldsWithSubFields(field.fields, currentField.fields)
            }

            return mergedField
        })
    }

    const componentMap = comp.children?.length
        ? extractValidFields(comp.children).componentMap
        : new Map<string, StructuredComponent>()

    useEffect(() => {
        // Auto-add fields from children if not already in the list
        if (comp.children?.length) {
            const currentFields: any[] = (formik.values.fields || []).map(normalizeFieldType)

            const { fields } = extractValidFields(comp.children)

            const updatedFields = updateFieldsWithSubFields(fields, currentFields)

            formik.setFieldValue('fields', [...updatedFields.map(normalizeFieldType)])
        }
    }, [components, comp.children])

    const handleChange = (element: string, position: number, result: any): void => {
        if (element === 'newType') {
            const field: any = getFields().find((c: any) => c.name === result) || {}

            handleChangeValueObject(formik, 'type', position, field.type, 'fields')
            handleChangeValueObject(formik, 'required', position, field.required, 'fields')

            handleChangeValueObject(formik, 'name', position, result, 'fields')
        } else if (element === 'type') {
            const fields = [...(formik.values.fields || [])]
            const current = fields[position] as LabeledElementField
            fields[position] = applyTypeSelection(current, String(result))
            formik.setFieldValue('fields', fields)
        } else {
            handleChangeValueObject(formik, element, position, result, 'fields')
        }
    }

    useEffect(() => {
        if (open && comp.componentName === COMPONENT.Form) {
            getDataComponent('', comp.componentName).then(setFormDefaultData)
        }
    }, [open, comp.componentName, getDataComponent])

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 flex flex-col overflow-hidden [--header-height-three:calc(--spacing(75))] sm:max-w-[800px]! lg:max-w-[900px]! max-h-[80vh]">
                    <ScrollArea className="h-full p-4 max-h-[70vh] overflow-auto">
                        <DialogHeader className="mb-4">
                            <DialogTitle>Binding Configuration</DialogTitle>
                            <DialogDescription>
                                Make changes to your Binding Configuration here. Click save when
                                you&apos;re done.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={formik.handleSubmit} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="relative flex rounded-lg border bg-muted p-0.5 string-sm space-x-2">
                                    <Button
                                        type="button"
                                        variant={newBinding ? 'outline' : 'ghost'}
                                        onClick={() => setNewBinding(true)}
                                        className="rounded-lg"
                                        size="sm"
                                    >
                                        New
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setNewBinding(false)}
                                        className="rounded-lg"
                                        size="sm"
                                        variant={!newBinding ? 'outline' : 'ghost'}
                                    >
                                        Existing
                                    </Button>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* {newBinding && (
                                        <div className="flex items-center gap-2">
                                            <Label
                                                htmlFor="isEnum"
                                                className="string-sm cursor-pointer"
                                            >
                                                {t('enumType')}
                                            </Label>
                                            <IGRPSwitch
                                                id="isEnum"
                                                checked={isEnum}
                                                onCheckedChange={(checked) =>
                                                    formik.setFieldValue('isEnum', checked)
                                                }
                                            />
                                        </div>
                                    )} */}
                                    <div className="flex items-center gap-2">
                                        <Label
                                            htmlFor="definitionType"
                                            className="string-sm whitespace-nowrap"
                                        >
                                            {t('definitionType')}
                                        </Label>
                                        <select
                                            id="definitionType"
                                            value={
                                                (formik.values.definitionType as string) ?? 'auto'
                                            }
                                            onChange={(e) =>
                                                formik.setFieldValue(
                                                    'definitionType',
                                                    e.target.value
                                                )
                                            }
                                            className="h-8 rounded-md border bg-background px-2 string-sm"
                                        >
                                            <option value="auto">{t('definitionTypeAuto')}</option>
                                            {/*
                                             * Hidden until the engine ships a working type.liquid
                                             * branching on definitionType. The wiring (R6 inputs +
                                             * persisted shape) is in place — re-enable these
                                             * options when the engine template is fixed.
                                             *
                                             * <option value="zod-object">Zod object</option>
                                             * <option value="json-schema">JSON Schema</option>
                                             */}
                                        </select>
                                    </div>
                                </div>
                            </div>

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

                            {!newBinding && (
                                <SelectInput
                                    label={t('Types')}
                                    id="types"
                                    placeholder={t('types')}
                                    value={selectedType}
                                    onChange={(value) => setSelectedType(value as string)}
                                    options={typesOptions}
                                    isRequired
                                />
                            )}

                            <details className="rounded-md border bg-muted/20 hidden">
                                <summary className="cursor-pointer select-none px-3 py-2 string-sm font-medium">
                                    {t('advancedOptions')}
                                </summary>
                                <div className="space-y-3 px-3 pb-3 pt-1">
                                    <div className="space-y-1">
                                        <Label htmlFor="tags" className="string-sm">
                                            {t('typeTags')}
                                        </Label>
                                        <input
                                            id="tags"
                                            value={(formik.values.tags ?? []).join(', ')}
                                            onChange={(e) =>
                                                formik.setFieldValue(
                                                    'tags',
                                                    e.target.value
                                                        .split(',')
                                                        .map((t) => t.trim())
                                                        .filter(Boolean)
                                                )
                                            }
                                            placeholder={t('typeTagsPlaceholder')}
                                            className="h-9 w-full rounded-md border bg-background px-3 string-sm"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <IGRPSwitch
                                            id="isMainType"
                                            checked={!!formik.values.isMainType}
                                            onCheckedChange={(checked) =>
                                                formik.setFieldValue('isMainType', checked)
                                            }
                                        />
                                        <Label
                                            htmlFor="isMainType"
                                            className="string-sm cursor-pointer"
                                        >
                                            {t('mainType')}
                                        </Label>
                                    </div>

                                    {formik.values.definitionType !== 'auto' && (
                                        <>
                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="customInstanceName"
                                                    className="string-sm"
                                                >
                                                    {t('customInstanceName')}
                                                </Label>
                                                <input
                                                    id="customInstanceName"
                                                    value={formik.values.customInstanceName ?? ''}
                                                    onChange={(e) =>
                                                        formik.setFieldValue(
                                                            'customInstanceName',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={t('customInstanceNamePlaceholder')}
                                                    className="h-9 w-full rounded-md border bg-background px-3 string-sm font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="customInitInstanceName"
                                                    className="string-sm"
                                                >
                                                    {t('customInitInstanceName')}
                                                </Label>
                                                <input
                                                    id="customInitInstanceName"
                                                    value={
                                                        formik.values.customInitInstanceName ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        formik.setFieldValue(
                                                            'customInitInstanceName',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'customInitInstanceNamePlaceholder'
                                                    )}
                                                    className="h-9 w-full rounded-md border bg-background px-3 string-sm font-mono"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </details>

                            {columns.length > 0 && (
                                <div className="border rounded-sm">
                                    <BindingFormList
                                        columns={columns}
                                        formik={formik}
                                        data={formik.values.fields}
                                        changeValue={(element, position, result) => {
                                            handleChange(element, position, result)
                                        }}
                                        name={'fields'}
                                    />
                                </div>
                            )}

                            <DialogFooter className="space-x-2">
                                <DialogClose>Close</DialogClose>
                                <Button type="submit" disabled={formik.isSubmitting}>
                                    {formik.isSubmitting && <Loader2 className="animate-spin" />}
                                    Save changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    )
}
