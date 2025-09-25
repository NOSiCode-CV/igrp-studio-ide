import { OPTION_TYPE } from '@renderer/constants/appConstants';
import {
    extractByType,
    getMergedFiles,
    getModulesArray,
} from '@renderer/generators/api/helpers';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { FileTree, ProjectData } from 'src/main/types';

interface RootState {
    PageBuilder: {
        filesThree: FileTree[];
        basePath: string;
        config: ProjectData;
        currentItem: any;
        changeStatus: boolean;
    };
}

const selectState = (state: RootState) => state.PageBuilder;

// Create a selector factory that accepts `module` as a parameter
const makeSelectProperties = (module?: string) =>
    createSelector(selectState, (studio) => {
        const moduleData = getMergedFiles(studio, module || 'shared');

        return {
            basePath: studio.basePath,
            config: studio.config,
            models: extractByType(moduleData, OPTION_TYPE.MODELS),
            dto: extractByType(moduleData, OPTION_TYPE.DATA_OBJECTS),
            controllers: extractByType(moduleData, OPTION_TYPE.CONTROLLERS),
            responses: extractByType(moduleData, OPTION_TYPE.RESPONSES),
            enums: extractByType(moduleData, OPTION_TYPE.ENUM),
            permissions: extractByType(moduleData, OPTION_TYPE.PERMISSIONS),
            modules: getModulesArray(studio.filesThree),
            filesThree: studio.filesThree,
            currentItem: studio.currentItem,
            changeStatus: studio.changeStatus,
        };
    });

// Update the hook to accept `module` as a parameter
const useStudioAPI = (module?: string) => {
    const selectProperties = useMemo(
        () => makeSelectProperties(module),
        [module]
    );

    const {
        basePath,
        config,
        models,
        dto,
        modules,
        responses,
        enums,
        permissions,
        filesThree,
        currentItem,
        changeStatus,
    } = useSelector(selectProperties);

    const find = (data: any[], name: string) => {
        return data.find((item) => item.name === name);
    };

    const findModelsByName = (name: string) => {
        return find(models, `${name}.json`);
    };

    const getJsonData = useCallback(async (path: string) => {
        try {
            return await window.api.getJsonContent(path);
        } catch (error) {
            console.error('Failed to load JSON content:', error);
        }
    }, []);

    return {
        basePath,
        config,
        models,
        dto,
        modules,
        responses,
        enums,
        permissions,
        filesThree,
        currentItem,
        changeStatus,
        findModelsByName,
        getJsonData,
    };
};

export default useStudioAPI;
