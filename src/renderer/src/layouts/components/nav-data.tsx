import { useDispatch } from 'react-redux';
import { setCurrentItem as onSetCurrentItem } from '@renderer/redux/thunks';
import { createMenuHeader, getBadgeColor } from '@renderer/utils/helpers';
import { MenuItem } from 'src/main/types';
import { Boxes, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OPTION_TYPE } from '@renderer/constants/appConstants';
import { ROUTES } from '@renderer/routes/routeConstants';
import { lazy } from 'react';
const DatabaseManagerModal = lazy(
    () => import('@renderer/generators/api/components/DatabaseManager')
);

const Navdata = (folders: any) => {
    const dispatch: any = useDispatch();

    const menuItems: MenuItem[] = [];

    const { t } = useTranslation();
    const dropdownSchemas = [
        {
            label: t('newModels'),
            type: OPTION_TYPE.MODELS,
        },
        {
            label: t('Import data table from database'),
            type: OPTION_TYPE.IMPORT_TABLE_DB,
            componentName: <DatabaseManagerModal />,
        },
        {
            label: t('Import JSON Schema Files'),
            type: OPTION_TYPE.MODELS,
        },
    ];

    const dropdownSubMenus = [
        {
            label: t('newAction'),
            type: OPTION_TYPE.ACTION,
        },
    ];

    const dropdownMenus = [
        {
            label: t(`newDto`),
            type: OPTION_TYPE.DATA_OBJECTS,
        },
        {
            label: t('newModels'),
            type: OPTION_TYPE.MODELS,
        },
    ];

    const onClickItem = (item: any) => {
        delete item.icon;
        delete item.click;
        delete item.subItems;
        delete item.dropdownclick;
        dispatch(onSetCurrentItem(item));
    };

    Object.keys(folders).forEach((folderName: string) => {
        if (folderName !== 'shared') {
            dropdownMenus.unshift({
                label: t('newControllers'),
                type: OPTION_TYPE.ACTION,
            });
        }
        const folderMenuItem: MenuItem = {
            icon: folderName === 'shared' ? Layers : Boxes,
            label: folderName,
            module: folderName,
            subItems: [],
            dropdownclick: function (item) {
                onClickItem(item);
            },
            dropdownMenus,
        };

        // Process each folder's content
        folders[folderName].files.forEach((folder) => {
            // Iterate through the categories (e.g., "dto", "controller") within the folder
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
                    categoryName,
                    categoryName
                );

                categoryMenuItem.dropdownclick = function (item: MenuItem) {
                    onClickItem(item);
                };

                categoryMenuItem.dropdownclick = (item: MenuItem) =>
                    onClickItem(item);
                categoryMenuItem.dropdownMenus = getDropdownMenus(categoryName);

                // Add each file in the category as a sub-item
                categoryMenuItem.subItems = folder[categoryName].map(
                    (file: { name: string; path: string; content: any }) => ({
                        label: file.name,
                        path: file.path,
                        module: folderName,
                        type: categoryName,
                        link: ROUTES.PATH_PAGE_BUILDER_API,
                        subItems: getSubItems(
                            categoryName,
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
                                : [],
                        content: file?.content,
                    })
                );

                // Add the category menu item to the folder's sub-items
                folderMenuItem.subItems!.push(categoryMenuItem);
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
    if (categoryName === OPTION_TYPE.CONTROLLERS && actions) {
        return actions.map((action) => ({
            id: action.actionName,
            label: action.actionName,
            path: path,
            type: OPTION_TYPE.CONTROLLERS,
            subType: OPTION_TYPE.ACTION,
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

export default Navdata;
