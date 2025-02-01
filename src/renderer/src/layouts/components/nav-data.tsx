import { useDispatch } from 'react-redux';
import { setCurrentItem as onSetCurrentItem } from '@renderer/redux/thunks';
import {
    createMenuHeader,
    getBadgeColor,
    getIcon,
} from '@renderer/utils/helpers';
import { MenuItem } from 'src/main/types';
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

export interface DropdownItem {
    label: string;
    actionType: OPTION_TYPE;
    icon?: LucideIcon;
    componentName?: ReactNode;
}

interface Folder {
    [key: string]: {
        files: Array<{
            [key: string]: Array<{
                name: string;
                path: string;
                content: any;
            }>;
        }>;
    };
}

const useNavdata = (folders: Folder) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const menuDelete: DropdownItem = useMemo(() => ({
        label: t('delete'),
        actionType: OPTION_TYPE.DELETE,
        icon: Trash,
    }), [t]);

    const dropdownSchemas: DropdownItem[] = useMemo(() => [
        {
            label: t('newModels'),
            actionType: OPTION_TYPE.MODEL,
            icon: getIcon(OPTION_TYPE.MODELS),
        },
        {
            label: t('importDataTableFromDatabase'),
            actionType: OPTION_TYPE.IMPORT_TABLE_DB,
            componentName: <DatabaseManagerModal />,
            icon: DatabaseZap,
        },
        {
            label: t('importJsonSchemaFiles'),
            actionType: OPTION_TYPE.MODELS,
            icon: FileJson2,
        },
        {
            label: t('erdDiagram'),
            actionType: OPTION_TYPE.ERDDiagram,
            icon: Cable,
        },
    ], [t]);

    const dropdownSubMenus: DropdownItem[] = useMemo(() => [
        {
            label: t('newAction'),
            actionType: OPTION_TYPE.ACTION,
            icon: getIcon(OPTION_TYPE.ACTION),
        },
        menuDelete,
    ], [t, menuDelete]);

    const getDropdownMenus = useCallback((category: string) => {
        switch (category) {
            case OPTION_TYPE.MODELS:
                return dropdownSchemas;
            default:
                return [];
        }
    }, [dropdownSchemas]);

    const onClickItem = useCallback((item: MenuItem) => {
        const { icon, click, subItems, dropdownMenus, dropdownclick, ...rest } = item;
        //@ts-ignore
        dispatch(onSetCurrentItem(rest));
    }, [dispatch]);

    const getSubItems = useCallback((
        categoryName: string,
        file: any,
        path: string,
        folderName: string
    ) => {
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
    }, [onClickItem]);

    const menuItems: MenuItem[] = useMemo(() => {
        return Object.keys(folders).map((folderName) => {
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

            if (folderName === 'shared') {
                dropdownMenus.push(
                    { label: t('newResponses'), actionType: OPTION_TYPE.RESPONSE },
                    { label: t('newEnum'), actionType: OPTION_TYPE.ENUM }
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
                id: folderName,
                icon: folderName === 'shared' ? Layers : Boxes,
                label: folderName === 'shared' ? t(folderName) : folderName,
                module: folderName,
                subItems: [],
                dropdownclick: onClickItem,
                dropdownMenus,
                type: 'module',
            };

            folders[folderName].files.forEach((folder) => {
                Object.keys(folder).forEach((categoryName) => {
                    const categoryMenuItem: MenuItem = createMenuHeader(
                        t(categoryName),
                        categoryName
                    );

                    const menuItem = {
                        ...categoryMenuItem,
                        dropdownMenus: getDropdownMenus(categoryName),
                        dropdownclick: onClickItem,
                        module: folderName,
                        subItems: folder[categoryName].map((file) => ({
                            label: file.name,
                            path: file.path,
                            module: folderName,
                            type: file?.content?.type,
                            link: ROUTES.PATH_PAGE_BUILDER_API,
                            subItems: getSubItems(
                                file?.content?.type,
                                file,
                                file.path,
                                folderName
                            ),
                            click: onClickItem,
                            dropdownclick: onClickItem,
                            dropdownMenus:
                                categoryName === OPTION_TYPE.CONTROLLERS
                                    ? dropdownSubMenus
                                    : [menuDelete],
                            content: file?.content,
                        })),
                    };

                    folderMenuItem.subItems!.push(menuItem);
                });
            });

            return folderMenuItem;
        });
    }, [folders, t, menuDelete, dropdownSubMenus, getDropdownMenus, getSubItems, onClickItem]);

    return { menuItems };
};

const useNavSettings = () => {
    const menuItems: MenuItem[] = useMemo(() => [
        {
            id: 'GeneralSettings',
            label: 'General Settings',
            icon: Settings,
            subItems: [
                {
                    id: 'BaseSettings',
                    label: 'Base Settings',
                    link: "/project-settings"
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
                },
            ],
        },
    ], []);

    return { menuItems };
};

export { useNavdata, useNavSettings };