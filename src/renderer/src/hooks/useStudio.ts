import { APP_COMPONENT } from '@renderer/generators/ui/ComponentTypes';
import { ComponentRegistry } from '@renderer/generators/ui/data/ComponentRegistry';
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

    const discoverComponent = useCallback((draggableId: string) => {
        let component = ComponentRegistry[draggableId] || null;

        if (!component) {
            const components = fetchComponents()
            const appComponent = components.find((comp) => comp.content.name === draggableId);
            return appComponent ? ComponentRegistry[APP_COMPONENT] : null
        }
        return component
    }, [])

    return { fetchComponents, discoverComponent };
};

export default useStudio;