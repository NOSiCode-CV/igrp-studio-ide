import { Database, Activity, FileText, Circle, LucideIcon, Zap, TextQuote, FileKey } from 'lucide-react'
import { httpMethods, httpStatusCodes } from '@renderer/constants/appConstants';
import i18next from 'i18next';
import { enUS, pt } from 'date-fns/locale';

export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1)
}

export function filterItems(navData: any, searchQuery: string) {
	return searchQuery
		? navData
			.map((item: any) => {
				const matches =
					item.isHeader || item.label.toLowerCase().includes(searchQuery.toLowerCase())

				return matches ? { ...item } : null
			})
			.filter((item: any) => item !== null)
		: navData
}

export function filterSubItems(navData: any, searchQuery: string) {
	if (!searchQuery) return navData
	return navData
		.map((item: any) => {
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
		.filter((item: any) => item !== null)
}

export function generateRowId() {
	// Generate a random string with 8 characters
	const randomStr = Math.random().toString(36).substring(2, 8)
	return `row-${randomStr}`
}

export function getId() {
	return Math.random().toString(36).slice(2, 12)
}

export function getUUID() {
	return crypto.randomUUID()
}

export function generateId(componentName: string) {
	// Generate a random string with 8 characters
	const randomStr = Math.random().toString(36).slice(2, 8)
	return `${componentName.toLowerCase()}_${randomStr}`
}

export function findComponentItem(menus: Array<any>, idFind: string) {
	return menus.flatMap((menu: any) => menu.subItems || []).find((sub: any) => sub.id === idFind) || null
}

export const getBadgeColor = (method: string): string | undefined => {
	return httpMethods.find((item: any) => item.value === method)?.color;
};


export const getStatusLabel = (statusCode: string): string => {
	const status = httpStatusCodes.find((status) => status.value === statusCode);
	return status ? status.label.replace(`${status.value} `, '') : `Error (${statusCode})`;
};

export const toInitCap = (text: string) => text.replace(/(?:^|\s|-)\S/g, (match) => match.toUpperCase())

export const getIcon = (folderName: string): LucideIcon => {

	if (!folderName || typeof folderName !== 'string') return Circle;

	switch (folderName.toLowerCase()) {
		case 'controllers':
			return Activity;
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

export const getLocale = () => {
	switch (i18next.language) {
		case 'pt':
			return pt;
		default:
			return enUS;
	}
};
