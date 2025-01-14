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
import { lazy, ReactNode } from 'react';
const DatabaseManagerModal = lazy(
    () => import('@renderer/generators/api/components/DatabaseManager')
);

export interface dropdownItem {
    label: string;
    actionType: OPTION_TYPE;
    icon?: LucideIcon;
    componentName?: ReactNode;
}

const Navdata = (folders: any) => {
    const dispatch: any = useDispatch();

    const menuItems: MenuItem[] = [];

    const { t } = useTranslation();

    const menuDelete: dropdownItem = {
        label: t('delete'),
        actionType: OPTION_TYPE.DELETE,
        icon: Trash,
    };

    const dropdownSchemas: dropdownItem[] = [
        {
            label: t('newModels'),
            actionType: OPTION_TYPE.MODEL,
            icon: getIcon(OPTION_TYPE.MODELS),
        },
        {
            label: t('Import data table from database'),
            actionType: OPTION_TYPE.IMPORT_TABLE_DB,
            componentName: <DatabaseManagerModal />,
            icon: DatabaseZap,
        },
        {
            label: t('Import JSON Schema Files'),
            actionType: OPTION_TYPE.MODELS,
            icon: FileJson2,
        },
        {
            label: t('ERD Diagram'),
            actionType: OPTION_TYPE.ERDDiagram,
            icon: Cable,
        },
    ];

    const dropdownSubMenus: dropdownItem[] = [
        {
            label: t('newAction'),
            actionType: OPTION_TYPE.ACTION,
            icon: getIcon(OPTION_TYPE.ACTION),
        },
    ];

    dropdownSubMenus.push(menuDelete);

    let dropdownMenus: dropdownItem[] = [
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
    ];

    const onClickItem = (item: any) => {
        delete item.icon;
        delete item.click;
        delete item.subItems;
        delete item.dropdownMenus;
        delete item.dropdownclick;
        dispatch(onSetCurrentItem(item));
    };

    Object.keys(folders).forEach((folderName: string) => {
        dropdownMenus = dropdownMenus.filter(
            (menu) =>
                menu.actionType !== OPTION_TYPE.RESPONSE &&
                menu.actionType !== OPTION_TYPE.ACTION &&
                menu.actionType !== OPTION_TYPE.DELETE
        );

        if (folderName === 'shared') {
            dropdownMenus.unshift({
                label: t('newResponses'),
                actionType: OPTION_TYPE.RESPONSE,
            });
        } else {
            dropdownMenus.unshift({
                label: t('newControllers'),
                actionType: OPTION_TYPE.ACTION,
                icon: getIcon(OPTION_TYPE.ACTION),
            });
            dropdownMenus.push(menuDelete);
        }

        const folderMenuItem: MenuItem = {
            icon: folderName === 'shared' ? Layers : Boxes,
            label: folderName === 'shared' ? t(folderName) : folderName,
            module: folderName,
            subItems: [],
            dropdownclick: function (item) {
                onClickItem(item);
            },
            dropdownMenus,
            type: 'module',
        };

        // Process each folder's content
        folders[folderName].files.forEach((folder) => {
            Object.keys(folder).forEach((categoryName: string) => {
                const getDropdownMenus = (category: string): MenuItem[] => {
                    switch (category) {
                        case OPTION_TYPE.MODELS:
                            return dropdownSchemas;
                        default:
                            return [];
                    }
                };

                // Create a category menu item
                const categoryMenuItem: MenuItem = createMenuHeader(
                    t(categoryName),
                    categoryName
                );

                const menuItem = {
                    ...categoryMenuItem,
                    dropdownMenus: getDropdownMenus(categoryName),
                    dropdownclick: function (item: MenuItem) {
                        onClickItem(item);
                    },
                    module: folderName,
                    subItems: folder[categoryName].map(
                        (file: {
                            name: string;
                            path: string;
                            content: any;
                        }) => ({
                            label: file.name,
                            path: file.path,
                            module: folderName,
                            type: file?.content?.type,
                            link: ROUTES.PATH_PAGE_BUILDER_API,
                            subItems: getSubItems(
                                file?.content?.type,
                                file,
                                file.path,
                                folderName,
                                onClickItem
                            ),
                            click: (subItem: MenuItem) => onClickItem(subItem),
                            dropdownclick: function (item: MenuItem) {
                                onClickItem(item);
                            },
                            dropdownMenus:
                                categoryName === OPTION_TYPE.CONTROLLERS
                                    ? dropdownSubMenus
                                    : [menuDelete],
                            content: file?.content,
                        })
                    ),
                };

                // Add the category menu item to the folder's sub-items
                folderMenuItem.subItems!.push(menuItem);
            });
        });

        // Add the folder's menu item to the main menu items
        menuItems.push(folderMenuItem);
    });

    return { menuItems };
};

function getSubItems(
    categoryName: string,
    file: any,
    path: string,
    folderName: string,
    onClickItem: (subItem: any) => void
) {
    const actions = file?.content?.actions;
    if (categoryName === OPTION_TYPE.CONTROLLER && actions) {
        return actions.map((action) => ({
            id: action.actionName,
            label: action.actionName,
            path: path,
            type: OPTION_TYPE.ACTION,
            click: (subItem) => onClickItem(subItem),
            badgeColor: getBadgeColor(action.method),
            badgeName: action.method,
            content: action,
            module: folderName,
            link: ROUTES.PATH_PAGE_BUILDER_API,
        }));
    }
    return [];
}

const NavSettings = () => {
    const menuItems: MenuItem[] = [
        {
            id: 'GeneralSettings',
            label: 'General Settings',
            icon: Settings,
            subItems: [
                {
                    id: 'BaseSettings',
                    label: 'Base Settings',
                },
            ],
        },
        {
            id: 'GeneralSettings',
            label: 'Project Resources',
            icon: Layers,
            subItems: [
                {
                    id: 'DatabaseConnections',
                    label: 'Database Connections',
                },
            ],
        },
    ];
    return { menuItems };
};

export { Navdata, NavSettings };
