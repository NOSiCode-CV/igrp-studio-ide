import React, { FunctionComponent, useEffect, useState } from 'react'
import { ITabelContainer } from '../generators/api/types/Interfaces'
// Table components removed - using div elements instead
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system'
import { GripVertical, Plus, Trash } from 'lucide-react'
import { IGRPCheckbox } from '@igrp/igrp-framework-react-design-system'
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system'
import MultipleSelector from '@renderer/components/multiples-selector'
import { cn } from '@renderer/lib/utils'
import {
  IGRPTooltipPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { DragProvider } from '@renderer/lib/dnd/drag-drop-context'
import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import { PopoverController } from '../generators/api/pages/controller/popover'
import { PopoverModel } from '../generators/api/pages/model/popover'
import { PopoverDto } from '../generators/api/pages/dto/popover-dto'
import { TypeSelectorDropdown } from '@renderer/components/type-selector-dropdown'
import { RelationPopover } from '../generators/api/pages/model/relation-popover'
import { FormValidationPopover } from '../generators/ui/components/form-validation-popover'

// Component registry for popover types
const POPOVER_COMPONENTS = {
  popoverController: PopoverController,
  popoverModel: PopoverModel,
  popoverDto: PopoverDto,
  popoverFormValidation: FormValidationPopover,
  popoverRelation: RelationPopover
} as const

interface GroupField {
  groupName: string
  groupIndex: number
}

interface PopoverProps {
  row: any
  index: number
  onChangeValue: any
  itemOptions: any
  group?: GroupField
}

interface ChangeFnProps {
  key: string
  index: number
  value: any
  group?: GroupField
}

// Props mapping for each popover type
const POPOVER_PROPS_MAPPING = {
  popoverController: (props: PopoverProps) => {
    const { row, index, onChangeValue, itemOptions, group } = props
    return {
      index,
      row,
      changeValue: (element: string, value: any): void =>
        onChangeValue({ key: element, index, value, group }),
      options: itemOptions || []
    }
  },
  popoverModel: (props: PopoverProps) => {
    const { row, index, onChangeValue, itemOptions, group } = props
    return {
      index,
      row,
      changeValue: (element: string, position: number, value: any): void =>
        onChangeValue({ key: element, index: position, value, group }),
      options: itemOptions || []
    }
  },
  popoverDto: (props: PopoverProps) => {
    const { row, index, onChangeValue, itemOptions, group } = props
    return {
      index,
      row,
      changeValue: (element: string, position: number, value: any): void =>
        onChangeValue({ key: element, index: position, value, group }),
      collectionTypes: itemOptions || []
    }
  },
  popoverFormValidation: (props: PopoverProps) => {
    const { row, index, onChangeValue, group } = props
    return {
      index,
      field: row,
      fieldType: row.type || 'string',
      changeValue: (element: string, position: number, value: any): void =>
        onChangeValue({ key: element, index: position, value, group })
    }
  },
  popoverRelation: (props: PopoverProps) => {
    const { row, index, onChangeValue, itemOptions, group } = props
    return {
      field: row,
      changeValue: (element: string, value: any): void => {
        onChangeValue({ key: element, index, value, group })
      },
      options: itemOptions || []
    }
  }
} as const

export const FormList: FunctionComponent<ITabelContainer> = ({
  data,
  formik,
  errors,
  touched,
  changeValue,
  addRow,
  removeRow,
  columns,
  name,
  btnLabels
}: ITabelContainer): React.ReactNode => {
  const [formData, setFormData] = useState(data || [])
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, any[]>>({})

  // Atualiza o formData quando os dados mudam
  useEffect((): void => {
    setFormData(data)
  }, [data])

  // Atualiza campos dependentes
  const updateDependentFields = (key: string, index: number, selectedValue: any): void => {
    const dependentColumn = columns.find((col) => col.dependsOn === key)
    if (dependentColumn && dependentColumn.getOptions) {
      const updatedOptions = dependentColumn.getOptions(selectedValue)
      if (
        JSON.stringify(dynamicOptions[`${index}-${dependentColumn.key}`]) !==
        JSON.stringify(updatedOptions)
      ) {
        setDynamicOptions((prevOptions) => ({
          ...prevOptions,
          [`${index}-${dependentColumn.key}`]: updatedOptions
        }))
      }
      const newValue = updatedOptions.length ? updatedOptions[0].value : ''
      if (formData[index][dependentColumn.key] !== newValue) {
        const updatedRow = {
          ...formData[index],
          [dependentColumn.key]: newValue
        }
        const newFormData = [...formData]
        newFormData[index] = updatedRow
        setFormData(newFormData)
      }
    }
  }

  // Atualiza campos dependentes ao carregar os dados
  useEffect((): void => {
    if (formData && formData.length > 0)
      formData.forEach((row, index) => {
        columns.forEach((col) => {
          if (col.dependsOn && row[col.dependsOn]) {
            updateDependentFields(col.dependsOn, index, row[col.dependsOn])
          }
        })
      })
  }, [formData, columns])

  // Função para atualizar as opções de um campo baseado em outro
  const handleDependentChange = (key: string, index: number, selectedValue: any): void => {
    changeValue(key, index, selectedValue)
    const dependentColumn = columns.find((col) => col.dependsOn === key)
    if (dependentColumn && dependentColumn.getOptions) {
      const updatedOptions = dependentColumn.getOptions(selectedValue)
      setDynamicOptions((prevOptions) => ({
        ...prevOptions,
        [`${index}-${dependentColumn.key}`]: updatedOptions
      }))
    }
  }

  // Função de arrastar e soltar
  const onDragEnd = (result: any): void => {
    const { source, destination } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }
    const updatedData = Array.from(formData)
    const [movedItem] = updatedData.splice(source.index, 1)
    updatedData.splice(destination.index, 0, movedItem)
    setFormData(updatedData)
    formik.setFieldValue(name, updatedData)
  }

  /********************** errors ******************************/
  const FormErrors = (): React.ReactNode =>
    Array.isArray(errors) ? (
      <div className="px-3">
        {errors.map((err, idx) => {
          if (typeof err === 'string')
            return (
              <p key={idx} className="text-xs text-destructive italic">
                {err}
              </p>
            )
          if (typeof err === 'object' && err !== null)
            return Object.entries(err).map(([k, msg], subIdx) =>
              msg ? (
                <p key={`${idx}-${subIdx}`} className="text-xs text-destructive italic">
                  <strong>{k.toUpperCase()}: </strong>
                  {msg as string}
                </p>
              ) : null
            )
          return null
        })}
      </div>
    ) : null

  // Renderização do cabeçalho da tabela
  const renderTableHeader = (): React.ReactNode => {
    return (
      <div
        className="flex flex-1  gap-4 p-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground"
        /*  style={{
                    gridTemplateColumns:
                        columns.map((col) => col.width || '1fr').join(' ') +
                        (removeRow ? ' 100px' : ''),
                }} */
      >
        {columns.map(({ name, width, type }, index) => (
          <div
            style={{ width }}
            key={index}
            className={cn(
              'flex items-center',
              type === 'text' ? 'min-w-40' : '',
              type === 'checkbox' ? 'justify-center' : '',
              type === 'label' ? 'min-w-30' : ''
            )}
          >
            {index === 0 ? (
              <span className="flex items-center">
                <button className="me-1" disabled>
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
                {name}
              </span>
            ) : (
              name
            )}
          </div>
        ))}
        {removeRow && (
          <div className="flex justify-end items-center ml-auto">
            {addRow && (
              <IGRPTooltipProviderPrimitive>
                <IGRPTooltipPrimitive>
                  <IGRPTooltipTriggerPrimitive asChild>
                    <IGRPButtonPrimitive
                      onClick={(e) => {
                        e.preventDefault()
                        addRow()
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-primary h-6 w-6"
                    >
                      <Plus size={14} />
                      <span className="sr-only">{`New ${btnLabels}`}</span>
                    </IGRPButtonPrimitive>
                  </IGRPTooltipTriggerPrimitive>
                  <IGRPTooltipContentPrimitive>{`New ${btnLabels}`}</IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>
              </IGRPTooltipProviderPrimitive>
            )}
          </div>
        )}
      </div>
    )
  }

  // Optimized grouped items renderer using component registry
  const renderGroupedItems = ({
    items,
    row,
    index,
    index2,
    group,
    onChangeValue
  }: any): React.ReactNode => {
    return (
      <div className="flex flex-1 gap-2 align-center">
        {items.map((item: any, itemIndex: number) => {
          const itemValue = row?.[item.key] || ''
          const itemOptions = item.options || []

          if (!row) return null

          // Handle select component
          if (item.type === 'select') {
            return (
              <React.Fragment key={itemIndex}>
                <IGRPCombobox
                  placeholder={`Select ${item.name}`}
                  options={itemOptions || []}
                  value={itemValue}
                  onChange={(selectedOption) =>
                    onChangeValue({
                      key: item.key,
                      index: index,
                      value: selectedOption,
                      group: group
                    })
                  }
                  className="w-auto h-8"
                />
              </React.Fragment>
            )
          }

          // Handle checkbox component
          if (item.type === 'checkbox') {
            return (
              <React.Fragment key={itemIndex}>
                <IGRPTooltipPrimitive>
                  <IGRPTooltipTriggerPrimitive asChild>
                    <div className="flex align-center mt-2.5">
                      <IGRPCheckbox
                        name={`${item.key}_${index2}`}
                        id={`${item.key}_${index2}`}
                        onCheckedChange={(checked) => {
                          onChangeValue({
                            key: item.key,
                            index: index,
                            value: checked,
                            group: group
                          })
                        }}
                        checked={row?.[item.key] || false}
                      />
                    </div>
                  </IGRPTooltipTriggerPrimitive>
                  <IGRPTooltipContentPrimitive>{item.name}</IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>
              </React.Fragment>
            )
          }

          // Handle popover components using registry
          if (POPOVER_COMPONENTS[item.type as keyof typeof POPOVER_COMPONENTS]) {
            const PopoverComponent =
              POPOVER_COMPONENTS[item.type as keyof typeof POPOVER_COMPONENTS]
            const propsMapping =
              POPOVER_PROPS_MAPPING[item.type as keyof typeof POPOVER_PROPS_MAPPING]

            // Special case for popoverRelation
            if (item.type === 'popoverRelation' && row['type'] !== 'relation') {
              return null
            }
            const props = propsMapping({
              row,
              index,
              onChangeValue,
              itemOptions,
              group
            })

            return (
              <React.Fragment key={itemIndex}>
                <PopoverComponent {...(props as any)} />
              </React.Fragment>
            )
          }

          return null
        })}
      </div>
    )
  }

  // Optimized field renderer using component registry
  const renderField = (
    row: any,
    index: number,
    key: string,
    type: string,
    options: any,
    selectValue: any,
    selectMultiValues: any,
    readonly: boolean,
    onChangeValue: (props: ChangeFnProps) => void,
    group?: GroupField
  ): React.ReactNode => {
    // Handle input types (text, number)
    if (type === 'text' || type === 'number') {
      return (
        <IGRPInputPrimitive
          className={cn(
            'h-8 text-sm',
            errors?.[index]?.[key] && touched?.[index]?.[key] ? 'border-destructive' : ''
          )}
          type={type}
          value={row?.[key] || ''}
          onChange={(ev) =>
            onChangeValue({
              key,
              index,
              value: ev.target.value,
              group
            })
          }
          readOnly={readonly}
        />
      )
    }

    // Handle label type
    if (type === 'label') {
      return (
        <IGRPLabelPrimitive htmlFor={`${key}_${index}`} className="w-30 truncate">
          {row?.[key] || ''}
        </IGRPLabelPrimitive>
      )
    }

    // Handle select type
    if (type === 'select') {
      return (
        <IGRPCombobox
          key={`${index}-${key}`}
          placeholder={`Select ${key}`}
          options={dynamicOptions[`${index}-${key}`] || options}
          value={selectValue}
          onChange={(selectedOption) => handleDependentChange(key, index, selectedOption)}
          className="w-full h-8"
        />
      )
    }

    // Handle multiSelect type
    if (type === 'multiSelect') {
      return (
        <MultipleSelector
          placeholder={`Select ${name}`}
          options={dynamicOptions[`${index}-${key}`] || options}
          value={selectMultiValues}
          onChange={(selectedOption) => {
            onChangeValue({
              key,
              index,
              value: selectedOption,
              group
            })
          }}
        />
      )
    }

    // Handle checkbox type
    if (type === 'checkbox') {
      return (
        <div className="flex justify-center w-full">
          <IGRPCheckbox
            name={`${key}_${index}`}
            id={`${key}_${index}`}
            onCheckedChange={(checked) =>
              onChangeValue({
                key,
                index,
                value: checked,
                group
              })
            }
            checked={row?.[key] || false}
          />
        </div>
      )
    }

    // Handle popover types using registry
    if (type in POPOVER_COMPONENTS) {
      const PopoverComponent = POPOVER_COMPONENTS[type as keyof typeof POPOVER_COMPONENTS]
      const propsMapping = POPOVER_PROPS_MAPPING[type as keyof typeof POPOVER_PROPS_MAPPING]

      // Special case for popoverRelation
      if (type === 'popoverRelation' && row['type'] !== 'relation') {
        return null
      }

      const props = propsMapping({
        row,
        index,
        onChangeValue,
        itemOptions: options,
        group
      })

      return <PopoverComponent {...(props as any)} />
    }

    // Handle typeSelectorDropdown
    if (type === 'typeSelectorDropdown') {
      return (
        <TypeSelectorDropdown
          key={`${index}-${key}`}
          type={row?.[key] || ''}
          onTypeChange={(dataType: any) =>
            onChangeValue({
              key,
              index,
              value: dataType,
              group
            })
          }
          schemaTypes={options || []}
          variant={'outline'}
        />
      )
    }

    // Default case - return null or a fallback component
    return null
  }

  // Renderização das linhas da tabela
  const renderTableRow = (
    rowId: string,
    index: number,
    row: any,
    _className: string,
    onChangeValue: (props: ChangeFnProps) => void,
    group?: GroupField
  ): React.ReactNode => {
    return (
      <Draggable
        key={rowId + '-col'}
        item={{ id: rowId, componentName: 'row', children: [] } as any}
        index={index}
        mode="MOVE"
        dropTargetId={name}
        dropZone={false}
        className="p-0"
      >
        <div
          className={`group/item w-full cursor-move hover:bg-muted/20 border-b border-border/50 last:border-b-0 grid gap-4 px-3 py-1`}
          style={{
            gridTemplateColumns:
              columns.map((col) => col.width || '1fr').join(' ') + (removeRow ? ' 100px' : '')
          }}
        >
          {columns.map(({ key, type, options, items, readonly }, index2) => {
            const selectValue = ['select'].includes(type)
              ? (dynamicOptions?.[`${index}-${key}`] || options)?.filter(
                  (d: any) => row[key] && d.value === row[key]
                )[0]?.value
              : ''
            const selectMultiValues = ['multiSelect'].includes(type)
              ? options?.filter((d: any) => row[key]?.includes(d.value)).map((d: any) => d.value)
              : []
            return (
              <React.Fragment key={index2}>
                <div
                  className={cn(
                    'flex items-center',
                    type === 'text' ? 'min-w-40' : '',
                    type === 'checkbox' ? 'justify-center' : ''
                  )}
                >
                  {/*  {index2 === 0 && (
                                            <button
                                                className={cn(
                                                    'opacity-0 group-hover/item:opacity-100 cursor-move me-1 p-0',
                                                    className
                                                )}
                                            >
                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                        )} */}
                  {type === 'group' && items && items?.length > 0
                    ? renderGroupedItems({
                        items,
                        row,
                        index,
                        index2,
                        group,
                        onChangeValue
                      })
                    : renderField(
                        row,
                        index,
                        key,
                        type,
                        options,
                        selectValue,
                        selectMultiValues,
                        readonly || false,
                        onChangeValue,
                        group
                      )}
                </div>
              </React.Fragment>
            )
          })}
          {removeRow && (
            <React.Fragment key={index}>
              <IGRPButtonPrimitive
                variant="ghost"
                size="icon"
                className={`text-destructive opacity-0 group-hover/item:opacity-100`}
                onClick={(e) => {
                  e.preventDefault()
                  removeRow(index)
                }}
              >
                <Trash />
              </IGRPButtonPrimitive>
            </React.Fragment>
          )}
        </div>
      </Draggable>
    )
  }

  const onChangeValue = (props: ChangeFnProps): void => {
    const { key, index, value, group } = props
    //Chick if row is a subitems
    //TODO: Refatorar para usar o findFieldPath para pegar o path do campo

    if (group) {
      formik.setFieldValue(
        `${name}[${group.groupIndex}].${group.groupName}[${index}].${key}`,
        value
      )
    } else changeValue(key, index, value)
  }

  // Renderização do componente completo
  return (
    <IGRPTooltipProviderPrimitive>
      <FormErrors />
      <DragProvider>
        <Droppable
          component={
            {
              id: name,
              componentName: name,
              children: formData
            } as any
          }
          onDrop={onDragEnd}
          className="w-full"
        >
          <div className="w-full border rounded-lg overflow-hidden">
            {renderTableHeader()}
            <div className="divide-y">
              {formData.map((row: any, index: number) => {
                const rowId = row.id || `row-${name}-${index}`
                const isDataArray = row.fields && row.fields.length > 0

                return (
                  <React.Fragment key={rowId}>
                    {renderTableRow(rowId, index, row, '', (props: ChangeFnProps): void => {
                      onChangeValue(props)
                    })}
                    {isDataArray &&
                      row?.fields.map((col: any, ii: number) =>
                        renderTableRow(
                          `col-${index}-${ii}`,
                          ii,
                          col,
                          'mr-6',
                          (props: ChangeFnProps): void => {
                            onChangeValue({
                              ...props,
                              group: {
                                groupName: 'fields',
                                groupIndex: index
                              }
                            })
                          },
                          {
                            groupName: 'fields',
                            groupIndex: index
                          }
                        )
                      )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </Droppable>
      </DragProvider>
    </IGRPTooltipProviderPrimitive>
  )
}
