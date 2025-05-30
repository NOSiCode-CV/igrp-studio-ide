import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { lazy } from 'react';
import {
    Box,
    Cable,
    DatabaseZap,
    FileJson2,
    Layers,
    LucideIcon,
    MoveRight,
    Settings,
    Trash,
} from 'lucide-react';

import { setCurrentItem as onSetCurrentItem } from '@renderer/redux/thunks';
import { getBadgeColor, getIcon } from '@renderer/utils';
import { OPTION_TYPE } from '@renderer/constants/appConstants';
import { ROUTES } from '@renderer/routes/routeConstants';
import { FileTree, MenuItem } from 'src/main/types';

const DatabaseManagerModal = lazy(
    () => import('@renderer/generators/api/components/DatabaseManager')
);

const SerializationConfigModal = lazy(
    () => import('@renderer/generators/api/components/serialization-config')
);

export interface DropdownItem {
    label: string;
    actionType: OPTION_TYPE;
    icon?: LucideIcon;
    componentName?: React.ReactNode;
}

const IGNORED_PATHS = new Set([
    'baseApi.json',
    'permissions.json',
    '.DS_store',
]);

const createMenuItems = (t: any) => ({
    newDto: {
        label: t('newDto'),
        actionType: OPTION_TYPE.DATA_OBJECTS,
        icon: getIcon(OPTION_TYPE.DATA_OBJECTS),
    },
    newModels: {
        label: t('newModels'),
        actionType: OPTION_TYPE.MODEL,
        icon: getIcon(OPTION_TYPE.MODELS),
    },
    newEnum: {
        label: t('newEnum'),
        actionType: OPTION_TYPE.ENUM,
        icon: getIcon(OPTION_TYPE.ENUM),
    },
    newResponses: {
        label: t('newResponses'),
        actionType: OPTION_TYPE.RESPONSE,
        icon: getIcon(OPTION_TYPE.RESPONSE),
    },
    newPermission: {
        label: t('newPermission'),
        actionType: OPTION_TYPE.PERMISSIONS,
        icon: getIcon(OPTION_TYPE.PERMISSIONS),
    },
    newControllers: {
        label: t('newControllers'),
        actionType: OPTION_TYPE.ACTION,
        icon: getIcon(OPTION_TYPE.ACTION),
    },
    importDataTableFromDatabase: {
        label: t('importDataTableFromDatabase'),
        actionType: OPTION_TYPE.MODAL,
        componentName: <DatabaseManagerModal />,
        icon: DatabaseZap,
    },
    importJsonSchemaFiles: {
        label: t('importJsonSchemaFiles'),
        actionType: OPTION_TYPE.MODAL,
        componentName: <SerializationConfigModal />,
        icon: FileJson2,
    },
    erdDiagram: {
        label: t('erdDiagram'),
        actionType: OPTION_TYPE.ERDDiagram,
        icon: Cable,
    },
    newAction: {
        label: t('newAction'),
        actionType: OPTION_TYPE.ACTION,
        icon: getIcon(OPTION_TYPE.ACTION),
    },
    delete: {
        label: t('delete'),
        actionType: OPTION_TYPE.DELETE,
        icon: Trash,
    },
    convertToDto: {
        label: t('convertToDTO'),
        actionType: OPTION_TYPE.DATA_OBJECTS,
        icon: MoveRight,
    },
});

const useNavdata = (filesThree: FileTree[]) => {
    const dispatch: any = useDispatch();
    const { t } = useTranslation();

    const menuItemsConfig = useMemo(() => createMenuItems(t), [t]);

    const dropdownConfigs = useMemo(
        () => ({
            baseDropdownMenus: [
                menuItemsConfig.newDto,
                menuItemsConfig.newModels,
                menuItemsConfig.newEnum,
                menuItemsConfig.newResponses,
            ],
            schemas: [
                menuItemsConfig.newModels,
                menuItemsConfig.importDataTableFromDatabase,
                menuItemsConfig.importJsonSchemaFiles,
                menuItemsConfig.erdDiagram,
            ],
            dto: [
                menuItemsConfig.newDto,
                menuItemsConfig.importJsonSchemaFiles,
            ],
            subMenus: [menuItemsConfig.newAction, menuItemsConfig.delete],
            modelMenus: [menuItemsConfig.convertToDto, menuItemsConfig.delete],
            defaultMenus: [menuItemsConfig.delete],
            sharedExtension: [
                menuItemsConfig.newPermission,
            ],
            controllersExtension: [menuItemsConfig.newControllers],
        }),
        [menuItemsConfig]
    );

    const getDropdownMenus = useCallback(
        (category: string) => {
            const menuMap = {
                [OPTION_TYPE.MODELS]: dropdownConfigs.schemas,
                [OPTION_TYPE.DATA_OBJECTS]: dropdownConfigs.dto,
            };
            return menuMap[category] || [];
        },
        [dropdownConfigs]
    );

    const getDropdownSubMenus = useCallback(
        (category: string) => {
            const menuMap = {
                [OPTION_TYPE.CONTROLLERS]: dropdownConfigs.subMenus,
                [OPTION_TYPE.CONTROLLER]: dropdownConfigs.subMenus,
                [OPTION_TYPE.MODEL]: dropdownConfigs.modelMenus,
            };
            return menuMap[category] || dropdownConfigs.defaultMenus;
        },
        [dropdownConfigs]
    );

    const onClickItem = useCallback(
        (item: MenuItem) => {
            const {
                icon,
                click,
                subItems,
                dropdownMenus,
                dropdownclick,
                ...rest
            } = item;
            dispatch(onSetCurrentItem(rest));
        },
        [dispatch]
    );

    const getSubItems = useCallback(
        (file: any, folderName: string) => {
            const { path, content } = file;
            const { actions, type, id } = content;

            if (type === OPTION_TYPE.CONTROLLER && actions) {
                return actions.map((action) => ({
                    id,
                    label: action.actionName,
                    path,
                    type: OPTION_TYPE.ACTION,
                    click: onClickItem,
                    badgeColor: getBadgeColor(action.method),
                    badgeName: action.method,
                    content: action,
                    module: folderName,
                }));
            }
            return [];
        },
        [onClickItem]
    );

    const menuItems = useMemo(() => {
        return filesThree
            .filter((folder) => !IGNORED_PATHS.has(folder.name))
            .map((folder) => {
                const isShared = folder.name === 'shared';

                const dropdownMenus = isShared
                    ? [
                          ...dropdownConfigs.baseDropdownMenus,
                          ...dropdownConfigs.sharedExtension,
                      ]
                    : [
                          ...dropdownConfigs.controllersExtension,
                          ...dropdownConfigs.baseDropdownMenus,
                          menuItemsConfig.delete,
                      ];

                const folderMenuItem: MenuItem = {
                    icon: isShared ? Layers : Box,
                    label: isShared ? t(folder.name) : folder.name,
                    module: folder.name,
                    subItems: [],
                    dropdownclick: onClickItem,
                    dropdownMenus,
                    type: 'module',
                };

                if (folder.children) {
                    folder.children.forEach((child) => {
                        if (
                            !Object.values(OPTION_TYPE).includes(
                                child.name as OPTION_TYPE
                            )
                        ) {
                            return;
                        }

                        if (child.isDirectory) {
                            const subFolderMenuItem: MenuItem = {
                                icon: getIcon(child.name),
                                label: t(child.name),
                                module: folder.name,
                                subItems: [],
                                dropdownclick: onClickItem,
                                dropdownMenus: getDropdownMenus(child.name),
                                type: child.name,
                            };

                            if (child.children) {
                                child.children.forEach((file) => {
                                    if (!file.isDirectory) {
                                        const dropdownMenus =
                                            getDropdownSubMenus(
                                                file.content?.type
                                            );

                                        const fileMenuItem: MenuItem = {
                                            id:
                                                file.content?.type ===
                                                OPTION_TYPE.CONTROLLER
                                                    ? `${file.content?.id}-CONTROLLER`
                                                    : file.content?.id,
                                            label:
                                                file.content?.name || file.name,
                                            path: file.path,
                                            module: folder.name,
                                            type: file.content?.type,
                                            link: ROUTES.PATH_PAGE_BUILDER_API,
                                            subItems: getSubItems(
                                                file,
                                                folder.name
                                            ),
                                            click: onClickItem,
                                            dropdownclick: onClickItem,
                                            dropdownMenus,
                                            content: file.content,
                                        };
                                        subFolderMenuItem.subItems?.push(
                                            fileMenuItem
                                        );
                                    }
                                });
                            }

                            folderMenuItem.subItems?.push(subFolderMenuItem);
                        } else {
                            const dropdownMenus = getDropdownSubMenus(
                                folder.content?.type
                            );

                            const fileMenuItem: MenuItem = {
                                id: folder.content?.id || folder.name,
                                label: folder.name,
                                path: folder.path,
                                module: folder.name,
                                type: folder.content?.type,
                                link: ROUTES.PATH_PAGE_BUILDER_API,
                                subItems: getSubItems(folder, folder.name),
                                click: onClickItem,
                                dropdownclick: onClickItem,
                                dropdownMenus,
                                content: folder.content,
                            };
                            folderMenuItem.subItems?.push(fileMenuItem);
                        }
                    });
                }

                return folderMenuItem;
            });
    }, [
        filesThree,
        t,
        dropdownConfigs,
        getDropdownMenus,
        getSubItems,
        onClickItem,
    ]);

    return { menuItems };
};

const useNavSettings = () => {
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
                        link: '/project-settings',
                    },
                ],
            },
            {
                id: 'ProjectResources',
                label: 'Project Resources',
                icon: Layers,
                subItems: [
                    {
                        id: 'DatabaseConnections',
                        label: 'Database Connections',
                        link: '/connections',
                    },
                ],
            },
        ],
        []
    );

    return { menuItems };
};

export { useNavdata, useNavSettings };
