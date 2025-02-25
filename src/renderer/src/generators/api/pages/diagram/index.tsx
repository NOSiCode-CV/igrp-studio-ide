import { convertModelData } from './convertModelData';
import ERDDiagram from './ERDDiagram';
import { useEffect, useState } from 'react';
import { ModelData, RelationData } from './types';

export default function ERDLayout({ models }: { models: Array<any> }) {
    const [convertedModelData, setConvertedModelData] = useState<
        ModelData[] | null
    >(null);
    const [relations, setRelations] = useState<RelationData[] | null>(null);

    useEffect(() => {
        if (models) {
            const { models: modelData, relations } = convertModelData(models);

            setConvertedModelData(modelData);

            setRelations(relations);
        }
    }, [models]); 

    return (
        <>
            {convertedModelData && relations ? (
                <ERDDiagram models={convertedModelData} relations={relations} />
            ) : (
                <p className="text-foreground">Loading diagram...</p>
            )}
        </>
    );
}
