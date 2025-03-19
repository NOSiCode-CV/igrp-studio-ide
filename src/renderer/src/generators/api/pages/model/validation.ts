import { PATTERNS } from '@renderer/constants/appConstants';
import * as Yup from 'yup'

export function useModelValidation({t}) {
    const validationSchema = Yup.object({
        name: Yup.string().required('Name is required')
            .matches(PATTERNS.NAME_VALIDATION_PATTERN, t('msgInfoAccpetName'))
            .max(30, t("maxLengthExceeded", { max: 30 })),
        tableName: Yup.string().required('Table name is required'),
        attributes: Yup.array().of(
            Yup.object().shape({
                name: Yup.string().required('Name is required'),
                type: Yup.string().required('Type is required')
            })
        ),
        indexes: Yup.array().of(
            Yup.object().shape({
            })
        ),
        contraint: Yup.object().shape({
            compoundUnique: Yup.array().of(
                Yup.object().shape({
                })
            )
        })
    })

    return validationSchema;
}