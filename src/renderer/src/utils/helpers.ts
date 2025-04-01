import { MenuItem } from 'src/main/types'
import { faker } from '@faker-js/faker'
import { ROUTES } from '@renderer/routes/routeConstants'
import { Database, FileCode, FileText, Circle, LucideIcon, Zap, TextQuote, FileKey } from 'lucide-react'
import { httpMethods, httpStatusCodes } from '@renderer/constants/appConstants';
import { v4 as uuidv4 } from 'uuid';

export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1)
}

export function createMenuHeader(label: string, folderName: string): MenuItem {
	const icon = getIcon(folderName);

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

export function getId() {
	return Math.random().toString(36).slice(2, 12)
}

export function getUUID() {
	return uuidv4()
}

export function generateId(componentName: string) {
	// Generate a random string with 8 characters
	const randomStr = Math.random().toString(36).slice(2, 8)
	return `${componentName.toLowerCase()}_${randomStr}`
}

export function findComponentItem(menus: Array<any>, idFind: string) {
	return menus.flatMap((menu) => menu.subItems || []).find((sub) => sub.id === idFind) || null
}

// Function to generate fake data for a field based on its type
export const generateFakeDataForField = (properties: any) => {
	const { type } = properties;
	switch (type) {
		case 'text':
			return faker.lorem.words(3);
		case 'number':
			return faker.number.int({ min: 1, max: 100 });
		case 'date':
			return faker.date.past().toLocaleDateString(); // or use any other date format
		case 'boolean':
			return faker.datatype.boolean();
		case 'email':
			return faker.internet.email();
		// Add more cases for different field types as needed
		default:
			return faker.lorem.words(2); // Fallback to text if type is unknown
	}
};

export const getBadgeColor = (method: string): string | undefined => {
	return httpMethods.find((item) => item.value === method)?.color;
};


export const getStatusLabel = (statusCode: string): string => {
	const status = httpStatusCodes.find((status) => status.value === statusCode);
	return status ? status.label.replace(`${status.value} `, '') : `Error (${statusCode})`;
};

export const toInitCap = (text: string) => text.replace(/(?:^|\s|-)\S/g, (match) => match.toUpperCase())

export const getIcon = (folderName: string): LucideIcon => {
	if (!folderName) return Circle
	switch (folderName.toLowerCase()) {
		case 'controllers':
			return FileCode;
		case 'models':
			return Database;
		case 'dto':
			return FileText;
		case 'action':
			return Zap;
		case 'responses':
			return TextQuote;
		case 'permissions':
			return FileKey;
		default:
			return Circle;
	}
};


export function toFullCamelCaseFromSnakeCase(str: string) {
	if (!str) return '';

	return capitalize(str
		.toLowerCase()
		.split('_')
		.map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
		.join(''));
}

export function getLabel(name: string): string {
	if (!name) return ''; // Handle empty string

	// Split on hyphens or uppercase letters
	const parts = name
		.replace(/([A-Z])/g, ' $1') // Add a space before uppercase letters
		.split(/[- ]+/); // Split on hyphens or spaces

	// Capitalize the first letter of each part and join with spaces
	return parts
		.filter((part) => part.length > 0) // Remove empty parts
		.map(
			(part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
		)
		.join(' ');
}