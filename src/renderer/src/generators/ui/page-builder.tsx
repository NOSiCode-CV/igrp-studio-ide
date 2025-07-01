import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react';

import { useConfigdata } from './hooks/useConfigData';
import {
    ComponentConfig,
    PageConfig,
} from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import useToast from '@renderer/hooks/useToast';
import { CodeContentJson, CodeContentTS } from './components/CodeContent';

import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { AppSidebar } from '@renderer/generators/ui/components/sidebar/sidebar-left';
import { SidebarInset } from '@renderer/components/ui/sidebar';
import { DragEndResult, StructuredLayout } from '@renderer/lib/dnd/types';
import { useDroppedComponents } from './dnd/DroppedComponentsContext';
import { APRESENTATION, ENV_TYPES } from '@renderer/constants/appConstants';
import { useDispatch } from 'react-redux';
import { ContainerScrollArea } from '../api/components/ContainerScrollArea';
import { useTagManager } from './hooks/useTagManager';
import { COMPONENT } from './ComponentTypes';
import { newStructuredComponent } from './dnd/helpers';
import useStudio from '@renderer/hooks/use-studio';
import useCustomCode from './hooks/useCustomCode';
import { EngineService } from '@renderer/services/EngineService';
import { PageDefinition } from './page/page-manager';
import IGRPStudioMainComponent from './types/components/MainComponent';
import SidebarRight from './components/sidebar/sidebar-right';
import { handleDragEnd } from './dnd/DraggableItemManager';
import Loader from '@renderer/components/loader';

interface FormEngineProps {
    basePath: string;
    page: PageDefinition;
    activePresentation: string;
    onSave: () => void;
}

interface FormEngineRef {
    handleSave: () => void;
}

const FormEngine = forwardRef<FormEngineRef, FormEngineProps>(
    ({ basePath, page, activePresentation }, ref) => {
        const { id, content, path: pagePath } = page;

        const isPage = content?.type === 'page';

        const {
            handleAddChildToComponent,
            handleReorderChildInComponent,
            removeRow,
            clearEditingComponent,
            currentComponent,
            types,
            functions,
            states,
            components,
            imports,
            setAllImports,
            setAllTypes,
            setAllFunctions,
            setAllComponents,
            setAllStates,
            setAllArguments,
        } = useDroppedComponents();

        const { showErrorToast, showSuccessToast } = useToast();

        const {
            componentsRegistered,
            findComponentById,
            fetchComponents,
            findComponent,
        } = useStudio();

        const { customComponents } = useCustomCode();

        const { menuItems } = useConfigdata(componentsRegistered);

        const dispatch: any = useDispatch();

        const { rebuild, generateTag } = useTagManager(components);

        const [loading, setLoading] = useState<boolean>(false);

        const [isLoading, setIsLoading] = useState<boolean>(false);

        // Internal handleSave function in FormEngine
        const internalHandleSave = () => {
            handleSave(components);
        };

        // Expose handleSave to parent via ref
        useImperativeHandle(ref, () => ({
            handleSave: internalHandleSave,
        }));
        const handleSave = async (components: StructuredLayout) => {
            try {
                if (basePath === undefined) return;

                const config: any = {
                    ...content,
                    id,
                    components,
                    functions,
                    types,
                    states,
                    imports,
                };

                const pageConfig: PageConfig = {
                    ...config,
                };

                const compConfig: ComponentConfig = {
                    ...config,
                };

                console.log(isPage ? pageConfig : compConfig);

                const { error } = await window.engine.createPage(
                    isPage ? pageConfig : compConfig,
                    ENV_TYPES.NEXTJS,
                    basePath
                );

                if (error) {
                    console.log(error);
                    showErrorToast(error);
                    return;
                }

                showSuccessToast('Components added successfully');

                dispatch(onSetChangeStatus(true));
            } catch (error) {
                showErrorToast(error);
            }
        };

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

                console.log('dropZone', result);
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

        useEffect(() => {
            clearEditingComponent();
        }, [activePresentation]);

        useEffect(() => {
            const appComponents = fetchComponents();

            const registerComponents = () => {
                EngineService.registerComponent({
                    customComponents,
                    appComponents,
                    currentPage: page.pageName,
                });
            };

            registerComponents();

            window.electron.ipcRenderer.on('folder-change', registerComponents);

            return () => {
                window.electron.ipcRenderer.removeListener(
                    'folder-change',
                    registerComponents
                );
            };
        }, [customComponents]);

        useEffect(() => {
            const getJsonData = async () => {
                try {
                    if (pagePath === undefined) return;

                    setIsLoading(true);

                    const data = await window.api.getJsonContent(pagePath);

                    setAllArguments(data.args);

                    if (data.components) {
                        setLoading(true);
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
            if (loading) return;

            const mainComponent = isPage
                ? COMPONENT.PageContent
                : COMPONENT.ComponentContent;

            const initializeComponents = async () => {
                const pageCompRegister = await findComponentById(mainComponent);
                const sectionCompRegister = await findComponentById(
                    COMPONENT.Section
                );

                const section = newStructuredComponent(
                    COMPONENT.Section,
                    [],
                    sectionCompRegister
                );

                const pageContent = newStructuredComponent(
                    mainComponent,
                    isPage
                        ? [{ ...section, tag: generateTag(COMPONENT.Section) }]
                        : [],
                    pageCompRegister
                );

                setAllComponents({
                    ...pageContent,
                    tag: generateTag(mainComponent),
                });
            };

            initializeComponents();
        }, [menuItems, loading, isPage]);

        useEffect(() => {
            rebuild();
        }, [components, rebuild]);

        return (
            <div className="flex flex-1 overflow-hidden">
                <AppSidebar data={menuItems} basePath={basePath} />
                <SidebarInset>
                    <div className="flex flex-1 flex-col gap-4 p-2">
                        <ContainerScrollArea>
                            {activePresentation === APRESENTATION.DESIGN ? (
                                isLoading ? (
                                    <Loader />
                                ) : (
                                    <IGRPStudioMainComponent
                                        component={components ?? []}
                                        onDragEnd={onDragEnd}
                                    />
                                )
                            ) : activePresentation === APRESENTATION.JSON ? (
                                <CodeContentJson
                                    components={components}
                                    pagePath={pagePath}
                                />
                            ) : (
                                <CodeContentTS
                                    pagePath={`${basePath}/src/app/(generated)/${page.pagePath}/page.tsx`}
                                />
                            )}
                        </ContainerScrollArea>
                    </div>
                </SidebarInset>
                {currentComponent && <SidebarRight />}
            </div>
        );
    }
);
export default FormEngine;
