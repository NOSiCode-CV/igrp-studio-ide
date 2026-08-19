import {
    isSharedModuleName,
    OPTION_TYPE,
    SHARED_MODULE_FOLDER,
    type OptionType
} from '@renderer/constants/appConstants'
import { setCurrentItem as onSetCurrentItem } from '@renderer/redux/thunks'
import { ROUTES } from '@renderer/routes/routeConstants'
import { getBadgeColor, getIcon } from '@renderer/utils'
import {
    Box,
    Cable,
    Copy,
    DatabaseZap,
    FileJson2,
    Layers,
    type LucideIcon,
    MoveRight,
    Settings,
    Trash
} from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import type { FileTree, MenuItem } from 'src/main/types'

export interface DropdownItem {
    label: string
    actionType: OptionType
    icon?: LucideIcon
    modalType?: 'database-manager' | 'serialization-config'
    isNew?: boolean
}

const IGNORED_PATHS = new Set(['baseApi.json', 'permissions.json', '.DS_store'])

const createMenuItems = (t: any) => ({
    newDto: {
        id: 'new-dto',
        label: t('newDto'),
        actionType: OPTION_TYPE.DATA_OBJECTS,
        icon: getIcon(OPTION_TYPE.DATA_OBJECTS)
    },
    newModels: {
        id: 'new-model',
        label: t('newModels'),
        actionType: OPTION_TYPE.MODEL,
        icon: getIcon(OPTION_TYPE.MODELS)
    },
    newEnum: {
        id: 'new-enum',
        label: t('newEnum'),
        actionType: OPTION_TYPE.ENUM,
        icon: getIcon(OPTION_TYPE.ENUM)
    },
    newResponses: {
        id: 'new-response',
        label: t('newResponses'),
        actionType: OPTION_TYPE.RESPONSE,
        icon: getIcon(OPTION_TYPE.RESPONSE)
    },
    newControllers: {
        id: 'new-controller',
        label: t('newControllers'),
        actionType: OPTION_TYPE.ACTION,
        icon: getIcon(OPTION_TYPE.ACTION)
    },
    graphql: {
        label: 'GraphQL',
        actionType: OPTION_TYPE.GRAPHQL,
        icon: getIcon(OPTION_TYPE.GRAPHQL)
    },
    newGraphQLQuery: {
        label: 'New Query',
        actionType: OPTION_TYPE.GRAPHQL_QUERY,
        icon: getIcon(OPTION_TYPE.GRAPHQL_QUERY),
        isNew: false
    },
    newGraphQLMutation: {
        label: 'New Mutation',
        actionType: OPTION_TYPE.GRAPHQL_MUTATION,
        icon: getIcon(OPTION_TYPE.GRAPHQL_MUTATION),
        isNew: false
    },
    newGraphQLSubscription: {
        label: 'New Subscription',
        actionType: OPTION_TYPE.GRAPHQL_SUBSCRIPTION,
        icon: getIcon(OPTION_TYPE.GRAPHQL_SUBSCRIPTION),
        isNew: false
    },
    importDataTableFromDatabase: {
        label: t('importDataTableFromDatabase'),
        actionType: OPTION_TYPE.MODAL,
        modalType: 'database-manager',
        icon: DatabaseZap
    },
    importJsonSchemaFiles: {
        label: t('importJsonSchemaFiles'),
        actionType: OPTION_TYPE.MODAL,
        modalType: 'serialization-config',
        icon: FileJson2
    },
    erdDiagram: {
        label: t('erdDiagram'),
        actionType: OPTION_TYPE.ERDDiagram,
        icon: Cable
    },
    newAction: {
        id: 'new-action',
        label: t('newAction'),
        actionType: OPTION_TYPE.ACTION,
        icon: getIcon(OPTION_TYPE.ACTION)
    },
    delete: {
        label: t('delete'),
        actionType: OPTION_TYPE.DELETE,
        icon: Trash
    },
    convertToDto: {
        label: t('convertToDTO'),
        actionType: OPTION_TYPE.DATA_OBJECTS,
        icon: MoveRight
    },
    duplicate: {
        label: t('duplicate'),
        actionType: OPTION_TYPE.DUPLICATE,
        icon: Copy
    }
})

const useNavdata = (filesThree: FileTree[]) => {
    const dispatch: any = useDispatch()
    const { t } = useTranslation()

    const menuItemsConfig = useMemo(() => createMenuItems(t), [t])

    const dropdownConfigs = useMemo(
        () => ({
            baseDropdownMenus: [
                menuItemsConfig.newDto,
                menuItemsConfig.newModels,
                menuItemsConfig.newEnum,
                menuItemsConfig.newResponses
            ],
            schemas: [
                menuItemsConfig.newModels,
                menuItemsConfig.importDataTableFromDatabase,
                menuItemsConfig.importJsonSchemaFiles,
                menuItemsConfig.erdDiagram
            ],
            dto: [menuItemsConfig.newDto, menuItemsConfig.importJsonSchemaFiles],
            subMenus: [
                menuItemsConfig.newAction,
                menuItemsConfig.duplicate,
                menuItemsConfig.delete
            ],
            modelMenus: [
                menuItemsConfig.convertToDto,
                menuItemsConfig.duplicate,
                menuItemsConfig.delete
            ],
            defaultMenus: [menuItemsConfig.duplicate, menuItemsConfig.delete],
            controllersExtension: [menuItemsConfig.newControllers],
            actionMenus: [menuItemsConfig.duplicate, menuItemsConfig.delete]
        }),
        [menuItemsConfig]
    )

    const getDropdownMenus = useCallback(
        (category: OptionType) => {
            const menuMap = {
                [OPTION_TYPE.MODELS]: dropdownConfigs.schemas,
                [OPTION_TYPE.DATA_OBJECTS]: dropdownConfigs.dto
            }
            return menuMap[category as keyof typeof menuMap] || []
        },
        [dropdownConfigs]
    )

    const getDropdownSubMenus = useCallback(
        (category: OptionType) => {
            const menuMap = {
                [OPTION_TYPE.CONTROLLERS]: dropdownConfigs.subMenus,
                [OPTION_TYPE.CONTROLLER]: dropdownConfigs.subMenus,
                [OPTION_TYPE.MODEL]: dropdownConfigs.modelMenus
            }
            return menuMap[category as keyof typeof menuMap] || dropdownConfigs.defaultMenus
        },
        [dropdownConfigs]
    )

    const onClickItem = useCallback(
        (item: MenuItem) => {
            const { icon, click, subItems, dropdownMenus, dropdownclick, ...rest } = item
            dispatch(onSetCurrentItem(rest))
        },
        [dispatch]
    )

    const openGraphQLAction = useCallback(
        (actionType: OptionType, moduleName: string, label: string) => {
            dispatch(
                onSetCurrentItem({
                    id: `${actionType}-${Date.now()}`,
                    label,
                    type: actionType,
                    module: moduleName,
                    isNew: false
                } as any)
            )
        },
        [dispatch]
    )

    const getSubItems = useCallback(
        (file: any, folderName: string) => {
            const { path, content } = file
            const { actions, type, id } = content

            if (type === OPTION_TYPE.CONTROLLER && actions) {
                return actions.map((action: any) => ({
                    id: `${id}-${action.actionName}`,
                    label: action.actionName,
                    path,
                    type: OPTION_TYPE.ACTION,
                    click: onClickItem,
                    dropdownclick: onClickItem,
                    dropdownMenus: dropdownConfigs.actionMenus,
                    badgeColor: getBadgeColor(action.method),
                    badgeName: action.method,
                    content: action,
                    module: folderName
                }))
            }
            return []
        },
        [onClickItem, dropdownConfigs.actionMenus]
    )

    const menuItems = useMemo(() => {
        return filesThree
            .filter((folder) => !IGNORED_PATHS.has(folder.name))
            .map((folder: any) => {
                const isShared = isSharedModuleName(folder.name)

                const dropdownMenus = isShared
                    ? [...dropdownConfigs.baseDropdownMenus]
                    : [
                          ...dropdownConfigs.controllersExtension,
                          ...dropdownConfigs.baseDropdownMenus,
                          menuItemsConfig.delete
                      ]

                const folderMenuItem: MenuItem = {
                    icon: isShared ? Layers : Box,
                    // Use the canonical lowercase i18n key when the folder
                    // is the shared bucket — `t('Shared')` would otherwise
                    // miss the translation and render literal "Shared"
                    // (which is what .NET projects were showing).
                    label: isShared ? t(SHARED_MODULE_FOLDER) : folder.name,
                    module: folder.name,
                    subItems: [],
                    dropdownclick: onClickItem,
                    dropdownMenus,
                    type: 'module'
                }

                if (folder.children) {
                    folder.children.forEach((child: any) => {
                        const isRootSecurityDescriptor =
                            (folder.name === 'authorization' || folder.name === 'permissions') &&
                            !child.isDirectory &&
                            child.name.endsWith('.json')

                        if (
                            !Object.values(OPTION_TYPE).includes(child.name as OptionType) &&
                            !isRootSecurityDescriptor
                        ) {
                            return
                        }

                        if (child.name === OPTION_TYPE.GRAPHQL) {
                            return
                        }

                        if (child.isDirectory) {
                            const subFolderMenuItem: MenuItem = {
                                icon: getIcon(child.name),
                                label: t(child.name),
                                module: folder.name,
                                subItems: [],
                                dropdownclick: onClickItem,
                                dropdownMenus: getDropdownMenus(child.name),
                                type: child.name
                            }

                            if (child.children) {
                                child.children.forEach((file: any) => {
                                    if (!file.isDirectory) {
                                        const dropdownMenus = getDropdownSubMenus(
                                            file.content?.type
                                        )

                                        const fileMenuItem: MenuItem = {
                                            id: file.content?.id,
                                            label: file.content?.name || file.name,
                                            path: file.path,
                                            module: folder.name,
                                            type: file.content?.type,
                                            link: ROUTES.PATH_PAGE_BUILDER_API,
                                            subItems: getSubItems(file, folder.name),
                                            click: onClickItem,
                                            dropdownclick: onClickItem,
                                            dropdownMenus,
                                            content: file.content
                                        }
                                        subFolderMenuItem.subItems?.push(fileMenuItem)
                                    }
                                })
                            }

                            folderMenuItem.subItems?.push(subFolderMenuItem)
                        } else {
                            const dropdownMenus = getDropdownSubMenus(child.content?.type)

                            const fileMenuItem: MenuItem = {
                                id: child.content?.id || child.name,
                                label: child.content?.name || child.name,
                                path: child.path,
                                module: folder.name,
                                type: isRootSecurityDescriptor
                                    ? OPTION_TYPE.FILE_THREE
                                    : child.content?.type,
                                link: ROUTES.PATH_PAGE_BUILDER_API,
                                subItems: getSubItems(child, folder.name),
                                click: onClickItem,
                                dropdownclick: onClickItem,
                                dropdownMenus,
                                content: child.content
                            }
                            folderMenuItem.subItems?.push(fileMenuItem)
                        }
                    })
                }

                const graphQLDirectory = folder.children?.find(
                    (child: any) => child.name === OPTION_TYPE.GRAPHQL
                )
                const graphQLManifest = graphQLDirectory?.children?.find(
                    (file: any) => !file.isDirectory && file.name === 'graphql.json'
                )?.content
                const graphQLOperations = Array.isArray(graphQLManifest?.operations)
                    ? graphQLManifest.operations
                    : []
                const graphQLTypesDirectory = graphQLDirectory?.children?.find(
                    (child: any) => child.isDirectory && child.name === 'types'
                )
                const graphQLTypeFiles: any[] =
                    graphQLTypesDirectory?.children?.filter(
                        (file: any) => !file.isDirectory && file.name.endsWith('.json')
                    ) ?? []

                folderMenuItem.subItems?.push({
                    id: `graphql-${folder.name}`,
                    label: 'GraphQL',
                    module: folder.name,
                    type: OPTION_TYPE.GRAPHQL,
                    icon: getIcon(OPTION_TYPE.GRAPHQL),
                    link: ROUTES.PATH_PAGE_BUILDER_API,
                    click: onClickItem,
                    dropdownclick: onClickItem,
                    dropdownMenus: [
                        {
                            ...menuItemsConfig.newGraphQLQuery,
                            dropdownclick: () =>
                                openGraphQLAction(
                                    OPTION_TYPE.GRAPHQL_QUERY,
                                    folder.name,
                                    'New Query'
                                )
                        },
                        {
                            ...menuItemsConfig.newGraphQLMutation,
                            dropdownclick: () =>
                                openGraphQLAction(
                                    OPTION_TYPE.GRAPHQL_MUTATION,
                                    folder.name,
                                    'New Mutation'
                                )
                        },
                        {
                            ...menuItemsConfig.newGraphQLSubscription,
                            dropdownclick: () =>
                                openGraphQLAction(
                                    OPTION_TYPE.GRAPHQL_SUBSCRIPTION,
                                    folder.name,
                                    'New Subscription'
                                )
                        }
                    ] as any,
                    content: {
                        type: OPTION_TYPE.GRAPHQL
                    },
                    subItems: [
                        {
                            id: `graphql-queries-${folder.name}`,
                            label: 'Queries',
                            module: folder.name,
                            type: OPTION_TYPE.GRAPHQL,
                            dropdownMenus: [
                                {
                                    ...menuItemsConfig.newGraphQLQuery,
                                    dropdownclick: () =>
                                        openGraphQLAction(
                                            OPTION_TYPE.GRAPHQL_QUERY,
                                            folder.name,
                                            'New Query'
                                        )
                                }
                            ] as any,
                            subItems: graphQLOperations
                                .filter((operation: any) => operation.operationType === 'query')
                                .map((operation: any) => ({
                                    id: operation.id,
                                    label: operation.name,
                                    module: folder.name,
                                    type: OPTION_TYPE.GRAPHQL_QUERY,
                                    link: ROUTES.PATH_PAGE_BUILDER_API,
                                    click: onClickItem,
                                    dropdownclick: onClickItem,
                                    dropdownMenus: [menuItemsConfig.delete] as any,
                                    content: operation
                                }))
                        },
                        {
                            id: `graphql-mutations-${folder.name}`,
                            label: 'Mutations',
                            module: folder.name,
                            type: OPTION_TYPE.GRAPHQL,
                            dropdownMenus: [
                                {
                                    ...menuItemsConfig.newGraphQLMutation,
                                    dropdownclick: () =>
                                        openGraphQLAction(
                                            OPTION_TYPE.GRAPHQL_MUTATION,
                                            folder.name,
                                            'New Mutation'
                                        )
                                }
                            ] as any,
                            subItems: graphQLOperations
                                .filter((operation: any) => operation.operationType === 'mutation')
                                .map((operation: any) => ({
                                    id: operation.id,
                                    label: operation.name,
                                    module: folder.name,
                                    type: OPTION_TYPE.GRAPHQL_MUTATION,
                                    link: ROUTES.PATH_PAGE_BUILDER_API,
                                    click: onClickItem,
                                    dropdownclick: onClickItem,
                                    dropdownMenus: [menuItemsConfig.delete] as any,
                                    content: operation
                                }))
                        },
                        {
                            id: `graphql-types-${folder.name}`,
                            label: 'Types',
                            module: folder.name,
                            type: OPTION_TYPE.GRAPHQL,
                            dropdownMenus: [
                                {
                                    ...menuItemsConfig.newDto,
                                    dropdownclick: () =>
                                        openGraphQLAction(
                                            OPTION_TYPE.DATA_OBJECTS,
                                            folder.name,
                                            'New Type'
                                        )
                                }
                            ] as any,
                            subItems: graphQLTypeFiles.map((file: any) => ({
                                id: file.content?.id || file.name,
                                label: file.content?.name || file.name.replace('.json', ''),
                                path: file.path,
                                module: folder.name,
                                type: OPTION_TYPE.DATA_OBJECTS,
                                link: ROUTES.PATH_PAGE_BUILDER_API,
                                click: onClickItem,
                                dropdownclick: onClickItem,
                                dropdownMenus: [menuItemsConfig.delete] as any,
                                content: file.content
                            }))
                        },
                        {
                            id: `graphql-subscriptions-${folder.name}`,
                            label: 'Subscriptions',
                            module: folder.name,
                            type: OPTION_TYPE.GRAPHQL,
                            dropdownMenus: [
                                {
                                    ...menuItemsConfig.newGraphQLSubscription,
                                    dropdownclick: () =>
                                        openGraphQLAction(
                                            OPTION_TYPE.GRAPHQL_SUBSCRIPTION,
                                            folder.name,
                                            'New Subscription'
                                        )
                                }
                            ] as any,
                            subItems: graphQLOperations
                                .filter(
                                    (operation: any) => operation.operationType === 'subscription'
                                )
                                .map((operation: any) => ({
                                    id: operation.id,
                                    label: operation.name,
                                    module: folder.name,
                                    type: OPTION_TYPE.GRAPHQL_SUBSCRIPTION,
                                    link: ROUTES.PATH_PAGE_BUILDER_API,
                                    click: onClickItem,
                                    dropdownclick: onClickItem,
                                    dropdownMenus: [menuItemsConfig.delete] as any,
                                    content: operation
                                }))
                        }
                    ]
                })

                return folderMenuItem
            })
    }, [
        filesThree,
        t,
        dropdownConfigs,
        getDropdownMenus,
        getDropdownSubMenus,
        getSubItems,
        onClickItem,
        menuItemsConfig,
        openGraphQLAction
    ])

    return { menuItems }
}

const useNavSettings = (): { menuItems: MenuItem[] } => {
    const menuItems: MenuItem[] = useMemo(
        () => [
            {
                id: 'GeneralSettings',
                label: 'General Settings',
                icon: Settings,
                subItems: [
                    {
                        id: 'BaseSettings',
                        label: 'Base Settings',
                        link: '/project-settings'
                    }
                ]
            },
            {
                id: 'ProjectResources',
                label: 'Project Resources',
                icon: Layers,
                subItems: [
                    {
                        id: 'DatabaseConnections',
                        label: 'Database Connections',
                        link: '/connections'
                    }
                ]
            }
        ],
        []
    )

    return { menuItems }
}

export { useNavdata, useNavSettings }
