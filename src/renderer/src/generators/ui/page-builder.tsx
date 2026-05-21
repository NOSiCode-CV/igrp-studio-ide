import { SidebarInset } from '@renderer/components/ui/sidebar'
import Loader from '@renderer/components/loader'
import { APRESENTATION } from '@renderer/constants/appConstants'
import { AppSidebar } from '@renderer/generators/ui/components/sidebar/sidebar-left'
import useStudio from '@renderer/hooks/use-studio'
import useToast from '@renderer/hooks/useToast'
import type { DragEndResult } from '@renderer/lib/dnd/types'
import RENDERER_CONFIG from '@renderer/renderer.config'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { ContainerScrollArea } from '../api/components/ContainerScrollArea'
import { CodeContentJson, CodeContentTS } from './components/CodeContent'
import { handleDragEnd } from './dnd/DraggableItemManager'
import { useDroppedComponents } from './contexts/EditorContext'
import { useComponentInitialization } from './hooks/useComponentInitialization'
// Custom hooks for better organization
import { useComponentRegistration } from './hooks/useComponentRegistration'
import { useConfigdata } from './hooks/useConfigData'
import useCustomCode from './hooks/useCustomCode'
import { usePageSave } from './hooks/usePageSave'
import { useTagManager } from './hooks/useTagManager'
import type { PageDefinition } from './browser/page-manager'
import IGRPStudioMainComponent from './renderers/components/MainComponent'

interface PageBuilderProps {
    basePath: string
    page: PageDefinition
    activePresentation: string
    onSave: () => Promise<void>
}

interface PageBuilderRef {
    handleSave: () => Promise<void>
}

const PageBuilder = forwardRef<PageBuilderRef, PageBuilderProps>(
    ({ basePath, page, activePresentation }, ref) => {
        const { id, content, path: pagePath } = page
        const isPage = content?.type === 'page'
        const isProcessStep = content?.type === 'processStep'

        // Custom hooks for better separation of concerns
        const {
            components,
            types,
            functions,
            states,
            imports,
            componentArguments,
            setAllImports,
            setAllTypes,
            setAllFunctions,
            setAllComponents,
            setAllStates,
            setAllArguments,
            setAllRestData,
            handleAddChildToComponent,
            handleReorderChildInComponent,
            removeRow,
            clearEditingComponent,
            restData
        } = useDroppedComponents()

        const { componentsRegistered, findComponentById, fetchComponents, findComponent } =
            useStudio()

        const { customComponents } = useCustomCode()
        const { menuItems } = useConfigdata(componentsRegistered)
        const { rebuild, generateTag } = useTagManager(components)
        // Temporary: Back to original implementation to identify the issue
        const [isLoading, setIsLoading] = useState<boolean>(false)

        const { showErrorToast } = useToast()

        const { handleSave } = usePageSave({
            basePath,
            restData: {
                ...restData, // tudo o que já está em restData no context
                args: componentArguments,
                id,
                components,
                functions,
                types,
                states,
                imports
            },
            isPage,
            page
        })

        // Expose handleSave to parent via ref
        useImperativeHandle(
            ref,
            () => ({
                handleSave: async () => await handleSave()
            }),
            [handleSave, components]
        )

        // Memoized drag end handler
        const onDragEnd = useCallback(
            async (result: DragEndResult) => {
                const droppedComponentsMethods = {
                    removeRow,
                    handleAddChildToComponent,
                    handleReorderChildInComponent,
                    generateTag,
                    findComponent,
                    showErrorToast
                }

                await handleDragEnd(result, droppedComponentsMethods)
            },
            [
                removeRow,
                handleAddChildToComponent,
                handleReorderChildInComponent,
                generateTag,
                showErrorToast,
                findComponent
            ]
        )

        useComponentRegistration({
            customComponents,
            fetchComponents,
            page
        })

        const { initializeComponents } = useComponentInitialization({
            content,
            menuItems,
            findComponentById,
            generateTag,
            setAllComponents,
            findComponent
        })

        // Effects for component lifecycle management
        useEffect(() => {
            clearEditingComponent()
        }, [activePresentation])

        useEffect(() => {
            const getJsonData = async (): Promise<void> => {
                try {
                    if (pagePath === undefined) return

                    setIsLoading(true)

                    const data = await window.api?.getJsonContent(pagePath)
                    const { components, args, types, functions, states, imports, ...rest } = data

                    setAllArguments(args)
                    setAllTypes(types)
                    setAllFunctions(functions)
                    setAllStates(states)
                    setAllImports(imports)
                    setAllRestData(rest)

                    if (components) setAllComponents(components)
                } catch (error) {
                    console.error('Failed to load JSON content:', error)
                } finally {
                    setIsLoading(false)
                }
            }
            getJsonData()
        }, [pagePath, page])

        useEffect(() => {
            if (componentsRegistered.length > 0 && !components.componentName) {
                initializeComponents()
            }
        }, [componentsRegistered])

        useEffect(() => {
            rebuild()
        }, [components, rebuild])

        // Memoized render content for better performance
        const renderContent = useMemo(() => {
            if (activePresentation === APRESENTATION.DESIGN) {
                return isLoading ? (
                    <Loader />
                ) : (
                    <IGRPStudioMainComponent component={components ?? []} onDragEnd={onDragEnd} />
                )
            } else if (activePresentation === APRESENTATION.JSON) {
                return <CodeContentJson components={components} pagePath={pagePath} />
            } else if (activePresentation === APRESENTATION.CODE) {
                // Ensure pagePath is properly formatted and handle spaces
                const cleanPagePath = page.pagePath?.replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
                let tsFilePath: string | null = null

                if (isPage)
                    tsFilePath = cleanPagePath
                        ? `${basePath}/${RENDERER_CONFIG.fileSystemPaths.generated}/${cleanPagePath}/page.tsx`
                        : `${basePath}/${RENDERER_CONFIG.fileSystemPaths.generated}/page.tsx`
                else if (isProcessStep)
                    tsFilePath = `${basePath}/${RENDERER_CONFIG.fileSystemPaths.processes}/[...process]/(${content.processKey})/${content.processVersion}/${content.name.toLowerCase()}.tsx`
                else {
                    const withScopePage = content.scope === 'page'
                    if (withScopePage)
                        tsFilePath = `${basePath}/${RENDERER_CONFIG.fileSystemPaths.generated}/${content.pagePath}/components/${content.name.toLowerCase()}.tsx`
                    else
                        tsFilePath = `${basePath}/${RENDERER_CONFIG.fileSystemPaths.customComponents}/${content.name.toLowerCase()}.tsx`
                }

                return <CodeContentTS pagePath={tsFilePath ?? ''} />
            } else {
                return isLoading ? (
                    <Loader />
                ) : (
                    <IGRPStudioMainComponent component={components ?? []} onDragEnd={onDragEnd} />
                )
            }
        }, [
            activePresentation,
            isLoading,
            components,
            onDragEnd,
            pagePath,
            basePath,
            page,
            content,
            isPage
        ])

        return (
            <div className="flex flex-1 overflow-hidden">
                <AppSidebar data={menuItems} basePath={basePath} />
                <SidebarInset>
                    <div className="flex flex-1 flex-col gap-4 p-2">
                        <ContainerScrollArea>{renderContent}</ContainerScrollArea>
                    </div>
                </SidebarInset>
            </div>
        )
    }
)

PageBuilder.displayName = 'PageBuilder'

export default PageBuilder
