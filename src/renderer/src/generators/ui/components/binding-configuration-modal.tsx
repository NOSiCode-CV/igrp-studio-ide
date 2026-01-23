import { StructuredComponent } from '@renderer/lib/dnd/types'
import { useEffect, useState } from 'react'
import { FormList } from '@renderer/components/form-list'
import { handleChangeValueObject } from '@renderer/generators/api/helpers'
import { useFormik } from 'formik'
import { useTranslation } from 'react-i18next'
import {
  IGRPButtonPrimitive,
  IGRPDialogClosePrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPOptionsProps,
  IGRPScrollAreaPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { SelectInput, TextInput } from '@renderer/generators/api/components/inputs-form'
import { SchemaTypeItem } from 'src/main/types'
import { useDroppedComponents } from '../dnd/DroppedComponentsContext'
import { Loader2 } from 'lucide-react'
import useCustomCode from '../hooks/useCustomCode'
import useToast from '@renderer/hooks/useToast'
import { capitalize, getId } from '@renderer/utils'
import { COMPONENT } from '../ComponentTypes'
import useStudio from '@renderer/hooks/use-studio'
import { FieldValidation } from '@igrp/igrp-studio-nextjs-engine/types'
import { JSX } from 'react/jsx-runtime'

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
}

const defaultFieldType: LabeledElementField = {
  componentId: '',
  name: '',
  type: 'string',
  required: false,
  defaultValue: undefined,
  label: '',
  isList: false
}

const FIELD_TYPES: SchemaTypeItem[] = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'array', label: 'Array/Options' },
  { value: 'email', label: 'Email' },
  { value: 'password', label: 'Password' },
  { value: 'tel', label: 'Telephone' },
  { value: 'url', label: 'URL' },
  { value: 'color', label: 'Color' },
  { value: 'file', label: 'File' },
  { value: 'object', label: 'Object' }
]

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

  const [fieldsTypeOptions, setFieldsTypeOptions] = useState<IGRPOptionsProps[]>([])
  const [selectedType, setSelectedType] = useState<string>('')
  const [typeFilePath, setTypeFilePath] = useState<string>('')

  const [componentMap, setComponentMap] = useState<Map<string, StructuredComponent>>(new Map())

  const { createOrUpdateType, getTypeByComponentId, handleUpdateChildComponent, components } =
    useDroppedComponents()

  const { tag, id: componentId } = comp

  const compType = getTypeByComponentId(componentId)

  const [newBinding, setNewBinding] = useState<boolean>(
    compType?.path === '' || compType?.path === undefined
  )

  const [formDefaultData, setFormDefaultData] = useState<any>(null)

  const columns = [
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
          key: 'isList',
          name: 'IsList?',
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

  const validate = (): boolean => {
    const fieldNames = formik.values.fields.map((f) => f.name)
    if (new Set(fieldNames).size !== fieldNames.length) {
      showErrorToast('Field names must be unique')
      return false
    }
    return true
  }

  const getDefaultValue = (field: LabeledElementField): string => {
    if ((field.defaultValue === '' || field.defaultValue === undefined) && field.required) {
      if (field.type === 'string') {
        return ''
      }
      if (field.type === 'number') {
        return '0'
      }
      if (field.type === 'boolean') {
        return 'false'
      }
      if (field.type === 'date') {
        return 'new Date()'
      }
      if (field.type === 'array') {
        return '[]'
      }
    }
    return field.defaultValue || ''
  }

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      componentId,
      name: tag,
      path: '',
      fields: [],
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
              (data && 'defaultValues' in data && data.defaultValues?.properties?.type?.default) ??
              'any',
            name: `${values.name ??
              (data && 'defaultValues' in data && data.defaultValues?.properties?.name?.default) ??
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

  const getFields = (): LabeledElementField[] => {
    const type = types.find((c: LabeledElementField) => c.name === selectedType) || {}

    setTypeFilePath(type.path || '')

    return type && type?.fields && type?.fields ? type.fields : []
  }

  useEffect(() => {
    const type = getFields()
    const fieldsTypes = type.map((field: LabeledElementField) => ({
      label: `${field.name} (${field.type})`,
      value: field.name
    }))

    setFieldsTypeOptions(fieldsTypes)
  }, [selectedType])

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

  useEffect(() => {
    // Auto-add fields from children if not already in the list
    if (comp.children?.length) {
      const currentFields: any[] = formik.values.fields || []

      const { fields, componentMap: updatedMap } = extractValidFields(comp.children)

      const updatedFields = updateFieldsWithSubFields(fields, currentFields)

      formik.setFieldValue('fields', [...updatedFields])

      setComponentMap(updatedMap)
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
        <IGRPDialogContentPrimitive className="p-0 flex flex-col overflow-hidden [--header-height-three:calc(--spacing(75))] sm:max-w-[800px] lg:max-w-[900px] max-w-7xl max-h-[80vh]">
          <IGRPScrollAreaPrimitive className="h-full p-4 max-h-[70vh] overflow-auto">
            <IGRPDialogHeaderPrimitive className="mb-4">
              <IGRPDialogTitlePrimitive>Binding Configuration</IGRPDialogTitlePrimitive>
              <IGRPDialogDescriptionPrimitive>
                Make changes to your Binding Configuration here. Click save when you&apos;re done.
              </IGRPDialogDescriptionPrimitive>
            </IGRPDialogHeaderPrimitive>
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div className="flex">
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

              <div className="border rounded-sm">
                <FormList
                  columns={columns}
                  formik={formik}
                  data={formik.values.fields}
                  changeValue={(element, position, result) => {
                    handleChange(element, position, result)
                  }}
                  name={'fields'}
                />
              </div>

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
