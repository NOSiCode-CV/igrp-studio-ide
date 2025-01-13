import { dialog, ipcMain, IpcMainInvokeEvent } from 'electron';
import { join, basename } from 'path';
import { IOpenProject, File, FolderFileStructure, FolderFiles, Handler, ProjectData } from '../types';
import { promisify } from 'util';
const fs = require("fs");

export async function openDirectory(buttonLabel?: string): Promise<IOpenProject> {
	const result = await dialog.showOpenDialog({
		properties: ['openDirectory'],
		buttonLabel: buttonLabel ?? 'Select Destination Folder',
	});

	if (result.canceled) {
		return { canceled: true, folderExists: false };
	}

	const basePath = result.filePaths[0];

	const { folderExists, config } = await checkAndReadBaseApi(basePath);

	return { canceled: false, folderExists, config, basePath };
}

export async function checkAndReadBaseApi(folderPath: string): Promise<{ folderExists: boolean; config?: ProjectData }> {

	const readFile = promisify(fs.readFile);

	const specificFolder = '.igrpstudio';
	const fullFolderPath = join(folderPath, specificFolder);

	const folderExists = fs.existsSync(fullFolderPath);

	let config: ProjectData | undefined = undefined;

	if (folderExists) {

		let baseApiPath = join(fullFolderPath, 'baseApi.json');
		if (!fs.existsSync(baseApiPath)) {
			baseApiPath = join(fullFolderPath, 'baseApp.json');
		}

		try {
			const data = await readFile(baseApiPath, 'utf8');
			const parsedConfig = JSON.parse(data);

			if (baseApiPath.endsWith('baseApi.json')) {
				config = {
					name: parsedConfig.name,
					type: 'backend',
					framework: parsedConfig.type,
					config: { ...parsedConfig },
					path: folderPath
				}
			} else if (baseApiPath.endsWith('baseApp.json')) {
				config = {
					name: parsedConfig.appName,
					type: 'frontend',
					framework: parsedConfig.type,
					config: { ...parsedConfig },
					path: folderPath
				}
			}

		} catch (error) {
			console.error(`Error reading ${baseApiPath}:`, error);
		}
	}

	return { folderExists, config };
}

// Helper function to recursively read files from directories and group them by subfolder
async function readDirectoryFiles(directoryPath: string): Promise<Record<string, File[]>> {
	let groupedFiles: Record<string, File[]> = {};
	const readFile = promisify(fs.readFile);
	try {
		// Read entries in the directory
		const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
		// Process each entry
		for (const entry of entries) {
			const fullPath = join(directoryPath, entry.name);
			if (entry.isDirectory()) {
				// If it's a directory, recursively read its files
				const subFolderFiles = await readDirectoryFiles(fullPath);

				// Group files under their respective subfolder names
				Object.entries(subFolderFiles).forEach(([subfolder, files]) => {
					if (!groupedFiles[subfolder]) {
						groupedFiles[subfolder] = [];
					}
					groupedFiles[subfolder] = groupedFiles[subfolder].concat(files);
				});
			} else {
				// If it's a file, add it to a generic "files" array
				const folderName = basename(directoryPath);
				if (!groupedFiles[folderName]) {
					groupedFiles[folderName] = [];
				}
				const data = await readFile(fullPath, 'utf8');
				const parsedConfig = JSON.parse(data);
				groupedFiles[folderName].push({ name: entry.name.split('.')[0], path: fullPath, content: parsedConfig });
			}
		}
	} catch (error) {
		console.error(`Error reading directory ${directoryPath}:`, error);
	}

	return groupedFiles;
}

// Main function to fetch files from the base directory and group them by subfolder (like dto, controller)
export async function fetchFiles(basePath: string): Promise<FolderFiles> {
	const folders: FolderFiles = {};
	const studioDirectory = join(basePath, '.igrpstudio');

	try {
		// Get all directories inside the .igrpstudio folder
		const entries = await fs.promises.readdir(studioDirectory, { withFileTypes: true });

		// Filter out only directories (not files)
		const directories = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

		// Iterate through each directory
		for (const folder of directories) {
			const directory = join(studioDirectory, folder);
			const folderStructure: FolderFileStructure = { name: folder, path: directory, files: [] };

			try {

				if (fs.existsSync(directory)) {
					// Check if the directory contains files or subdirectories
					const directoryContents = await fs.promises.readdir(directory, { withFileTypes: true });

					let isDirectory: boolean = false

					for (const entry of directoryContents) {

						isDirectory = entry.isDirectory()

						const fullPath = join(directory, entry.name);
						// If the directory contains any files or subdirectories, process them
						if (isDirectory) {

							// Call a function to handle the files and subdirectories
							const groupedFiles = await readDirectoryFiles(fullPath);

							folderStructure.files.push(groupedFiles);

						} else {


							let groupedFiles: Record<string, File[]> = {};
							let name = entry.name.split('.')[0]

							if (name.toLowerCase() !== 'module') {
								if (!groupedFiles[name]) {
									groupedFiles[name] = [];
								}

								groupedFiles[name].push({ name, path: fullPath });

								folderStructure.files.push(groupedFiles);
							}

						}

					}
					folders[folder] = folderStructure;
				} else {
					console.error(`Directory does not exist: ${directory}`);
				}
			} catch (error) {
				console.error(`Error reading directory ${directory}:`, error);
			}
		}
	} catch (error) {
		console.error(`Error reading base directory ${studioDirectory}:`, error);
	}

	return folders;
}

export async function getJsonContent(filePath: string): Promise<any> {
	try {
		const jsonData = fs.readFileSync(filePath, 'utf-8');
		return JSON.parse(jsonData);
	} catch (err) {
		console.error('Error reading JSON file:', err);
		return null;
	}
}

export function addNumbers(a: number, b: number) {
	return a + b;
}

export const handleWithCustomErrors = (channel: string, handler: Handler) => {
	ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...args: any[]) => {
		try {
			return { result: await Promise.resolve(handler(event, ...args)) }
		} catch (e) {
			return { error: e }
		}
	})
}