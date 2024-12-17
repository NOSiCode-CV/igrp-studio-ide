import { OptionType } from '@renderer/constants/appConstants';
import { FormikValues } from 'formik';

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


export const extractByType = (moduleData: any, type: OptionType) => {

	const files = moduleData?.files ?? [];

	return files.find((item: any) => item[type])?.[type] ?? [];
};

// Helper function to merge files by their type (dto, controllers, models)
export const mergeFilesByType = (files: any[]) => {
	const mergedFiles: any[] = [];

	files.forEach((item: any) => {
		Object.keys(item).forEach((key) => {
			// Check if the type already exists in mergedFiles
			const existingItem = mergedFiles.find((mergedItem) => mergedItem[key]);

			if (existingItem) {
				// If the type exists, add the new files to it
				existingItem[key] = [...existingItem[key], ...item[key]];
			} else {
				// If the type doesn't exist, create a new entry
				mergedFiles.push({ [key]: item[key] });
			}
		});
	});

	return mergedFiles;
};

export const getMergedFiles = (studio: any, module: string) => {

	const currentModuleData = studio.folderFiles[module] || {};
	const sharedModuleData = studio.folderFiles["shared"] || {};

	let mergedFiles: any[] = [];
	
	if (module !== "shared") {

		const currentFiles = currentModuleData.files || [];
		const sharedFiles = sharedModuleData.files || [];

		// Use a helper function to merge the files by their type (dto, controllers, models)
		mergedFiles = mergeFilesByType([...currentFiles, ...sharedFiles]);

	} else {
		// If the module is "shared", just use its own files
		mergedFiles = sharedModuleData.files || [];
	}

	return { ...currentModuleData, files: mergedFiles };
};