import { ENV_TYPES, PATTERNS } from '@renderer/constants/appConstants';
import * as Yup from 'yup';

export function useProjectValidation({ t, step }) {
    const validationSchema = Yup.object().shape({
        name: Yup.string().required(
            t('fieldRequired', { name: t('projectName') })
        ).max(
            20,
            t('maxLengthExceeded', { max: 20 })
        ),
        type: Yup.string().oneOf(
            ['frontend', 'backend'],
            t('fieldRequired', { name: t('projectType') })
        ),
        framework: Yup.string().required(
            t('fieldRequired', { name: t('framework') })
        ),
        path: Yup.string().required(
            t('fieldRequired', { name: t('projectDirectory') })
        ),
        config: Yup.lazy(() => {
            // Only validate the config object when the step is 3
            if (step === 3) {
                return Yup.object().shape({
                    appName: Yup.string().when(
                        '$framework',
                        (framework, schema) => {
                            return framework &&
                                framework[0] === ENV_TYPES.NEXTJS
                                ? schema
                                    .required(
                                        t('thisFieldRequired', {
                                            name: t('name'),
                                        })
                                    )
                                    .matches(
                                        PATTERNS.NO_SPACE_AND_HYPHEN,
                                        t('msgInfoAccpet')
                                    )
                                    .max(
                                        20,
                                        t('maxLengthExceeded', { max: 20 })
                                    )
                                : schema.notRequired();
                        }
                    ),
                    apiName: Yup.string().when('$framework', (framework, schema) => {
                        return framework &&
                            [ENV_TYPES.SPRING, ENV_TYPES.DOTNET].includes(
                                framework[0]
                            )
                            ? schema
                                .required(
                                    t('thisFieldRequired', { name: t('name') })
                                )
                                .matches(
                                    PATTERNS.NO_SPACE_AND_HYPHEN,
                                    t('msgInfoAccpet')
                                )
                                .max(20, t('maxLengthExceeded', { max: 20 }))
                            : schema.notRequired();
                    }),
                    // Validation for Spring-specific fields
                    group: Yup.string().when('$framework', (framework, schema) => {
                        return framework && framework[0] === ENV_TYPES.SPRING
                            ? schema
                                .required(
                                    t('thisFieldRequired', { name: t('group') })
                                )
                                .matches(
                                    PATTERNS.NO_SPACE_AND_HYPHEN,
                                    t('msgInfoAccpet')
                                )
                                .max(50, t('maxLengthExceeded', { max: 50 }))
                            : schema.notRequired();
                    }),
                    artifact: Yup.string().when('$framework', (framework, schema) => {
                        return framework && framework[0] === ENV_TYPES.SPRING
                            ? schema
                                .required(
                                    t('thisFieldRequired', { name: t('artifact') })
                                )
                                .matches(
                                    PATTERNS.NO_SPACE_AND_HYPHEN,
                                    t('msgInfoAccpet')
                                )
                                .max(50, t('maxLengthExceeded', { max: 50 }))
                            : schema.notRequired();
                    }),
                    database: Yup.string().when('$framework', (framework, schema) => {
                        return framework && framework[0] === ENV_TYPES.SPRING
                            ? schema.required(
                                t('thisFieldRequired', { name: t('database') })
                            )
                            : schema.notRequired();
                    }),
                    igrpCoreVersion: Yup.string().when(
                        '$framework',
                        (framework, schema) => {
                            return framework && framework[0] === ENV_TYPES.SPRING
                                ? schema.required(
                                    t('thisFieldRequired', {
                                        name: t('igrpCoreVersion'),
                                    })
                                )
                                : schema.notRequired();
                        }
                    ),
                });
            }
            // Return an empty schema if the step is not 3
            return Yup.object().shape({});
        }),
    });

    return validationSchema;

}