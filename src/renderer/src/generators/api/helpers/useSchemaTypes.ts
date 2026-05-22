import { useEffect, useState } from 'react'
import type { SchemaTypeItem } from 'src/main/types'
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

        // Both engines expose a "pick from existing DTOs" entry in their
        // SCHEMA_TYPES selector, but they spell it differently:
        //   - Spring: `"Reference other Object"`
        //   - .NET:   `"Reference other schemas"`
        // Rewrite either label to a `dto`-reference entry pointing at the
        // currently-loaded DTO list. Match on the `"Reference other"` prefix
        // so future engines using a similar phrasing are picked up too.
        setSchemaTypes((prevSchemaTypes) =>
            prevSchemaTypes.map((schemaType) =>
                typeof schemaType.value === 'string' &&
                schemaType.value.startsWith('Reference other')
                    ? { ...schemaType, value: 'dto', items: targetDto }
                    : schemaType
            )
        )
    }, [dto, enums, selectors])

    return schemaTypes
}

export default useSchemaTypes
