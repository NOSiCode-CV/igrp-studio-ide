import { PATTERNS } from '@renderer/constants/appConstants';
import * as Yup from 'yup'


const methodConditions = (method, schema, requiredMethods, errorMessage) => {
    const methodValue = Array.isArray(method) ? method[0] : method;
    return requiredMethods.includes(methodValue)
        ? schema.required(errorMessage)
        : schema.nullable();
};

const conditionalValidation = Yup.object().shape({
    type: Yup.string().nullable(),
    name: Yup.string().nullable(),
}).test('type-or-name-required', 'Either Type or Name is required', function (value) {
    const { type, name } = value || {};

    // If Type is present, Name must be required
    if (type && !name) {
        return this.createError({ path: this.path, message: { name: 'Name is required when Type is provided' } });
    }

    // If Name is present, Type must be required
    if (name && !type) {
        return this.createError({ path: this.path, message: { type: 'Type is required if Name is present' } });
    }

    return true; // If both are valid or both are not present, return true
});

export function useActionValidation({ t }) {
    return Yup.object().shape({
        actionName: Yup.string().required('Action Name is required')
            .matches(PATTERNS.NAME_VALIDATION_PATTERN, t('msgInfoAccpetName'))
            .max(20, t("maxLengthExceeded", { max: 20 })),
        method: Yup.string().required('Method is required'),
        /* accepts: Yup.string().when('method', (method, schema) =>
            methodConditions(method, schema, ['POST', 'PUT', 'PATCH'], 'Accepts is required for POST, PUT, PATCH')
        ),
        response: Yup.string().required('Response Type is required'), */
        //requestParams: Yup.array().of(conditionalValidation),
        //pathVariables: Yup.array().of(conditionalValidation),
    })

}

export function useControllerValidation({ t }) {
    return Yup.object({
        //name: Yup.string().required('Name is required')
        //    .matches(PATTERNS.NAME_VALIDATION_PATTERN, t('msgInfoAccpetName'))
        //    .max(20, t("maxLengthExceeded", { max: 20 })),
        //   basePath: Yup.string().required('Base Path is required'),
        actions: Yup.array().of(
            Yup.object().shape({
                actionName: Yup.string().required('Action Name is required')
                    .matches(PATTERNS.NAME_VALIDATION_PATTERN, t('msgInfoAccpetName'))
                    .max(20, t("maxLengthExceeded", { max: 20 })),
                method: Yup.string().required('Method is required'),
                accepts: Yup.string().when('method', (method, schema) =>
                    methodConditions(method, schema, ['POST', 'PUT', 'PATCH'], 'Accepts is required for POST, PUT, PATCH')
                ),
                /* requestBody: Yup.string().when('method', (method, schema) =>
                    methodConditions(method, schema, ['POST', 'PUT', 'PATCH'], 'Request Body is required for POST, PUT, PATCH')
                ), */
                //response: Yup.string().required('Response Type is required'),
                requestParams: Yup.array().of(conditionalValidation),
                pathVariables: Yup.array().of(conditionalValidation),
            })
        )
    });
}