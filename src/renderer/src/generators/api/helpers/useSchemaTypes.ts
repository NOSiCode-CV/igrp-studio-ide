import { useEffect, useState } from 'react'
import { SchemaTypeItem } from 'src/main/types'
import { formatMethods, getMapOptions } from '.'

interface Selector {
  SCHEMA_TYPES?: string[]
  [key: string]: any
}

interface DTOItem {
  content?: {
    name: string
    module?: string
  }
  name: string
}

function useSchemaTypes(selectors: Selector[], dto: DTOItem[], enums: DTOItem[]) {
  const [schemaTypes, setSchemaTypes] = useState<SchemaTypeItem[]>([])

  useEffect(() => {
    // Obter os tipos básicos do seletor
    const baseTypes = formatMethods(
      (
        selectors.find((selector) => 'SCHEMA_TYPES' in selector) as
          | { SCHEMA_TYPES: string[] }
          | undefined
      )?.SCHEMA_TYPES || []
    )

    // Mapear DTO para o formato esperado
    const targetDto = getMapOptions(dto)
    // Mapear Enums para o formato esperado
    const targetEnums = getMapOptions(enums)

    // Criar a lista completa de tipos de schema
    const completeSchemaTypes = [
      ...baseTypes,
      {
        value: 'enum',
        label: 'Enum',
        items: targetEnums
      }
    ]

    // Atualizar o estado com os tipos completos
    setSchemaTypes(completeSchemaTypes)

    // Manter a transformação para "Reference other Object" se necessário
    setSchemaTypes((prevSchemaTypes) =>
      prevSchemaTypes.map((schemaType) =>
        schemaType.value === 'Reference other Object'
          ? { ...schemaType, value: 'dto', items: targetDto }
          : schemaType
      )
    )
  }, [dto, enums, selectors])

  return schemaTypes
}

export default useSchemaTypes
