import { Attribute, ModelData, RelationData } from './types';

const relationMapping: Record<string, { text: string; toText: string }> = {
    OneToOne: { text: '1', toText: '1' },
    OneToMany: { text: '1', toText: '0..N' },
    ManyToOne: { text: '0..N', toText: '1' },
    ManyToMany: { text: '0..N', toText: '0..N' },
};

export function convertModelData(inputModels: Array<any>): {
    models: ModelData[];
    relations: RelationData[];
} {
    const convertAttribute = (attr: any): Attribute => ({
        name: attr.name,
        iskey: attr.primaryKey,
        figure: attr.primaryKey ? 'Diamond' : 'Circle',
        color: attr.primaryKey
            ? 'purple'
            : attr.type === 'string'
              ? 'green'
              : 'orange',
    });

    const models: ModelData[] = inputModels.map((inputModel) => {
        const { content: model } = inputModel;
        const regularAttributes = model.attributes.filter(
            (attr) => attr.type !== 'relation'
        );
        const inheritedAttributes = model.attributes.filter(
            (attr) => attr.type === 'relation'
        );
        return {
            key: model.name,
            name: model.name,
            items: regularAttributes.map(convertAttribute),
            inheritedItems: inheritedAttributes.map(convertAttribute),
        };
    });

    const relations: RelationData[] = inputModels.flatMap((inputModel) =>
        (inputModel.content.attributes || [])
            .filter((attr) => attr.type === 'relation')
            .map((attr) => {
                const { relation } = attr;
                const mapping = relationMapping[relation.type] || {
                    text: '',
                    toText: '',
                };

                return {
                    from: inputModel.content?.name,
                    to: relation.entity,
                    text: mapping.text,
                    toText: mapping.toText,
                };
            })
    );

    return { models, relations };
}
