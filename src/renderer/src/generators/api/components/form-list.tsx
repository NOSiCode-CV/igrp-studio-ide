import { FunctionComponent, useEffect, useState } from 'react'
import { ITabelContainer } from './Interfaces'
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
import { Plus, Trash } from 'lucide-react'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Combobox } from '@igrp/igrp-design-system'
import MultipleSelector from '@renderer/components/multiples-selector'
import { cn } from '@renderer/lib/utils'
import { PopoverComp } from './popover-comp'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'

export const FormList: FunctionComponent<ITabelContainer> = ({
  data,
  errors,
  changeValue,
  addRow,
  removeRow,
  columns,
  name
}) => {
  const [formData, setFormData] = useState(data || {})

  const [dynamicOptions, setDynamicOptions] = useState({})

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

  return (
    <Table>
      <TableHeader className="ps-4">
        <TableRow>
          {columns.map(({ name, width }, index) => (
            <TableHead style={{ width }} key={index}>
              {name}
            </TableHead>
          ))}
          <TableHead style={{ width: '15px' }}></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 &&
          data.map((row: any, index: number) => (
            <TableRow key={index} className={`group/item`}>
              {columns.map(({ name, key, type, options, items }, index2) => {
                const selectValue = ['select'].includes(type)
                  ? (dynamicOptions?.[`${index}-${key}`] || options)?.filter(
                      (d) => row[key] && d.value === row[key]
                    )[0]?.value
                  : ''

                const selectMultiValues = ['multiSelect'].includes(type)
                  ? options?.filter((d) => row[key]?.includes(d.value)).map((d) => d.value)
                  : []

                return (
                  <TableCell key={index2}>
                    {type === 'group' && items && items?.length > 0 ? (
                      <div className="flex gap-2 align-center">
                        {items.map((item, itemIndex) => {
                          const itemValue = row[item.key] || ''
                          const itemOptions = item.type === 'select' ? item.options : null

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
                                  className="w-auto"
                                />
                              )}

                              {item.type === 'checkbox' && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className='flex align-center'>
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

                              {item.type === 'popover' && (
                                <PopoverComp
                                  key={itemIndex}
                                  index={index}
                                  row={row}
                                  changeValue={(element, position, value) =>
                                    changeValue(element, position, value)
                                  }
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
                              'text-sm',
                              errors?.[index]?.[key] ? 'border-red-500' : ''
                            )}
                            type={type}
                            value={row?.[key] || ''}
                            onChange={(ev) => changeValue(key, index, ev.target.value)}
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
                            className="w-full"
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
                            onCheckedChange={(checked) => changeValue(key, index, checked)}
                            checked={row?.[key] || false}
                          />
                        )}
                        {['popover'].includes(type) && (
                          <PopoverComp
                            key={index}
                            index={index}
                            row={row}
                            changeValue={(element, position, value) =>
                              changeValue(element, position, value)
                            }
                          ></PopoverComp>
                        )}
                      </>
                    )}
                  </TableCell>
                )
              })}
              {removeRow && (
                <TableCell>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`border-0 text-red-500 opacity-0 group-hover/item:opacity-100`}
                    onClick={() => removeRow(index)}
                  >
                    <Trash />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
      </TableBody>
      {addRow && (
        <TableFooter>
          <TableRow>
            <TableCell className="text-left">
              <Button variant={'outline'} onClick={addRow} className="text-capitalize">
                <Plus />
                {`New ${name}`}
              </Button>
            </TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  )
}
