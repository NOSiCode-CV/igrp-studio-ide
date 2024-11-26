import { FolderFiles, MenuItem } from 'src/main/types'
import { faker } from '@faker-js/faker'
import { ROUTES } from '@renderer/routes/routeConstants'
import { Command, Database, Folder, Puzzle } from 'lucide-react'


// Function to convert folders into menuItems
export function generateMenuItems(folders: FolderFiles, dispatch): MenuItem[] {
	const menuItems: MenuItem[] = [];

	// Iterate through each folder in the folders object
	Object.keys(folders).forEach((folderName: string) => {
		// Create a folder menu item as a header
		const folderMenuItem: MenuItem = {
			label: folderName,
			subItems: [],
			isHeader: true,
			
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
				}));

				// Add the category menu item to the folder's sub-items
				folderMenuItem.subItems!.push(categoryMenuItem);
			});
		});

		// Add the folder's menu item to the main menu items
		menuItems.push(folderMenuItem);
	});

	return menuItems;
}

export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1)
}

export function createMenuHeader(label: string, folderName?: string): MenuItem {
	const icon = folderName
		? (() => {
			switch (folderName.toLowerCase()) {
				case 'controllers':
					return Command
				case 'models':
					return Database
				case 'dto':
					return Puzzle
				default:
					return Folder // Default icon for other folders
			}
		})()
		: ''

	return {
		label,
		id: folderName ? capitalize(folderName) : undefined,
		icon,
		link: ROUTES.PATH_PAGE_BUILDER_API,
		type: folderName || undefined,
		isHeader: false,
		subItems: []
	}
}

export function createSubMenuItems(files: any, folderName: string): MenuItem[] {
	return files.map((file) => ({
		id: file.name,
		label: file.name,
		link: ROUTES.PATH_PAGE_BUILDER_API,
		path: file.path,
		type: folderName,
		icon: ''
	}))
}

export function filterItems(navData: any, searchQuery: string) {
	return searchQuery
		? navData
			.map((item) => {
				const matches =
					item.isHeader || item.label.toLowerCase().includes(searchQuery.toLowerCase())

				return matches ? { ...item } : null
			})
			.filter((item) => item !== null)
		: navData
}

export function filterSubItems(navData: any, searchQuery: string) {
	if (!searchQuery) return navData
	return navData
		.map((item) => {
			const filteredSubItems = item?.subItems
				? item.subItems.filter((subItem: any) =>
					subItem.label.toLowerCase().includes(searchQuery.toLowerCase())
				)
				: []

			if (item.isHeader || filteredSubItems.length > 0) {
				return {
					...item,
					subItems: filteredSubItems
				}
			}

			return null
		})
		.filter((item) => item !== null)
}

export function generateRowId() {
	// Generate a random string with 8 characters
	const randomStr = Math.random().toString(36).substr(2, 8)
	return `row-${randomStr}`
}

export function generateId(componentName: string) {
	// Generate a random string with 8 characters
	const randomStr = Math.random().toString(36).slice(2, 8)
	return `${componentName.toLowerCase()}_${randomStr}`
}

export function findComponentItem(menus: Array<any>, idFind: string) {
	return menus.flatMap((menu) => menu.subItems || []).find((sub) => sub.id === idFind) || null
}

export const generateFakeDataForField = (field: any) => {
	switch (field.config.type) {
		case 'text':
			return faker.lorem.words(3)
		case 'number':
			return faker.number.int({ min: 1, max: 100 })
		case 'date':
			return faker.date.past().toLocaleDateString() // or use any other date format
		case 'boolean':
			return faker.datatype.boolean()
		case 'email':
			return faker.internet.email()
		// Add more cases for different field types as needed
		default:
			return faker.lorem.words(3) // Fallback to text if type is unknown
	}
}
