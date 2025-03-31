import { useEffect, useState } from 'react';
import { SchemaTypeItem } from 'src/main/types';

interface Selector {
    SCHEMA_TYPES?: string[];
    [key: string]: any;
}

interface DTOItem {
    content?: {
        name: string;
        module?: string;
    };
    name: string;
}

function useSchemaTypes(selectors: Selector[], dto: DTOItem[]) {
    const [schemaTypes, setSchemaTypes] = useState<SchemaTypeItem[]>([]);

    useEffect(() => {
        const formatMethods = (types: string[]): SchemaTypeItem[] => {
            return types.map(type => ({
                value: type,
                label: type,
            }));
        };

        const types = formatMethods(
            (
                selectors.find((selector) => 'SCHEMA_TYPES' in selector) as
                | { SCHEMA_TYPES: string[] }
                | undefined
            )?.SCHEMA_TYPES || []
        );

        setSchemaTypes(types);

        // Map DTO into the expected format
        const targetDto = dto.map((d) => ({
            value: d.content?.name || d.name,
            label: d.content?.name || d.name,
            module: d.content?.module,
        }));

        setSchemaTypes((prevSchemaTypes) =>
            prevSchemaTypes.map((schemaType) =>
                schemaType.value === 'Reference other Object'
                    ? { ...schemaType, value: 'dto', items: targetDto }
                    : schemaType
            )
        );
    }, [dto, selectors]);

    return schemaTypes;
}

export default useSchemaTypes