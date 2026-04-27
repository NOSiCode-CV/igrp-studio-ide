import {
    IGRPButtonPrimitive,
    IGRPDialogClosePrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPLabelPrimitive,
    type IGRPOptionsProps,
    IGRPScrollAreaPrimitive,
    IGRPSwitch
} from '@igrp/igrp-framework-react-design-system'
import type { FieldValidation } from '@igrp/igrp-studio-nextjs-engine/types'
import { SelectInput, TextInput } from '@renderer/generators/api/components/inputs-form'
import { handleChangeValueObject } from '@renderer/generators/api/helpers'
import useStudio from '@renderer/hooks/use-studio'
import useToast from '@renderer/hooks/useToast'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { capitalize, getId } from '@renderer/utils'
import { useFormik } from 'formik'
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
    type: 'text',
    required: false,
    defaultValue: undefined,
    label: '',
    isList: false,
    isKey: false,
    nullable: false
}

/**
 * Mirrors the engine's FIELD_TYPES constant
 * (node_modules/@igrp/igrp-studio-nextjs-engine/dist/utils/constants.d.ts).
 * Kept inline because the engine does not re-export the constant from
 * its public entry point yet. The order intentionally matches the
 * engine source so a quick visual diff catches drift.
 */
const FIELD_TYPES: SchemaTypeItem[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select' },
    { value: 'select2', label: 'Select (multi)' },
    { value: 'password', label: 'Password' },
    { value: 'color', label: 'Color' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'switch', label: 'Switch' },
    { value: 'radio', label: 'Radio' },
    { value: 'file', label: 'File' },
    { value: 'tel', label: 'Telephone' },
    { value: 'range', label: 'Range' },
    { value: 'time', label: 'Time' },
    { value: 'date', label: 'Date' },
    { value: 'button', label: 'Button' }
]

/**
 * Map values stored under the previous (engine-misaligned) vocabulary
 * back to the engine's FieldTypes. Keeps existing projects loadable
 * after the rename. Returns the original value when no mapping applies
 * so unknown values stay visible (rather than silently swallowed).
 */
const LEGACY_TYPE_MAP: Record<string, { type: string; isList?: boolean }> = {
    string: { type: 'text' },
    boolean: { type: 'checkbox' },
    email: { type: 'text' },
    url: { type: 'text' },
    array: { type: 'text', isList: true },
    integer: { type: 'number' }
    // 'object' is intentionally NOT mapped — extractValidFields uses it
    // as an internal marker for nested struct (FormList) entries, and
    // the engine treats fields[] presence as the actual struct signal.
}

function normalizeFieldType<T extends { type: string; isList?: boolean; fields?: any[] }>(
    field: T
): T {
    const mapped = LEGACY_TYPE_MAP[field.type]
    const nested = field.fields ? field.fields.map(normalizeFieldType) : undefined
    if (!mapped && !nested) return field
    return {
        ...field,
        ...(mapped
            ? { type: mapped.type, isList: mapped.isList ?? field.isList }
            : {}),
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
            case 'range':
                return '0'
            case 'checkbox':
            case 'switch':
                return 'false'
            case 'date':
            case 'time':
                return 'new Date()'
            case 'text':
            case 'password':
            case 'tel':
            case 'color':
            case 'file':
            case 'select':
            case 'select2':
            case 'radio':
            case 'button':
                return ''
            default:
                return ''
        }
    }

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            componentId,
            name: tag,
            path: '',
            fields: [],
            isEnum: false,
            ...compType
        },
        onSubmit: async (values, actions) => {
            actions.setSubmitting(false)

            if (!validate() || !componentId) return

            const updatedComponent = {
                ...values,
                fields: (values.fields as LabeledElementField[]).map((field) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { label, ...rest } = field // Removes the 'label' property
                    return {
                        ...rest,
                        type: rest.type || 'string',
                        defaultValue: getDefaultValue(field),
                        ...(rest.fields && {
                            fields: rest.fields.map((field) => ({
                                ...field,
                                type: field.type || 'string',
                                defaultValue: getDefaultValue(field)
                            }))
                        })
                    }
                })
            }

            createOrUpdateType({
                ...updatedComponent,
                isEnum: !!values.isEnum,
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
        }
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
              { key: 'name', name: t('enumCaseName'), type: 'text' },
              { key: 'defaultValue', name: t('enumCaseValue'), type: 'text' },
              { key: 'label', name: t('label'), type: 'text' }
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
                        },
                        {
                            key: 'isKey',
                            name: 'Key?',
                            type: 'checkbox'
                        }
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
                            name: nestedChild.tag,
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
                    name: child.tag,
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
                fields.push({
                    ...defaultFieldType,
                    name: child.tag,
                    componentId: child.id,
                    label: child.properties.label ?? child.properties.headerTitle ?? child.label,
                    // Include type if available
                    type: child.properties.dataProperties?.type || undefined
                })

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
                ...currentField
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
            <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
                <IGRPDialogContentPrimitive className="p-0 flex flex-col overflow-hidden [--header-height-three:calc(--spacing(75))] sm:max-w-[800px]! lg:max-w-[900px]! max-h-[80vh]">
                    <IGRPScrollAreaPrimitive className="h-full p-4 max-h-[70vh] overflow-auto">
                        <IGRPDialogHeaderPrimitive className="mb-4">
                            <IGRPDialogTitlePrimitive>
                                Binding Configuration
                            </IGRPDialogTitlePrimitive>
                            <IGRPDialogDescriptionPrimitive>
                                Make changes to your Binding Configuration here. Click save when
                                you&apos;re done.
                            </IGRPDialogDescriptionPrimitive>
                        </IGRPDialogHeaderPrimitive>
                        <form onSubmit={formik.handleSubmit} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="relative flex rounded-lg border bg-muted p-0.5 text-sm space-x-2">
                                    <IGRPButtonPrimitive
                                        type="button"
                                        variant={newBinding ? 'outline' : 'ghost'}
                                        onClick={() => setNewBinding(true)}
                                        className="rounded-lg"
                                        size="sm"
                                    >
                                        New
                                    </IGRPButtonPrimitive>
                                    <IGRPButtonPrimitive
                                        type="button"
                                        onClick={() => setNewBinding(false)}
                                        className="rounded-lg"
                                        size="sm"
                                        variant={!newBinding ? 'outline' : 'ghost'}
                                    >
                                        Existing
                                    </IGRPButtonPrimitive>
                                </div>
                                {newBinding && (
                                    <div className="flex items-center gap-2">
                                        <IGRPLabelPrimitive
                                            htmlFor="isEnum"
                                            className="text-sm cursor-pointer"
                                        >
                                            {t('enumType')}
                                        </IGRPLabelPrimitive>
                                        <IGRPSwitch
                                            id="isEnum"
                                            checked={isEnum}
                                            onCheckedChange={(checked) =>
                                                formik.setFieldValue('isEnum', checked)
                                            }
                                        />
                                    </div>
                                )}
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

                            <IGRPDialogFooterPrimitive className="space-x-2">
                                <IGRPDialogClosePrimitive>Close</IGRPDialogClosePrimitive>
                                <IGRPButtonPrimitive type="submit" disabled={formik.isSubmitting}>
                                    {formik.isSubmitting && <Loader2 className="animate-spin" />}
                                    Save changes
                                </IGRPButtonPrimitive>
                            </IGRPDialogFooterPrimitive>
                        </form>
                    </IGRPScrollAreaPrimitive>
                </IGRPDialogContentPrimitive>
            </IGRPDialogPrimitive>
        </>
    )
}
