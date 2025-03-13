import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
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
        const { result } = await window.engine.getComponent(ENV_TYPES.NEXTJS);
        return result.components;
    }, []);

    // Helper function to find a component by name or within a parent's acceptedChildren
    const findComponent = useCallback(
        async (parentComponentName: string | undefined, componentName: string) => {
            if (!componentName) return null;

            const { result } = await window.engine.getComponent(ENV_TYPES.NEXTJS);

            // First, try to find the component directly by its name
            let component = result.components.find((comp: ComponentRegisterConfig) => comp.name === componentName);

            if (!component && parentComponentName) {
                // If not found, search within the acceptedChildren of the specified parentComponentName
                const parentComponent = result.components.find((comp: ComponentRegisterConfig) => comp.name === parentComponentName);

                if (parentComponent && parentComponent.acceptedChildren) {
                    component = parentComponent.acceptedChildren.find((child: ComponentRegisterConfig) => child.name === componentName);
                }
            }

            return component || null;
        },
        []
    );

    const getAcceptedChildren = useCallback(async (parentComponentName: string, componentName: string) => {
        const component = await findComponent(parentComponentName, componentName);
        return component ? component.acceptedChildren : [];
    }, [findComponent]);

    const getPropertiesComponent = useCallback(async (parentComponentName: string | undefined, componentName: string) => {
        const component = await findComponent(parentComponentName, componentName);
        return component ? component.properties : [];
    }, [findComponent]);

    return { basePath, getAcceptedChildren, getPropertiesComponent, getRegistryComponent, getComponentData, getPageData, fetchComponents, dynamicImport, getConfigComponent };
};

export default useStudio;