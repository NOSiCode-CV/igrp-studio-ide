import { ENV_TYPES } from '@renderer/constants/appConstants';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { FileTree } from 'src/main/types';

interface RootState {
    PageBuilder: {
        filesThree: FileTree[];
        basePath: string
    };
}

const selectState = (state: RootState) => state.PageBuilder;
const selectProperties = createSelector(selectState, (studio) => ({
    files: studio.filesThree ?? [],
    basePath: studio.basePath,
}));

const useStudio = () => {
    const { files, basePath } = useSelector(selectProperties);

    const fetchComponents = useCallback(() => {
        const componentsFolder = files.find((page) => page.name === 'components');
        return componentsFolder?.children ?? [];
    }, [files]);

    const dynamicImport = useCallback(async (componentName: string) => {
        try {
            const module = await import(`../generators/ui/types/components/${componentName}`);
            return module.default;
        } catch (error) {
            const fallbackModule = await import(`@renderer/generators/ui/types/CardComponent`);
            return fallbackModule.default;
        }
    }, []);

    const getConfigComponent = useCallback(async (componentName: string) => {
        try {
            const module = await import(`../generators/ui/types/properties/${componentName}Properties`);
            return module.default;
        } catch (error) {
            return null;
        }
    }, []);

    const getComponentData = useCallback(async (componentName: string) => {
        try {
            const data = await window.api.getJsonContent(
                `${basePath}/.igrpstudio/components/${componentName}.json`
            );
            return data
        } catch (error) {
            console.error('Failed to load JSON content:', error);
        }
    }, []);

    const getPageData = useCallback(async (componentName: string) => {
        try {
            const components = files.find((page) => page.name === 'components');

            if (!components || !components.children) {
                return null;
            }

            const filteredPages = components.children.filter((page) =>
                page.content.name.includes(componentName)
            );

            return filteredPages[0] || null;
        } catch (error) {
            console.error('Failed to load JSON content:', error);
            return null;
        }
    }, []);

    const getRegistryComponent = useCallback(async () => {
        const { result, error } = await window.engine.getComponent(ENV_TYPES.NEXTJS)
        return result.components
    }, [])

    const getPropertiesComponent = useCallback(async (componentName: string) => {
        const { result, error } = await window.engine.getComponent(ENV_TYPES.NEXTJS)
        const component = result.components.filter((comp) => comp.name === componentName)
        console.log(component)
        return component && component[0].properties;
    }, [])

    return { basePath, getPropertiesComponent, getRegistryComponent, getComponentData, getPageData, fetchComponents, dynamicImport, getConfigComponent };
};

export default useStudio;