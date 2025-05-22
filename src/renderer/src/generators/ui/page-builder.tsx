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
import { SidebarRight } from './components/sidebar/sidebar-right';
import { DragEndResult, StructuredLayout } from '@renderer/lib/dnd/types';
import { handleDragEnd } from './dnd/DraggableItemManager';
import { useDroppedComponents } from './dnd/DroppedComponentsContext';
import { APRESENTATION, ENV_TYPES } from '@renderer/constants/appConstants';
import { useDispatch } from 'react-redux';
import { ContainerScrollArea } from '../api/components/ContainerScrollArea';
import { Page } from './types/components/Page';
import { useTagManager } from './hooks/useTagManager';
import { COMPONENT } from './ComponentTypes';
import { newStructuredComponent } from './dnd/helpers';
import useStudio from '@renderer/hooks/use-studio';

interface FormEngineProps {
    basePath: string;
    page: any;
    activePresentation: string;
    onSave: () => void;
}

interface FormEngineRef {
    handleSave: () => void;
}

const FormEngine = forwardRef<FormEngineRef, FormEngineProps>(
    ({ basePath, page, activePresentation }, ref) => {
        const { id, content, path: pagePath, label } = page;
        const { type, path } = content;

        const {
            handleAddChildToComponent,
            handleReorderChildInComponent,
            removeRow,
            setEditingComponent,
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
        } = useDroppedComponents();

        const { showErrorToast, showSuccessToast } = useToast();

        const { componentsRegistered, findComponentById } = useStudio();

        const { menuItems } = useConfigdata(componentsRegistered);

        const dispatch: any = useDispatch();

        const { rebuild, generateTag } = useTagManager(components);

        const [loading, setLoading] = useState<boolean>(false);

        // Internal handleSave function in FormEngine
        const internalHandleSave = () => {
            handleSave(components);
        };

        // Expose handleSave to parent via ref
        useImperativeHandle(ref, () => ({
            handleSave: internalHandleSave,
        }));

        useEffect(() => {
            clearEditingComponent();
        }, [activePresentation]);

        const handleSave = async (components: StructuredLayout) => {
            try {
                if (basePath === undefined) return;

                const config: any = {
                    id,
                    type,
                    path,
                    components,
                    functions,
                    types,
                    states,
                    imports,
                };

                const pageConfig: PageConfig = {
                    ...config,
                    pageName: label,
                };

                const compConfig: ComponentConfig = {
                    ...config,
                    name: label,
                };

                console.log(type === 'page' ? pageConfig : compConfig);

                const { error } = await window.engine.createPage(
                    type === 'page' ? pageConfig : compConfig,
                    ENV_TYPES.NEXTJS,
                    basePath
                );

                if (error) {
                    console.log(error)
                    showErrorToast(error);
                    return;
                }

                showSuccessToast('Components added successfully');

                dispatch(onSetChangeStatus(true));
            } catch (error) {
                showErrorToast(error);
            }
        };

        useEffect(() => {
            const getJsonData = async () => {
                try {
                    if (pagePath === undefined) return;

                    const data = await window.api.getJsonContent(pagePath);
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
                }
            };
            getJsonData();
        }, [basePath, page]);

        useEffect(() => {
            if (loading) return;

            const pageCompRegister = findComponentById(COMPONENT.PageContent);
            const sectionCompRegister = findComponentById(COMPONENT.Section);

            const section = newStructuredComponent(
                COMPONENT.Section,
                [],
                sectionCompRegister
            );

            const pageContent = newStructuredComponent(
                COMPONENT.PageContent,
                [{ ...section, tag: generateTag(COMPONENT.Section) }],
                pageCompRegister
            );
            setAllComponents({
                ...pageContent,
                tag: generateTag(COMPONENT.PageContent),
            });
        }, [menuItems, loading]);

        useEffect(() => {
            rebuild();
        }, [components, rebuild]);

        const droppedComponentsMethods = {
            setEditingComponent,
            removeRow,
            handleAddChildToComponent,
            handleReorderChildInComponent,
            generateTag,
        };

        const onDragEnd = useCallback((result: DragEndResult) => {
            console.log('dropZone', result);
            handleDragEnd(result, droppedComponentsMethods);
        }, []);

        return (
            <div className="flex flex-1 overflow-hidden">
                <AppSidebar data={menuItems} basePath={basePath} />
                <SidebarInset>
                    <div className="flex flex-1 flex-col gap-4 p-2">
                        <ContainerScrollArea>
                            {activePresentation === APRESENTATION.DESIGN ? (
                                <Page page={components} onDragEnd={onDragEnd} />
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
