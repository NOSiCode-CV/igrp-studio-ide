import { FunctionComponent, useEffect, useState } from 'react'
import { ITabelContainer } from '../types/Interfaces'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { GripVertical, Plus, Trash } from 'lucide-react'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Combobox } from '@igrp/igrp-design-system'
import MultipleSelector from '@renderer/components/multiples-selector'
import { cn } from '@renderer/lib/utils'
import { PopoverController } from './controller/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { PopoverModel } from './model/popover'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { PopoverDto } from './dto/popover-dto'

export const FormList: FunctionComponent<ITabelContainer> = ({
  data,
  formik,
  errors,
  changeValue,
  addRow,
  removeRow,
  columns,
  name,
  btnLabels
}) => {
  const [formData, setFormData] = useState(data || [])
  const [dynamicOptions, setDynamicOptions] = useState({})

  useEffect(() => {
    setFormData(data)
  }, [data])

  const updateDependentFields = (key, index, selectedValue) => {
    // Procura por colunas que dependem da chave atual
    const dependentColumn = columns.find((col) => col.dependsOn === key)

    // Se houver uma coluna dependente e ela tiver uma função para obter opções
    if (dependentColumn && dependentColumn.getOptions) {
      // Obtém as opções atualizadas com base no valor selecionado
      const updatedOptions = dependentColumn.getOptions(selectedValue)

      // Atualiza as opções dinâmicas, se houve mudança
      if (
        JSON.stringify(dynamicOptions[`${index}-${dependentColumn.key}`]) !==
        JSON.stringify(updatedOptions)
      ) {
        setDynamicOptions((prevOptions) => ({
          ...prevOptions,
          [`${index}-${dependentColumn.key}`]: updatedOptions
        }))
      }

      // Atualiza o valor do campo dependente
      const newValue = updatedOptions.length ? updatedOptions[0].value : ''

      // Evitar atualização desnecessária
      if (formData[index][dependentColumn.key] !== newValue) {
        const updatedRow = {
          ...formData[index],
          [dependentColumn.key]: newValue
        }

        // Atualiza o estado do formData
        const newFormData = [...formData]
        newFormData[index] = updatedRow
        setFormData(newFormData)
      }
    }
  }

  // Executa a atualização dos campos dependentes assim que os dados forem carregados
  useEffect(() => {
    if (formData && formData.length > 0)
      formData.forEach((row, index) => {
        // Verifica se a linha tem algum campo dependente
        columns.forEach((col) => {
          if (col.dependsOn && row[col.dependsOn]) {
            // Atualiza os campos dependentes para cada chave
            updateDependentFields(col.dependsOn, index, row[col.dependsOn])
          }
        })
      })
  }, [formData, columns])

  // Função para atualizar as opções de um campo baseado em outro
  const handleDependentChange = (key, index, selectedValue) => {
    changeValue(key, index, selectedValue)

    // Verificar se o campo atual tem uma dependência para atualizar outro campo
    const dependentColumn = columns.find((col) => col.dependsOn === key)
    if (dependentColumn && dependentColumn.getOptions) {
      const updatedOptions = dependentColumn.getOptions(selectedValue)

      setDynamicOptions((prevOptions) => ({
        ...prevOptions,
        [`${index}-${dependentColumn.key}`]: updatedOptions
      }))
    }
  }

  const onDragEnd = (result: any) => {
    const { source, destination } = result

    // Check if destination exists
    if (!destination) return

    // If the item is dropped in the same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    // Create a copy of the current data
    const updatedData = Array.from(formData)

    // Remove the item from its source position
    const [movedItem] = updatedData.splice(source.index, 1)

    // Insert the item at the destination position
    updatedData.splice(destination.index, 0, movedItem)

    // Update the state
    setFormData(updatedData)
    formik.setFieldValue(name, updatedData)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={`${name}`}>
        {(provided: any) => (
          <Table ref={provided.innerRef} {...provided.droppableProps}>
            <TableHeader>
              <TableRow>
                {columns.map(({ name, width }, index) => (
                  <TableHead style={{ width }} key={index}>
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
                  </TableHead>
                ))}
                {removeRow && <TableHead className="w-[10px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData &&
                formData.map((row: any, index: number) => {
                  const rowId = row.id || `row-${name}-${index}`

                  return (
                    <Draggable key={rowId + '-col'} draggableId={rowId} index={index}>
                      {(provided: any) => (
                        <TableRow
                          className={`group/item`}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          {columns.map(({ name, key, type, options, items }, index2) => {
                            const selectValue = ['select'].includes(type)
                              ? (dynamicOptions?.[`${index}-${key}`] || options)?.filter(
                                  (d) => row[key] && d.value === row[key]
                                )[0]?.value
                              : ''

                            const selectMultiValues = ['multiSelect'].includes(type)
                              ? options
                                  ?.filter((d) => row[key]?.includes(d.value))
                                  .map((d) => d.value)
                              : []

                            return (
                              <TableCell key={index2} className='!py-1'>
                                <div className="flex">
                                  {index2 === 0 && (
                                    <button
                                      className="opacity-0 group-hover/item:opacity-100 cursor-move me-1 p-0"
                                      {...provided.dragHandleProps}
                                    >
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                  )}

                                  {type === 'group' && items && items?.length > 0 ? (
                                    <div className="flex gap-2 align-center">
                                      {items.map((item, itemIndex) => {
                                        const itemValue = row[item.key] || ''
                                        const itemOptions = item.options || []

                                        return (
                                          <div key={itemIndex} className="flex items-center">
                                            {item.type === 'select' && (
                                              <Combobox
                                                name={item.name}
                                                placeholder={`Select ${item.name}`}
                                                options={itemOptions || []}
                                                value={itemValue}
                                                onChange={(selectedOption) =>
                                                  changeValue(item.key, index, selectedOption)
                                                }
                                                className="w-auto h-8"
                                              />
                                            )}

                                            {item.type === 'checkbox' && (
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger className="flex align-center">
                                                    <Checkbox
                                                      id={`${item.key}_${index2}`}
                                                      onCheckedChange={(checked) =>
                                                        changeValue(item.key, index, checked)
                                                      }
                                                      checked={row?.[item.key] || false}
                                                    />
                                                  </TooltipTrigger>
                                                  <TooltipContent>{item.name}</TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            )}

                                            {item.type === 'popoverController' && (
                                              <PopoverController
                                                key={itemIndex}
                                                index={index}
                                                row={row}
                                                changeValue={(element, position, value) =>
                                                  changeValue(element, position, value)
                                                }
                                              />
                                            )}
                                            {item.type === 'popoverModel' && (
                                              <PopoverModel
                                                key={itemIndex}
                                                index={index}
                                                row={row}
                                                changeValue={(element, position, value) =>
                                                  changeValue(element, position, value)
                                                }
                                              />
                                            )}
                                            {item.type === 'popoverDto' && (
                                              <PopoverDto
                                                key={itemIndex}
                                                index={index}
                                                row={row}
                                                changeValue={(element, position, value) =>
                                                  changeValue(element, position, value)
                                                }
                                                collectionTypes={itemOptions || []}
                                              />
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <>
                                      {' '}
                                      {['text', 'number'].includes(type) && (
                                        <Input
                                          className={cn(
                                            'h-8 text-sm',
                                            errors?.[index]?.[key] ? 'border-red-500' : ''
                                          )}
                                          type={type}
                                          value={row?.[key] || ''}
                                          onChange={(ev) =>
                                            changeValue(key, index, ev.target.value)
                                          }
                                        />
                                      )}
                                      {['select'].includes(type) && (
                                        <Combobox
                                          key={`${index}-${index2}`}
                                          name={name}
                                          placeholder={`Select ${name}`}
                                          options={dynamicOptions[`${index}-${key}`] || options}
                                          value={selectValue}
                                          onChange={(selectedOption) => {
                                            handleDependentChange(key, index, selectedOption)
                                          }}
                                          className="w-full h-8"
                                        />
                                      )}
                                      {['multiSelect'].includes(type) && (
                                        <MultipleSelector
                                          placeholder={`Select ${name}`}
                                          options={dynamicOptions[`${index}-${key}`] || options}
                                          value={selectMultiValues}
                                          onChange={(selectedOption) => {
                                            changeValue(key, index, selectedOption)
                                          }}
                                        />
                                      )}
                                      {['checkbox'].includes(type) && (
                                        <Checkbox
                                          id={`${key}_${index2}`}
                                          onCheckedChange={(checked) =>
                                            changeValue(key, index, checked)
                                          }
                                          checked={row?.[key] || false}
                                        />
                                      )}
                                      {['popover'].includes(type) && (
                                        <PopoverController
                                          key={index}
                                          index={index}
                                          row={row}
                                          changeValue={(element, position, value) =>
                                            changeValue(element, position, value)
                                          }
                                        />
                                      )}
                                      {['popoverModel'].includes(type) && (
                                        <PopoverModel
                                          key={index}
                                          index={index}
                                          row={row}
                                          changeValue={(element, position, value) =>
                                            changeValue(element, position, value)
                                          }
                                        />
                                      )}
                                      {['popoverDto'].includes(type) && (
                                        <PopoverDto
                                          key={index}
                                          index={index}
                                          row={row}
                                          changeValue={(element, position, value) =>
                                            changeValue(element, position, value)
                                          }
                                          collectionTypes={options}
                                        />
                                      )}
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            )
                          })}
                          {removeRow && (
                            <TableCell className='!py-1'>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`text-red-500 opacity-0 group-hover/item:opacity-100`}
                                onClick={() => removeRow(index)}
                              >
                                <Trash />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      )}
                    </Draggable>
                  )
                })}
            </TableBody>
            {addRow && (
              <TableFooter>
                <TableRow>
                  <TableCell className="text-left !py-1">
                    <Button variant={'outline'} onClick={addRow} className="text-capitalize">
                      <Plus />
                      {`New ${btnLabels}`}
                    </Button>
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
            {provided.placeholder}
          </Table>
        )}
      </Droppable>
    </DragDropContext>
  )
}
