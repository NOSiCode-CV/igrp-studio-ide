import { fetchFiles } from '../src/main/helpers';
import { join } from 'path';
import fs from 'fs';

describe('fetchFiles', () => {
    const basePath = '///Users/carlosgraca/Projects/nosi/TesteApps/AlphThree';
    const studioDirectory = join(basePath, '.igrpstudio');

    it('should read files from an existing directory', async () => {
        const result = await fetchFiles(basePath);
        console.log(result)
        expect(result).not.toEqual({});
    });
});

