import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { FileTree } from 'src/main/types';

interface RootState {
    PageBuilder: {
        filesThree: FileTree[];
    };
}

const selectState = (state: RootState) => state.PageBuilder;
const selectProperties = createSelector(selectState, (studio) => ({
    files: studio.filesThree ?? [],
}));

const useStudio = () => {
    const { files } = useSelector(selectProperties);

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

    return { fetchComponents, dynamicImport, getConfigComponent };
};

export default useStudio;