import type {
    GraphQLArgumentFormValue,
    GraphQLOperationFormValues,
    GraphQLOperationPayload
} from './types'

const trimToUndefined = (value?: string): string | undefined => {
    if (typeof value !== 'string') return undefined

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
}

const hasArgumentContent = (argument: GraphQLArgumentFormValue): boolean => {
    return Boolean(
        trimToUndefined(argument.name) ||
            trimToUndefined(argument.type) ||
            trimToUndefined(argument.description) ||
            argument.defaultValue !== undefined
    )
}

const sanitizeArgument = (argument: GraphQLArgumentFormValue) => {
    const sanitizedArgument = {
        name: trimToUndefined(argument.name) || '',
        type: trimToUndefined(argument.type) || '',
        required: argument.required,
        ...(argument.defaultValue !== undefined ? { defaultValue: argument.defaultValue } : {}),
        ...(trimToUndefined(argument.description)
            ? { description: trimToUndefined(argument.description) }
            : {})
    }

    return sanitizedArgument
}

export const toGraphQLOperationPayload = (
    values: GraphQLOperationFormValues
): GraphQLOperationPayload => {
    const operationType = values.operationType
    const sanitizedArgs = values.args
        .filter(hasArgumentContent)
        .map(sanitizeArgument)

    const payload: GraphQLOperationPayload = {
        ...(trimToUndefined(values.id) ? { id: trimToUndefined(values.id) } : {}),
        operationType,
        name: trimToUndefined(values.name) || '',
        ...(trimToUndefined(values.comment) ? { comment: trimToUndefined(values.comment) } : {}),
        ...(sanitizedArgs.length > 0 ? { args: sanitizedArgs } : {}),
        returnType: trimToUndefined(values.returnType) || '',
        returnMode: values.returnMode,
        ...(typeof values.enabled === 'boolean' ? { enabled: values.enabled } : {})
    }

    if (operationType === 'mutation') {
        const inputType = trimToUndefined(values.inputType)
        if (inputType) {
            payload.inputType = inputType
        }
    }

    if (operationType === 'subscription') {
        const eventTopic = trimToUndefined(values.eventTopic)
        if (eventTopic) {
            payload.eventTopic = eventTopic
        }
    }

    return payload
}
