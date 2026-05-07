import {
    IGRPButtonPrimitive,
    IGRPCardContentPrimitive,
    IGRPCardDescriptionPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardPrimitive,
    IGRPCardTitlePrimitive
} from '@igrp/igrp-framework-react-design-system'
import { useTabs } from '@renderer/components/navigation/TabContext'
import { OPTION_TYPE } from '@renderer/constants/appConstants'
import useStudioAPI from '@renderer/hooks/use-studio-api'
import { cn } from '@renderer/lib/utils'
import { Activity, BellRing, Cable, Plus, WandSparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { GraphQLService } from './service'
import type { GraphQLPersistedOperation, GraphQLOperationType } from './types'
import { GraphQLOperationEditor } from './operation-editor'

interface GraphQLPageProps {
    currentItem: any
    onCloseTab: () => void
}

const toOptionType = (operationType: GraphQLOperationType) => {
    switch (operationType) {
        case 'mutation':
            return OPTION_TYPE.GRAPHQL_MUTATION
        case 'subscription':
            return OPTION_TYPE.GRAPHQL_SUBSCRIPTION
        default:
            return OPTION_TYPE.GRAPHQL_QUERY
    }
}

const operationGroups: Array<{
    key: GraphQLOperationType
    title: string
    icon: React.ElementType
    optionType:
        | typeof OPTION_TYPE.GRAPHQL_QUERY
        | typeof OPTION_TYPE.GRAPHQL_MUTATION
        | typeof OPTION_TYPE.GRAPHQL_SUBSCRIPTION
}> = [
    {
        key: 'query',
        title: 'Queries',
        icon: Activity,
        optionType: OPTION_TYPE.GRAPHQL_QUERY
    },
    {
        key: 'mutation',
        title: 'Mutations',
        icon: WandSparkles,
        optionType: OPTION_TYPE.GRAPHQL_MUTATION
    },
    {
        key: 'subscription',
        title: 'Subscriptions',
        icon: BellRing,
        optionType: OPTION_TYPE.GRAPHQL_SUBSCRIPTION
    }
]

export const GraphQLOverviewLayout = ({ currentItem }: GraphQLPageProps) => {
    const moduleName = currentItem?.module || 'shared'
    const [operations, setOperations] = useState<GraphQLPersistedOperation[]>([])
    const [loading, setLoading] = useState(false)
    const { handleNewTab } = useTabs()
    const { changeStatus, basePath } = useStudioAPI(moduleName)

    const loadOperations = async () => {
        setLoading(true)
        try {
            const result = await GraphQLService.listGraphQLOperations(basePath, moduleName)
            setOperations(result)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadOperations()
    }, [moduleName])

    useEffect(() => {
        if (changeStatus) {
            loadOperations()
        }
    }, [changeStatus, moduleName])

    const groupedOperations = useMemo(() => {
        return operationGroups.map((group) => ({
            ...group,
            items: operations.filter((operation) => operation.operationType === group.key)
        }))
    }, [operations])

    const openNewOperation = (
        optionType:
            | typeof OPTION_TYPE.GRAPHQL_QUERY
            | typeof OPTION_TYPE.GRAPHQL_MUTATION
            | typeof OPTION_TYPE.GRAPHQL_SUBSCRIPTION
    ) => {
        const titleMap = {
            [OPTION_TYPE.GRAPHQL_QUERY]: 'New Query',
            [OPTION_TYPE.GRAPHQL_MUTATION]: 'New Mutation',
            [OPTION_TYPE.GRAPHQL_SUBSCRIPTION]: 'New Subscription'
        }
        const tabId = `${optionType}-${Date.now()}`

        handleNewTab({
            id: tabId,
            title: titleMap[optionType],
            open: optionType,
            item: {
                id: tabId,
                type: optionType,
                module: moduleName,
                isNew: true
            }
        })
    }

    const openExistingOperation = (operation: GraphQLPersistedOperation) => {
        handleNewTab({
            id: operation.id,
            title: operation.name,
            open: toOptionType(operation.operationType),
            item: {
                id: operation.id,
                label: operation.name,
                type: toOptionType(operation.operationType),
                module: moduleName,
                content: operation
            }
        })
    }

    return (
        <div className="space-y-6 p-6">
            <IGRPCardPrimitive className="border-0 bg-[#0f1b33] text-white overflow-hidden">
                <IGRPCardHeaderPrimitive>
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                                Graph Management
                            </p>
                            <IGRPCardTitlePrimitive className="text-4xl font-bold">
                                GraphQL API
                            </IGRPCardTitlePrimitive>
                            <IGRPCardDescriptionPrimitive className="text-slate-300 max-w-2xl">
                                Define queries, mutations, and subscriptions for module{' '}
                                <strong>{moduleName}</strong>. Changes are persisted into
                                `graphql.json`.
                            </IGRPCardDescriptionPrimitive>
                        </div>
                        <Cable className="h-12 w-12 text-slate-400" />
                    </div>
                </IGRPCardHeaderPrimitive>
            </IGRPCardPrimitive>

            <div className="grid gap-4 lg:grid-cols-3">
                {groupedOperations.map((group) => (
                    <IGRPCardPrimitive key={group.key}>
                        <IGRPCardHeaderPrimitive>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <group.icon className="h-4 w-4 text-primary" />
                                    <IGRPCardTitlePrimitive className="text-base">
                                        {group.title}
                                    </IGRPCardTitlePrimitive>
                                    <span className="text-xs text-muted-foreground">
                                        {group.items.length}
                                    </span>
                                </div>
                                <IGRPButtonPrimitive
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => openNewOperation(group.optionType)}
                                >
                                    <Plus className="h-4 w-4" />
                                </IGRPButtonPrimitive>
                            </div>
                        </IGRPCardHeaderPrimitive>
                        <IGRPCardContentPrimitive>
                            <div className="space-y-2">
                                {group.items.length === 0 && (
                                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                                        {loading
                                            ? 'Loading...'
                                            : `No ${group.title.toLowerCase()} yet.`}
                                    </div>
                                )}

                                {group.items.map((operation) => (
                                    <button
                                        key={operation.id}
                                        type="button"
                                        onClick={() => openExistingOperation(operation)}
                                        className={cn(
                                            'w-full rounded-md border p-3 text-left transition-colors hover:border-primary hover:bg-muted/50'
                                        )}
                                    >
                                        <div className="font-medium">{operation.name}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {operation.returnType}
                                            {operation.returnMode === 'list' ? '[]' : ''}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </IGRPCardContentPrimitive>
                    </IGRPCardPrimitive>
                ))}
            </div>
        </div>
    )
}

export const GraphQLOperationLayout = ({ currentItem, onCloseTab }: GraphQLPageProps) => {
    return <GraphQLOperationEditor currentItem={currentItem} onCloseTab={onCloseTab} />
}

export { GraphQLOperationEditor } from './operation-editor'
