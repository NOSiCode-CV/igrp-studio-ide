import { useDispatch } from 'react-redux';
import { setCurrentItem as onSetCurrentItem } from '@renderer/redux/thunks';
import { getBadgeColor, getIcon } from '@renderer/utils/helpers';
import { FileTree, MenuItem } from 'src/main/types';
import {
    Boxes,
    Cable,
    DatabaseZap,
    FileJson2,
    Layers,
    LucideIcon,
    Settings,
    Trash,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OPTION_TYPE } from '@renderer/constants/appConstants';
import { ROUTES } from '@renderer/routes/routeConstants';
import { lazy, ReactNode, useMemo, useCallback } from 'react';

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
    componentName?: ReactNode;
}

const useNavdata = (filesThree: FileTree[]) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const menuDelete: DropdownItem = useMemo(
        () => ({
            label: t('delete'),
            actionType: OPTION_TYPE.DELETE,
            icon: Trash,
        }),
        [t]
    );

    const dropdownSchemas: DropdownItem[] = useMemo(
        () => [
            {
                label: t('newModels'),
                actionType: OPTION_TYPE.MODEL,
                icon: getIcon(OPTION_TYPE.MODELS),
            },
            {
                label: t('importDataTableFromDatabase'),
                actionType: OPTION_TYPE.MODAL,
                componentName: <DatabaseManagerModal />,
                icon: DatabaseZap,
            },
            {
                label: t('importJsonSchemaFiles'),
                actionType: OPTION_TYPE.MODAL,
                componentName: <SerializationConfigModal />,
                icon: FileJson2,
            },
            {
                label: t('erdDiagram'),
                actionType: OPTION_TYPE.ERDDiagram,
                icon: Cable,
            },
        ],
        [t]
    );

    const dropdownDto: DropdownItem[] = useMemo(
        () => [
            {
                label: t('newDto'),
                actionType: OPTION_TYPE.DATA_OBJECTS,
                icon: getIcon(OPTION_TYPE.DATA_OBJECTS),
            },
            {
                label: t('importJsonSchemaFiles'),
                actionType: OPTION_TYPE.MODAL,
                componentName: <SerializationConfigModal />,
                icon: FileJson2,
            },
        ],
        [t]
    );

    const dropdownSubMenus: DropdownItem[] = useMemo(
        () => [
            {
                label: t('newAction'),
                actionType: OPTION_TYPE.ACTION,
                icon: getIcon(OPTION_TYPE.ACTION),
            },
            menuDelete,
        ],
        [t, menuDelete]
    );

    const getDropdownMenus = useCallback(
        (category: string) => {
            switch (category) {
                case OPTION_TYPE.MODELS:
                    return dropdownSchemas;
                case OPTION_TYPE.DATA_OBJECTS:
                    return dropdownDto;
                default:
                    return [];
            }
        },
        [dropdownSchemas]
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
            //@ts-ignore
            dispatch(onSetCurrentItem(rest));
        },
        [dispatch]
    );

    const getSubItems = useCallback(
        (categoryName: string, file: any, path: string, folderName: string) => {
            const actions = file?.content?.actions;
            if (categoryName === OPTION_TYPE.CONTROLLER && actions) {
                return actions.map((action) => ({
                    id: action.actionName,
                    label: action.actionName,
                    path: path,
                    type: OPTION_TYPE.ACTION,
                    click: onClickItem,
                    badgeColor: getBadgeColor(action.method),
                    badgeName: action.method,
                    content: action,
                    module: folderName,
                    link: ROUTES.PATH_PAGE_BUILDER_API,
                }));
            }
            return [];
        },
        [onClickItem]
    );

    const IGNORED_PATHS = ['baseApi.json', 'permissions.json', '.DS_store'];
    //console.log(folders)
    const menuItems: MenuItem[] = useMemo(() => {
        return filesThree
            .filter((folder) => !IGNORED_PATHS.includes(folder.name))
            .map((folder) => {
                let dropdownMenus: DropdownItem[] = [
                    {
                        label: t(`newDto`),
                        actionType: OPTION_TYPE.DATA_OBJECTS,
                        icon: getIcon(OPTION_TYPE.DATA_OBJECTS),
                    },
                    {
                        label: t('newModels'),
                        actionType: OPTION_TYPE.MODEL,
                        icon: getIcon(OPTION_TYPE.MODELS),
                    },
                ].filter(
                    (menu) =>
                        menu.actionType !== OPTION_TYPE.RESPONSE &&
                        menu.actionType !== OPTION_TYPE.ACTION &&
                        menu.actionType !== OPTION_TYPE.DELETE
                );

                if (folder.name === 'shared') {
                    dropdownMenus.push(
                        {
                            label: t('newResponses'),
                            actionType: OPTION_TYPE.RESPONSE,
                            icon: getIcon(OPTION_TYPE.RESPONSE),
                        },
                        {
                            label: t('newEnum'),
                            actionType: OPTION_TYPE.ENUM,
                            icon: getIcon(OPTION_TYPE.ENUM),
                        },
                        {
                            label: t('newPermission'),
                            actionType: OPTION_TYPE.PERMISSIONS,
                            icon: getIcon(OPTION_TYPE.PERMISSIONS),
                        }
                    );
                } else {
                    dropdownMenus.unshift({
                        label: t('newControllers'),
                        actionType: OPTION_TYPE.ACTION,
                        icon: getIcon(OPTION_TYPE.ACTION),
                    });
                    dropdownMenus.push(menuDelete);
                }

                const folderMenuItem: MenuItem = {
                    icon: folder.name === 'shared' ? Layers : Boxes,
                    label:
                        folder.name === 'shared' ? t(folder.name) : folder.name,
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
                            // Processa subpastas
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
                                        const fileMenuItem: MenuItem = {
                                            id: file.content?.id || file.name,
                                            label:
                                                file.content?.name || file.name,
                                            path: file.path,
                                            module: folder.name,
                                            type: file.content?.type || 'file',
                                            link: ROUTES.PATH_PAGE_BUILDER_API,
                                            subItems: getSubItems(
                                                file.content?.type,
                                                file,
                                                file.path,
                                                folder.name
                                            ),
                                            click: onClickItem,
                                            dropdownclick: onClickItem,
                                            dropdownMenus:
                                                file.content?.type ===
                                                OPTION_TYPE.CONTROLLER
                                                    ? dropdownSubMenus
                                                    : [menuDelete],
                                            content: file.content,
                                        };
                                        subFolderMenuItem.subItems!.push(
                                            fileMenuItem
                                        );
                                    }
                                });
                            }

                            folderMenuItem.subItems!.push(subFolderMenuItem);
                        } else {
                            // Processa arquivos na raiz
                            const fileMenuItem: MenuItem = {
                                id: folder.content?.id || folder.name,
                                label: folder.name,
                                path: folder.path,
                                module: folder.name,
                                type: folder.content?.type || 'file',
                                link: ROUTES.PATH_PAGE_BUILDER_API,
                                subItems: getSubItems(
                                    folder.content?.type,
                                    folder,
                                    folder.path,
                                    folder.name
                                ),
                                click: onClickItem,
                                dropdownclick: onClickItem,
                                dropdownMenus:
                                    folder.content?.type ===
                                    OPTION_TYPE.CONTROLLERS
                                        ? dropdownSubMenus
                                        : [menuDelete],
                                content: folder.content,
                            };
                            folderMenuItem.subItems!.push(fileMenuItem);
                        }
                    });
                }

                return folderMenuItem;
            });
    }, [
        filesThree,
        t,
        menuDelete,
        dropdownSubMenus,
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
