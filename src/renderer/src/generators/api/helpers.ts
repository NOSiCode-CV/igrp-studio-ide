import { FormikValues } from 'formik';
import { FileTree } from 'src/main/types';

export function formatMethods(elements: string[]): { label: string; value: string }[] {
	return elements.map((element) => ({
		label: element,
		value: element,
	}));
}

export const addNewRow = (
	formik: FormikValues,
	field: string,
	defaultValue: any
): void => {
	formik.setFieldValue(field, [...formik.values[field], defaultValue]);
};

export const removeRow = (
	formik: FormikValues,
	field: string,
	position: number
): void => {
	formik.setFieldValue(
		field,
		formik.values[field].filter((_: any, index: number) => index !== position)
	);
};

export const changeValue = (
	formik: FormikValues,
	element: string,
	position: number,
	value: any,
	field: string
): void => {
	formik.setFieldValue(
		field,
		formik.values[field].map((row: any, index: number) =>
			index === position ? { ...row, [element]: value } : row
		)
	);
};


export const extractByType = (moduleData: any, type: string) => {
	const files = moduleData?.children ?? [];

	// Encontra o item correspondente ao tipo
	const typeFiles = files.find((item: any) => item.name === type.toLowerCase());

	// Retorna os arquivos do tipo ou um array vazio
	return typeFiles ? typeFiles.children : [];
};
const mergeFilesByType = (files: FileTree[]): FileTree[] => {
	const mergedFilesMap: Record<string, FileTree> = {};

	// Helper function to recursively merge children
	const mergeChildren = (existingChildren: FileTree[], newChildren: FileTree[]): FileTree[] => {
		const childrenMap: Record<string, FileTree> = {};

		// Add existing children to the map
		existingChildren.forEach((child) => {
			childrenMap[child.name] = child;
		});

		// Merge new children into the map
		newChildren.forEach((child) => {
			if (childrenMap[child.name]) {
				// If the child already exists, merge their children recursively
				if (child.children && childrenMap[child.name].children) {
					childrenMap[child.name].children = mergeChildren(
						childrenMap[child.name].children!,
						child.children
					);
				}
			} else {
				// If the child doesn't exist, add it to the map
				childrenMap[child.name] = child;
			}
		});

		// Convert the map back to an array
		return Object.values(childrenMap);
	};

	// Iterate through the input files
	files.forEach((file) => {
		if (mergedFilesMap[file.name]) {
			// If the file/directory already exists, merge their children
			if (file.children && mergedFilesMap[file.name].children) {
				mergedFilesMap[file.name].children = mergeChildren(
					mergedFilesMap[file.name].children!,
					file.children
				);
			}
		} else {
			// If the file/directory doesn't exist, add it to the map
			mergedFilesMap[file.name] = { ...file };
		}
	});

	// Convert the map back to an array
	return Object.values(mergedFilesMap);
};

export const getModulesArray = (filesThree: FileTree[]) => {
	return filesThree
		.filter((item) => item.name !== "shared") // Exclui a pasta "shared"
		.map((item) => ({
			label: item.name,
			value: item.name,
		}));
};

export const getMergedFiles = (studio: any, module: string) => {

	const currentModuleData = studio.filesThree.find((item) => item.name === module) || {};
	const sharedModuleData = studio.filesThree.find((item) => item.name === "shared") || {};

	let mergedFiles: any[] = [];

	if (module !== "shared") {
		const currentFiles = currentModuleData.children || [];
		const sharedFiles = sharedModuleData.children || [];

		// Use a helper function to merge the files by their type (dto, controllers, models)
		mergedFiles = mergeFilesByType([...currentFiles, ...sharedFiles]);
	} else {
		// If the module is "shared", just use its own files
		mergedFiles = sharedModuleData.children || [];
	}

	return { ...currentModuleData, children: mergedFiles };
};