import React from "react";
import { useDispatch } from "react-redux";
import { setCurrentItem as onSetCurrentItem } from "@renderer/redux/thunks";
import { createMenuHeader } from "@renderer/utils/helpers";
import { MenuItem } from "src/main/types";

const Navdata = (folders) => {

    const dispatch: any = useDispatch()

    const menuItems: MenuItem[] = [];

	// Iterate through each folder in the folders object
	Object.keys(folders).forEach((folderName: string) => {
		// Create a folder menu item as a header
		const folderMenuItem: MenuItem = {
			label: folderName,
			subItems: [],
			isHeader: true,
            dropdownclick: function (item) {
                dispatch(onSetCurrentItem(item))
            },
			dropdownMenus: [
				{
					label: 'dto',
					type: "dto"
				},
				{
					label: 'models',
					type: "models"
				},
				{
					label: 'controllers',
					type: "controllers"
				}
			]
		};

		// Process each folder's content
		folders[folderName].files.forEach((folder) => {
			// Iterate through the categories (e.g., "dto", "controller") within the folder
			Object.keys(folder).forEach((categoryName: string) => {
				// Create a category menu item
				const categoryMenuItem: MenuItem = createMenuHeader(categoryName, categoryName);

				// Add each file in the category as a sub-item
				categoryMenuItem.subItems = folder[categoryName].map((file: { name: string; path: string }) => ({
					label: file.name,
					path: file.path,
					module: folderName,
					type: categoryName,
					click: function (subItem) {
						dispatch(onSetCurrentItem(subItem))
					},
				}));

				// Add the category menu item to the folder's sub-items
				folderMenuItem.subItems!.push(categoryMenuItem);
			});
		});

		// Add the folder's menu item to the main menu items
		menuItems.push(folderMenuItem);
	});

    return {menuItems}
};

export default Navdata;

