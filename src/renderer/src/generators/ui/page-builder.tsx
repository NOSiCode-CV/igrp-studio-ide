import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from 'react';

import { useConfigdata } from './hooks/useConfigData';
import useToast from '@renderer/hooks/useToast';
import { CodeContentJson, CodeContentTS } from './components/CodeContent';

import { AppSidebar } from '@renderer/generators/ui/components/sidebar/sidebar-left';
import { SidebarInset } from '@renderer/components/ui/sidebar';
import { DragEndResult } from '@renderer/lib/dnd/types';
import { useDroppedComponents } from './dnd/DroppedComponentsContext';
import { APRESENTATION } from '@renderer/constants/appConstants';
import RENDERER_CONFIG from '@renderer/renderer.config';
import { ContainerScrollArea } from '../api/components/ContainerScrollArea';
import { useTagManager } from './hooks/useTagManager';
import useStudio from '@renderer/hooks/use-studio';
import useCustomCode from './hooks/useCustomCode';

import { PageDefinition } from './page/page-manager';
import IGRPStudioMainComponent from './types/components/MainComponent';
import SidebarRight from './components/sidebar/sidebar-right';
import { handleDragEnd } from './dnd/DraggableItemManager';
import Loader from '@renderer/components/loader';

// Custom hooks for better organization
import { useComponentRegistration } from './hooks/useComponentRegistration';
import { useComponentInitialization } from './hooks/useComponentInitialization';
import { usePageSave } from './hooks/usePageSave';

interface PageBuilderProps {
    basePath: string;
    page: PageDefinition;
    activePresentation: string;
    onSave: () => void;
}

interface PageBuilderRef {
    handleSave: () => void;
}

const PageBuilder = forwardRef<PageBuilderRef, PageBuilderProps>(
    ({ basePath, page, activePresentation }, ref) => {
        const { id, content, path: pagePath } = page;
        const isPage = content?.type === 'page';

        // Custom hooks for better separation of concerns
        const {
            components,
            types,
            functions,
            states,
            imports,
            setAllImports,
            setAllTypes,
            setAllFunctions,
            setAllComponents,
            setAllStates,
            setAllArguments,
            handleAddChildToComponent,
            handleReorderChildInComponent,
            removeRow,
            clearEditingComponent,
            currentComponent,
        } = useDroppedComponents();

        const {
            componentsRegistered,
            findComponentById,
            fetchComponents,
            findComponent,
        } = useStudio();

        const { customComponents } = useCustomCode();
        const { menuItems } = useConfigdata(componentsRegistered);
        const { rebuild, generateTag } = useTagManager(components);
        // Temporary: Back to original implementation to identify the issue
        const [isLoading, setIsLoading] = useState<boolean>(false);

        const { showErrorToast } = useToast();

        const { handleSave } = usePageSave({
            basePath,
            content,
            id,
            components,
            functions,
            types,
            states,
            imports,
            isPage,
            page,
        });

        // Expose handleSave to parent via ref
        useImperativeHandle(
            ref,
            () => ({
                handleSave: () => handleSave(components),
            }),
            [handleSave, components]
        );

        // Memoized drag end handler
        const onDragEnd = useCallback(
            async (result: DragEndResult) => {
                const droppedComponentsMethods = {
                    removeRow,
                    handleAddChildToComponent,
                    handleReorderChildInComponent,
                    generateTag,
                    findComponent: async (
                        path: string,
                        componentName: string
                    ) => {
                        const result = await findComponent(path, componentName);
                        return result || undefined;
                    },
                    showErrorToast,
                };

                console.log('Drag end result:', result);
                await handleDragEnd(result, droppedComponentsMethods);
            },
            [
                removeRow,
                handleAddChildToComponent,
                handleReorderChildInComponent,
                generateTag,
                showErrorToast,
                findComponent,
            ]
        );

        // Effects for component lifecycle management
        useEffect(() => {
            clearEditingComponent();
        }, [activePresentation]);

        useComponentRegistration({
            customComponents,
            fetchComponents,
            page,
        });

        const { initializeComponents } = useComponentInitialization({
            content,
            menuItems,
            findComponentById,
            generateTag,
            setAllComponents,
        });

        useEffect(() => {
            const getJsonData = async () => {
                try {
                    if (pagePath === undefined) return;

                    setIsLoading(true);

                    const data = await window.api?.getJsonContent(pagePath);

                    setAllArguments(data.args);

                    if (data.components) {
                        setAllComponents(data.components);
                        setAllTypes(data.types);
                        setAllFunctions(data.functions);
                        setAllStates(data.states);
                        setAllImports(data.imports);
                    }
                } catch (error) {
                    console.error('Failed to load JSON content:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            getJsonData();
        }, [pagePath, page]);

        useEffect(() => {
            if (componentsRegistered.length > 0 && !components.componentName) {
                initializeComponents();
            }
        }, [componentsRegistered]);

        useEffect(() => {
            rebuild();
        }, [components, rebuild]);

        // Memoized render content for better performance
        const renderContent = useMemo(() => {
            if (activePresentation === APRESENTATION.DESIGN) {
                return isLoading ? (
                    <Loader />
                ) : (
                    <IGRPStudioMainComponent
                        component={components ?? []}
                        onDragEnd={onDragEnd}
                    />
                );
            } else if (activePresentation === APRESENTATION.JSON) {
                return (
                    <CodeContentJson
                        components={components}
                        pagePath={pagePath}
                    />
                );
            } else if (activePresentation === APRESENTATION.CODE) {
                // Ensure pagePath is properly formatted and handle spaces
                const cleanPagePath = page.pagePath?.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
                let tsFilePath = null;

                if (isPage)
                    tsFilePath = cleanPagePath
                        ? `${basePath}/${RENDERER_CONFIG.fileSystemPaths.generated}/${cleanPagePath}/page.tsx`
                        : `${basePath}/${RENDERER_CONFIG.fileSystemPaths.generated}/page.tsx`;
                else {
                    const withScopePage = content.scope === 'page';
                    if (withScopePage)
                        tsFilePath = `${basePath}/${RENDERER_CONFIG.fileSystemPaths.generated}/${content.pagePath}/components/${content.name.toLowerCase()}.tsx`;
                    else
                        tsFilePath = `${basePath}/${RENDERER_CONFIG.fileSystemPaths.customComponents}/${content.name.toLowerCase()}.tsx`;
                }

                return <CodeContentTS pagePath={tsFilePath} />;
            } else {
                return isLoading ? (
                    <Loader />
                ) : (
                    <IGRPStudioMainComponent
                        component={components ?? []}
                        onDragEnd={onDragEnd}
                    />
                );
            }
        }, [
            activePresentation,
            isLoading,
            components,
            onDragEnd,
            pagePath,
            basePath,
            page,
        ]);

        return (
            <div className="flex flex-1 overflow-hidden">
                <AppSidebar data={menuItems} basePath={basePath} />
                <SidebarInset>
                    <div className="flex flex-1 flex-col gap-4 p-2">
                        <ContainerScrollArea>
                            {renderContent}
                        </ContainerScrollArea>
                    </div>
                </SidebarInset>
                {currentComponent && <SidebarRight />}
            </div>
        );
    }
);

export default PageBuilder;
