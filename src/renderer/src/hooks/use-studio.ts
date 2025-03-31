import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { FileTree } from 'src/main/types';

interface RootState {
    PageBuilder: {
        filesThree: FileTree[];
        basePath: string;
    };
}

const selectState = (state: RootState) => state.PageBuilder;
const selectProperties = createSelector(selectState, (studio) => ({
    files: studio.filesThree ?? [],
    basePath: studio.basePath,
}));

const useStudio = () => {
    const { files, basePath } = useSelector(selectProperties);

    // Fetch components from the files tree
    const fetchComponents = useCallback(() => {
        const componentsFolder = files.find((page) => page.name === 'components');
        return componentsFolder?.children ?? [];
    }, [files]);

    // Dynamically import a component by name
    const dynamicImport = useCallback(async (componentName: string) => {
        try {
            const module = await import(`../generators/ui/types/components/${componentName}`);
            return module.default;
        } catch (error) {
            const fallbackModule = await import(`@renderer/generators/ui/types/CardComponent`);
            return fallbackModule.default;
        }
    }, []);

    // Get component data from a JSON file
    const getComponentData = useCallback(async (componentName: string) => {
        try {
            const data = await window.api.getJsonContent(
                `${basePath}/.igrpstudio/components/${componentName}.json`
            );
            return data;
        } catch (error) {
            console.error('Failed to load JSON content:', error);
            return null;
        }
    }, [basePath]);

    // Get page data by component name
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
    }, [files]);

    // Get all registered components
    const getRegistryComponent = useCallback(async () => {
        const { result } = await window.engine.getComponent(ENV_TYPES.NEXTJS);
        return result.components;
    }, []);

    // Helper function to find a component by name or within a parent's acceptedChildren
    const findComponent = useCallback(
        async (path: string | undefined, componentName: string) => {
            if (!componentName) return null;

            const { result } = await window.engine.getComponent(ENV_TYPES.NEXTJS);

            // If no path is provided, search for the component directly by name

            let component: ComponentRegisterConfig | null = result.components.find((comp: ComponentRegisterConfig) => comp.name === componentName) || null;

            if (path && !component) {
                // Split the path into parts (e.g., "table/tableColumns/tableTextCell" => ["table", "tableColumns", "tableTextCell"])
                const pathParts = path.split('/');

                // Start searching from the root level
                let currentComponents = result.components;

                for (let i = 0; i < pathParts.length; i++) {
                    const currentPathPart = pathParts[i];

                    // Find the parent component at the current level
                    const parentComponent = currentComponents.find((comp: ComponentRegisterConfig) => comp.name === currentPathPart);

                    if (!parentComponent) {
                        // If the parent component or its children are not found, stop searching
                        return null;
                    }

                    // Move to the next level in the hierarchy
                    currentComponents = parentComponent.acceptedChildren;

                    // If this is the last part of the path, search for the component by name
                    if (i === pathParts.length - 1) {
                        component = currentComponents.find((comp: ComponentRegisterConfig) => comp.name === componentName) || null;
                    }
                }
            }
            return component;
        },
        []
    );

    // Get accepted children for a component
    const getAcceptedChildren = useCallback(async (path: string | undefined, componentName: string) => {
        const component = await findComponent(path, componentName);
        return component ? component.acceptedChildren : [];
    }, [findComponent]);

    // Get properties for a component
    const getPropertiesComponent = useCallback(async (path: string | undefined, componentName: string) => {
        const component = await findComponent(path, componentName);
        return component ? component.properties : [];
    }, [findComponent]);

    // Get properties for a component
    const getInteractionsComponent = useCallback(async (path: string | undefined, componentName: string) => {
        const component = await findComponent(path, componentName);
        return component ? component.interactions : [];
    }, [findComponent]);

    return {
        basePath,
        getAcceptedChildren,
        getPropertiesComponent,
        getRegistryComponent,
        getInteractionsComponent,
        getComponentData,
        getPageData,
        fetchComponents,
        dynamicImport,
    };
};

export default useStudio;