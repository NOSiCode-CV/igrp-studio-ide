import { PATTERNS } from '@renderer/constants/appConstants';
import * as Yup from 'yup';

export function useDtoValidation({ t }: { t: any }) {
    return Yup.object({
        name: Yup.string()
            .required('Name is required')
            .matches(PATTERNS.NAME_VALIDATION_PATTERN, t('msgInfoAccpetName'))
            .max(30, t('maxLengthExceeded', { max: 30 })),
        template: Yup.string().required('Template is required'),
        attributes: Yup.array().of(
            Yup.object().shape({
                name: Yup.string()
                    .required('Field name is required')
                    .matches(
                        PATTERNS.NAME_VALIDATION_PATTERN,
                        t('msgInfoAccpetName')
                    )
                    .max(30, t('maxLengthExceeded', { max: 30 })),
                type: Yup.string().required('Field type is required'),
            })
        ),
    });
}
