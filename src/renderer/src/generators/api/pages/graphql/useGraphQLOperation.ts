import { useTabs } from '@renderer/components/navigation/TabContext'
import { OPTION_TYPE } from '@renderer/constants/appConstants'
import useStudioAPI from '@renderer/hooks/use-studio-api'
import useToast from '@renderer/hooks/useToast'
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks'
import { useFormik } from 'formik'
import { useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { GraphQLService } from './service'
import { buildGraphQLOperationTouched, validateGraphQLOperation } from './validation'
import type { GraphQLOperationFormValues, GraphQLPersistedOperation } from './types'

interface CachedGraphQLManifest {
    operations?: GraphQLPersistedOperation[]
}

const getOperationTypeFromItem = (
    currentItem: any
): GraphQLOperationFormValues['operationType'] => {
    if (currentItem?.content?.operationType) {
        return currentItem.content.operationType
    }

    switch (currentItem?.type) {
        case OPTION_TYPE.GRAPHQL_MUTATION:
            return 'mutation'
        case OPTION_TYPE.GRAPHQL_SUBSCRIPTION:
            return 'subscription'
        default:
            return 'query'
    }
}

const buildInitialValues = (currentItem: any): GraphQLOperationFormValues => {
    const existingOperation = currentItem?.content as GraphQLPersistedOperation | undefined
    const operationType = getOperationTypeFromItem(currentItem)
    const defaultParamRow = {
        name: '',
        type: 'string',
        required: false,
        primaryKey: false,
        defaultValue: '',
        description: ''
    }
    const initialArgs = existingOperation
        ? (existingOperation.args?.map((argument) => ({
              name: argument.name,
              type: argument.type,
              required: argument.required,
              primaryKey: argument.primaryKey ?? false,
              defaultValue: argument.defaultValue ?? '',
              description: argument.description || ''
          })) ?? [])
        : [defaultParamRow]

    return {
        id: existingOperation?.id,
        operationType,
        name: existingOperation?.name || '',
        comment: existingOperation?.comment || '',
        args: initialArgs,
        inputType: existingOperation?.inputType || '',
        returnType: existingOperation?.returnType || '',
        returnMode: existingOperation?.returnMode || 'single',
        eventTopic: existingOperation?.eventTopic || '',
        enabled: existingOperation?.enabled ?? true
    }
}

const getCachedGraphQLOperations = (
    filesThree: any[],
    moduleName?: string
): GraphQLPersistedOperation[] => {
    if (!moduleName) return []

    const moduleNode = filesThree.find((item: any) => item.name === moduleName)
    const graphQLDirectory = moduleNode?.children?.find((child: any) => child.name === 'graphql')
    const manifest = graphQLDirectory?.children?.find(
        (file: any) => !file.isDirectory && file.name === 'graphql.json'
    )?.content as CachedGraphQLManifest | undefined

    return Array.isArray(manifest?.operations) ? manifest.operations : []
}

const getGraphQLTypesFromTree = (
    filesThree: any[],
    moduleName: string | undefined,
    kind: 'graphqlType' | 'graphqlInput'
): { name: string }[] => {
    if (!moduleName) return []

    const moduleNode = filesThree.find((item: any) => item.name === moduleName)
    const graphQLDirectory = moduleNode?.children?.find((child: any) => child.name === 'graphql')
    const typesDirectory = graphQLDirectory?.children?.find((child: any) => child.name === 'types')
    const files = typesDirectory?.children ?? []

    return files
        .filter((file: any) => !file.isDirectory && file.content?.type === kind)
        .map((file: any) => ({ name: file.content?.name || file.name }))
}

export const useGraphQLOperation = ({
    currentItem,
    onCloseTab
}: {
    currentItem: any
    onCloseTab: () => void
}) => {
    const dispatch: any = useDispatch()
    const { handleRenameTab } = useTabs()
    const { showErrorToast, showSuccessToast } = useToast()
    const { dto, models, responses, enums, basePath, filesThree } = useStudioAPI(
        currentItem?.module
    )

    const [savedOperation, setSavedOperation] = useState<GraphQLPersistedOperation | null>(
        currentItem?.content || null
    )

    const cachedOperations = useMemo(
        () => getCachedGraphQLOperations(filesThree, currentItem?.module),
        [filesThree, currentItem?.module]
    )

    const formik = useFormik<GraphQLOperationFormValues>({
        initialValues: buildInitialValues(currentItem),
        enableReinitialize: false,
        onSubmit: async (values) => {
            try {
                const validationErrors = await validateGraphQLOperation(values, {
                    operations: cachedOperations,
                    availableTypeValues: returnTypeOptions.map((option) => option.value),
                    availableInputTypeValues: inputTypeOptions.map((option) => option.value)
                })

                if (Object.keys(validationErrors).length > 0) {
                    await formik.setTouched(buildGraphQLOperationTouched(values) as any, true)
                    formik.setErrors(validationErrors)
                    showErrorToast('Please fix the GraphQL validation errors before saving')
                    return
                }

                const result = savedOperation?.id
                    ? await GraphQLService.updateGraphQLOperation(
                          basePath,
                          currentItem.module,
                          savedOperation.id,
                          values
                      )
                    : await GraphQLService.createGraphQLOperation(
                          basePath,
                          currentItem.module,
                          values
                      )

                setSavedOperation(result)
                formik.setFieldValue('id', result.id, false)
                handleRenameTab(currentItem.id, result.name)
                dispatch(onSetChangeStatus(true))
                showSuccessToast(`GraphQL operation "${result.name}" saved successfully`)
            } catch (error) {
                showErrorToast(error instanceof Error ? error.message : 'Failed to save operation')
            }
        }
    })

    const handleDelete = async () => {
        if (!savedOperation?.id) {
            onCloseTab()
            return
        }

        try {
            await GraphQLService.deleteGraphQLOperation(
                basePath,
                currentItem.module,
                savedOperation.id
            )
            dispatch(onSetChangeStatus(true))
            showSuccessToast(`GraphQL operation "${savedOperation.name}" deleted successfully`)
            onCloseTab()
        } catch (error) {
            showErrorToast(
                error instanceof Error ? error.message : 'Failed to delete GraphQL operation'
            )
        }
    }

    const graphqlTypes = useMemo(
        () => getGraphQLTypesFromTree(filesThree, currentItem?.module, 'graphqlType'),
        [filesThree, currentItem?.module]
    )

    const graphqlInputs = useMemo(
        () => getGraphQLTypesFromTree(filesThree, currentItem?.module, 'graphqlInput'),
        [filesThree, currentItem?.module]
    )

    const sharedTypeOptions = useMemo(() => {
        const artifactOptions = [...dto, ...models, ...responses, ...enums].map((item: any) => ({
            label: item.content?.name || item.name,
            value: item.content?.name || item.name
        }))

        const scalarOptions = [
            { label: 'ID', value: 'ID' },
            { label: 'String', value: 'String' },
            { label: 'Int', value: 'Int' },
            { label: 'Float', value: 'Float' },
            { label: 'Boolean', value: 'Boolean' }
        ]

        const unique = new Map<string, { label: string; value: string }>()
        ;[...scalarOptions, ...artifactOptions].forEach((option) => {
            unique.set(option.value, option)
        })

        return Array.from(unique.values())
    }, [dto, models, responses, enums])

    const returnTypeOptions = useMemo(() => {
        const graphqlTypeOptions = graphqlTypes.map(({ name }) => ({ label: name, value: name }))

        const unique = new Map<string, { label: string; value: string }>()
        ;[...sharedTypeOptions, ...graphqlTypeOptions].forEach((option) => {
            unique.set(option.value, option)
        })

        return Array.from(unique.values())
    }, [sharedTypeOptions, graphqlTypes])

    const inputTypeOptions = useMemo(() => {
        const fromDto = dto
            .filter((item: any) => item.content?.type === 'graphqlInput')
            .map((item: any) => ({
                label: item.content?.name || item.name,
                value: item.content?.name || item.name
            }))
        const fromTree = graphqlInputs.map(({ name }) => ({ label: name, value: name }))
        const unique = new Map<string, { label: string; value: string }>()
        ;[...fromDto, ...fromTree].forEach((option) => unique.set(option.value, option))
        return Array.from(unique.values())
    }, [dto, graphqlInputs])

    const changeArgValue = (element: string, position: number, value: any) => {
        formik.setFieldValue(`args.${position}.${element}`, value)
    }

    const operationType = formik.values.operationType

    return {
        formik,
        changeArgValue,
        title:
            savedOperation?.name ||
            (operationType === 'mutation'
                ? 'New Mutation'
                : operationType === 'subscription'
                  ? 'New Subscription'
                  : 'New Query'),
        isMutation: operationType === 'mutation',
        isSubscription: operationType === 'subscription',
        isPersisted: Boolean(savedOperation?.id),
        handleDelete,
        returnTypeOptions,
        inputTypeOptions
    }
}
