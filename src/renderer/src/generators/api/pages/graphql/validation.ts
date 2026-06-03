import type {
    GraphQLArgumentFormValue,
    GraphQLOperationFormValues,
    GraphQLPersistedOperation
} from './types'

/**
 * Recursive form-error bag, equivalent to Formik's `FormErrors<T>`:
 * each key maps to either a string message, a nested record (for nested
 * objects) or an array of nested records (for repeated fields). Kept
 * library-agnostic so this module stops depending on Formik now that the
 * project standardises on React Hook Form.
 */
type FormErrors<T> = {
    [K in keyof T]?: T[K] extends Array<infer U>
        ? Array<FormErrors<U>> | string
        : T[K] extends object
          ? FormErrors<T[K]> | string
          : string
}

const GRAPHQL_NAME_PATTERN = /^[_A-Za-z][_0-9A-Za-z]*$/

interface ValidateGraphQLOperationOptions {
    operations: GraphQLPersistedOperation[]
    availableTypeValues: string[]
}

const isValidGraphQLName = (value: string) => GRAPHQL_NAME_PATTERN.test(value)

const normalize = (value?: string) => value?.trim() || ''

export async function validateGraphQLOperation(
    values: GraphQLOperationFormValues,
    { operations, availableTypeValues }: ValidateGraphQLOperationOptions
): Promise<FormErrors<GraphQLOperationFormValues>> {
    const errors: FormErrors<GraphQLOperationFormValues> = {}
    const operationName = normalize(values.name)
    const returnType = normalize(values.returnType)
    const inputType = normalize(values.inputType)
    const eventTopic = normalize(values.eventTopic)
    const availableTypes = new Set(availableTypeValues)
    const allowedReturnModes = new Set(['single', 'list'])
    const siblingOperations = operations.filter(
        (operation) =>
            operation.operationType === values.operationType && operation.id !== values.id
    )

    if (operationName.length === 0) {
        errors.name = 'Operation name is required'
    } else if (!isValidGraphQLName(operationName)) {
        errors.name = 'Operation name must be a valid GraphQL field name'
    } else if (siblingOperations.some((operation) => normalize(operation.name) === operationName)) {
        errors.name = `A ${values.operationType} with this name already exists`
    }

    if (returnType.length === 0) {
        errors.returnType = 'Return type is required'
    } else if (!availableTypes.has(returnType)) {
        errors.returnType = 'Return type must reference an existing type'
    }

    if (!allowedReturnModes.has(values.returnMode)) {
        errors.returnMode = 'Return mode must be single or list'
    }

    if (values.operationType === 'mutation') {
        if (inputType.length === 0) {
            errors.inputType = 'Input type reference is required'
        } else if (!availableTypes.has(inputType)) {
            errors.inputType = 'Input type must reference an existing type'
        }
    }

    if (values.operationType === 'subscription' && eventTopic.length === 0) {
        errors.eventTopic = 'Event topic / pattern is required'
    }

    const argErrors: Array<FormErrors<GraphQLArgumentFormValue> | undefined> = []
    const seenArgumentNames = new Set<string>()

    values.args.forEach((argument, index) => {
        const argumentName = normalize(argument.name)
        const argumentType = normalize(argument.type)
        const currentErrors: FormErrors<GraphQLArgumentFormValue> = {}

        if (argumentName.length === 0) {
            currentErrors.name = 'Parameter name is required'
        } else if (!isValidGraphQLName(argumentName)) {
            currentErrors.name = 'Parameter name must be a valid GraphQL name'
        } else if (seenArgumentNames.has(argumentName)) {
            currentErrors.name = 'Duplicate parameter name'
        } else {
            seenArgumentNames.add(argumentName)
        }

        if (argumentType.length === 0) {
            currentErrors.type = 'Parameter type is required'
        }

        if (typeof argument.required !== 'boolean') {
            currentErrors.required = 'Required must be true or false'
        }

        if (Object.keys(currentErrors).length > 0) {
            argErrors[index] = currentErrors
        }
    })

    if (argErrors.some(Boolean)) {
        errors.args = argErrors.map(
            (entry) => entry ?? {}
        ) as FormErrors<GraphQLArgumentFormValue>[]
    }

    return errors
}

export function buildGraphQLOperationTouched(values: GraphQLOperationFormValues) {
    return {
        name: true,
        comment: true,
        returnType: true,
        returnMode: true,
        inputType: true,
        eventTopic: true,
        args: values.args.map(() => ({
            name: true,
            type: true,
            required: true,
            defaultValue: true,
            description: true
        }))
    }
}
