import { dialog } from 'electron';
import { join } from 'path';
import { ConfigOptions, IOpenProject, FolderFiles, File } from '../types';
import { promisify } from 'util';
const fs = require("fs");

const readFile = promisify(fs.readFile);

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

export async function checkAndReadBaseApi(folderPath: string): Promise<{ folderExists: boolean; config?: ConfigOptions }> {
	const specificFolder = '.igrpstudio';
	const fullFolderPath = join(folderPath, specificFolder);

	const folderExists = fs.existsSync(fullFolderPath);

	let config: ConfigOptions | undefined = undefined;

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
					type: parsedConfig.type,
					name: parsedConfig.apiName,
					group: parsedConfig.group,
					artifact: parsedConfig.artifact,
					database: parsedConfig.database,
					description: parsedConfig.description,
					package: parsedConfig.package,
				}
			} else if (baseApiPath.endsWith('baseApp.json')) {
				config = {
					type: parsedConfig.type,
					name: parsedConfig.appName,
				}
			}

			console.log('API ConfigOptions:', config);
		} catch (error) {
			console.error(`Error reading ${baseApiPath}:`, error);
		}
	}

	return { folderExists, config };
}

export async function fetchFiles(basePath: string): Promise<FolderFiles> {

	const folders: FolderFiles = {};
	const studioDirectory = join(basePath, '.igrpstudio');

	try {
		// Get all directories inside the .igrpstudio folder
		const entries = await fs.promises.readdir(studioDirectory, { withFileTypes: true });

		// Filter out only directories (not files)
		const directories = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

		for (const folder of directories) {

			const directory = join(studioDirectory, folder);

			try {

				if (fs.existsSync(directory)) {

					// Read all files within the directory
					let files: Array<File> = await readFiles(directory);

					// Add the folder and its files to the result object
					folders[folder] = files;
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

async function readFiles(directory: string): Promise<Array<File>> {

	let files: Array<File> = [];

	try {
		await fs.accessSync(directory);

		// Read all files in the directory
		const _files = await fs.readdirSync(directory);

		// Filter JSON files and extract their names
		const jsonFiles = _files.filter(file => file.endsWith('.json'));
		const names = jsonFiles.map(file => file.replace('.json', ''));

		// Assuming you want to return an array of PageConfig objects
		files = names.map(name => ({
			name: name,
			path: join(directory, name + '.json')
		}));

	} catch (error) {
		console.error('Error reading directory:', error);
	}

	return files;
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