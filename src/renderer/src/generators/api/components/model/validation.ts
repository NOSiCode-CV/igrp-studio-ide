import { PATTERNS } from '@renderer/utils/constants';
import * as Yup from 'yup'

const RelationshipType = {
    ONE_TO_ONE: 'OneToOne',
    ONE_TO_MANY: 'OneToMany',
    MANY_TO_ONE: 'ManyToOne',
    MANY_TO_MANY: 'ManyToMany',
}

const conditionalValidation = Yup.object().shape({
    relationType: Yup.string().nullable(),
    entity: Yup.string().nullable(),
    joinColumn: Yup.string().nullable(),
    mappedBy: Yup.string().nullable(),
    joinTable: Yup.string().nullable(),
    inverseJoinColumn: Yup.string().nullable(),
}).test('relationType-or-entity-or-joinColumn-or-mappedBy-or-joinTable-or-inverseJoinColumn-required', '', function (value) {
    const { relationType, entity, joinColumn, mappedBy, joinTable, inverseJoinColumn } = value || {};

    if (relationType && !entity) {
        return this.createError({ path: this.path, message: { entity: 'Entity is required when Relation Type is provided' } });
    }

    if (relationType && relationType === RelationshipType.ONE_TO_ONE && !joinColumn) {
        return this.createError({ path: this.path, message: { joinColumn: `Join Column is required when Relation Type is ${RelationshipType.ONE_TO_ONE}` } });
    }

    if (relationType && relationType === RelationshipType.MANY_TO_ONE && !joinColumn) {
        return this.createError({ path: this.path, message: { joinColumn: `Join Column is required when Relation Type is ${RelationshipType.MANY_TO_ONE}` } });
    }

    if (relationType && relationType === RelationshipType.ONE_TO_MANY && !mappedBy) {
        return this.createError({ path: this.path, message: { mappedBy: `Mapped By is required when Relation Type is ${RelationshipType.ONE_TO_MANY}` } });
    }

    //MANY TO MANY
    if (relationType && relationType === RelationshipType.MANY_TO_MANY && !joinColumn) {
        return this.createError({ path: this.path, message: { joinColumn: `join Column is required when Relation Type is ${RelationshipType.MANY_TO_MANY}` } });
    }

    if (relationType && relationType === RelationshipType.MANY_TO_MANY && !joinTable) {
        return this.createError({ path: this.path, message: { joinTable: `Join Table is required when Relation Type is ${RelationshipType.MANY_TO_MANY}` } });
    }

    if (relationType && relationType === RelationshipType.MANY_TO_MANY && !inverseJoinColumn) {
        return this.createError({ path: this.path, message: { inverseJoinColumn: `Inverse Join Column is required when Relation Type is ${RelationshipType.MANY_TO_MANY}` } });
    }

    return true; // If both are valid or both are not present, return true
});

export function useModelValidation({t}) {
    const validationSchema = Yup.object({
        name: Yup.string().required('Name is required')
            .matches(PATTERNS.NAME_VALIDATION_PATTERN, t('msgInfoAccpetName'))
            .max(20, t("maxLengthExceeded", { max: 20 })),
        tableName: Yup.string().required('Table name is required'),
        attributes: Yup.array().of(
            Yup.object().shape({
                name: Yup.string().required('Name is required'),
                type: Yup.string().required('Type is required')
            })
        ),
        relations: Yup.array().of(conditionalValidation),
        crud: Yup.array().of(
            Yup.object().shape({
                path: Yup.string().when('$enableCrud', (enableCrud, schema) => {
                    return enableCrud && enableCrud[0] === true
                        ? schema.required('Path is required')
                        : schema.notRequired();
                }),
            })
        ),

        indexes: Yup.array().of(
            Yup.object().shape({
                /* name: Yup.string().required('Name is required') */
            })
        ),
        contraint: Yup.object().shape({
            compoundUnique: Yup.array().of(
                Yup.object().shape({
                    /* name: Yup.string().required('Name is required') */
                })
            )
        })
    })

    return validationSchema;
}