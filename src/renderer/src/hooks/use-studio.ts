import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'
import type { FileTree, ProjectData } from 'src/main/types'
import { useComponentsContext } from '../generators/ui/contexts/ComponentsContext'

interface RootState {
    PageBuilder: {
        filesThree: FileTree[]
        basePath: string
        config: ProjectData
    }
}

const selectState = (state: RootState) => state.PageBuilder
const selectProperties = createSelector(selectState, (studio) => ({
    files: studio.filesThree ?? [],
    basePath: studio.basePath,
    config: studio.config
}))

const useStudio = (): {
    files: FileTree[]
    basePath: string
    config: ProjectData
    componentsRegistered: ComponentRegisterConfig[]
    pageOptions: any[]
    findComponent: (
        path: string | undefined,
        componentName: string
    ) => Promise<ComponentRegisterConfig | null>
    findComponentById: (componentName: string) => Promise<ComponentRegisterConfig | undefined>
    getAcceptedChildren: (
        path: string | undefined,
        componentName: string
    ) => Promise<ComponentRegisterConfig[]>
    getPropertiesComponent: (
        path: string | undefined,
        componentName: string
    ) => Promise<Record<string, any>>
    getDataComponent: (
        path: string | undefined,
        componentName: string
    ) => Promise<Record<string, any>>
    getChildPropertiesComponent: (
        path: string | undefined,
        componentName: string
    ) => Promise<Record<string, any>>
    getInteractionsComponent: (
        path: string | undefined,
        componentName: string
    ) => Promise<Record<string, any>>
    getRulesComponent: (
        path: string | undefined,
        componentName: string
    ) => Promise<Record<string, any>>
    getComponentData: (componentName: string) => Promise<any>
    getPageData: (componentName: string) => Promise<any>
    fetchComponents: () => FileTree[]
    loadRegistryComponent: (component: ComponentRegisterConfig) => void
} => {
    const { files, basePath, config } = useSelector(selectProperties)

    // Use shared context for components
    const { componentsRegistered, loadRegistryComponent } = useComponentsContext()

    const [pageOptions, setPageOptions] = useState<
        {
            value: string
            label: string
            metadata: {
                path: string
                segments: string[]
                pageName: string
            }
        }[]
    >([])

    // Fetch components from the files tree
    const fetchComponents = useCallback(() => {
        const componentsFolder = files.find((page) => page.name === 'components')
        return componentsFolder?.children ?? []
    }, [files])

    // Get component data from a JSON file
    const getComponentData = useCallback(
        async (componentName: string) => {
            try {
                const data = await window.api?.getJsonContent(
                    `${basePath}/.igrpstudio/components/${componentName}.json`
                )
                return data
            } catch (error) {
                console.error('Failed to load JSON content:', error)
                return null
            }
        },
        [basePath]
    )

    // Get page data by component name
    const getPageData = useCallback(
        async (componentName: string) => {
            try {
                const components = files.find((page) => page.name === 'components')

                if (!components || !components.children) {
                    return null
                }

                const filteredPages = components.children.filter((page) =>
                    page.content.name.includes(componentName)
                )

                return filteredPages[0] || null
            } catch (error) {
                console.error('Failed to load JSON content:', error)
                return null
            }
        },
        [files]
    )

    // Helper function to find a component by name or within a parent's acceptedChildren
    const findComponent = useCallback(
        async (path: string | undefined, componentName: string) => {
            if (!componentName) return null

            // Use the already loaded componentsRegistered instead of making a new API call
            if (componentsRegistered.length === 0) {
                console.warn(
                    '[Debug] useStudio: No components registered yet. Call loadRegistryComponent() first.'
                )
                return null
            }
            // If no path is provided, search for the component directly by name
            let component: ComponentRegisterConfig | null =
                componentsRegistered.find(
                    (comp: ComponentRegisterConfig) => comp.name === componentName
                ) || null

            if (path && !component) {
                // Split the path into parts (e.g., "table/tableColumns/tableTextCell" => ["table", "tableColumns", "tableTextCell"])
                const pathParts = path.split('/')

                // Start searching from the root level
                let currentComponents = componentsRegistered

                for (let i = 0; i < pathParts.length; i++) {
                    const currentPathPart = pathParts[i]

                    // Find the parent component at the current level
                    const parentComponent = currentComponents.find(
                        (comp: ComponentRegisterConfig) => comp.name === currentPathPart
                    )

                    if (!parentComponent) {
                        // If the parent component or its children are not found, stop searching
                        console.warn(
                            `[Debug] useStudio: Parent component "${currentPathPart}" not found in path "${path}"`
                        )
                        return null
                    }

                    // Move to the next level in the hierarchy
                    currentComponents = parentComponent.acceptedChildren

                    // If this is the last part of the path, search for the component by name
                    if (i === pathParts.length - 1) {
                        component =
                            currentComponents.find(
                                (comp: ComponentRegisterConfig) => comp.name === componentName
                            ) || null
                    }
                }
            }

            return component
        },
        [componentsRegistered]
    )

    // Get accepted children for a component
    const getAcceptedChildren = useCallback(
        async (path: string | undefined, componentName: string) => {
            const component = await findComponent(path, componentName)
            return component ? component.acceptedChildren : []
        },
        [findComponent]
    )

    // Get properties for a component
    const getPropertiesComponent = useCallback(
        async (path: string | undefined, componentName: string) => {
            const component = await findComponent(path, componentName)
            return component ? component.properties : {}
        },
        [findComponent]
    )

    // Get properties for a childProperties
    const getChildPropertiesComponent = useCallback(
        async (path: string | undefined, componentName: string) => {
            const component = await findComponent(path, componentName)
            return component ? component.childProperties || {} : {}
        },
        [findComponent]
    )

    // Get properties for a interactions
    const getInteractionsComponent = useCallback(
        async (path: string | undefined, componentName: string) => {
            const component = await findComponent(path, componentName)
            return component ? component.interactions : {}
        },
        [findComponent]
    )

    // Get rules for a rules
    const getRulesComponent = useCallback(
        async (path: string | undefined, componentName: string) => {
            const component = await findComponent(path, componentName)
            return component ? component.rules : {}
        },
        [findComponent]
    )

    // Get data for a data
    const getDataComponent = useCallback(
        async (path: string | undefined, componentName: string) => {
            const component = await findComponent(path, componentName)
            return component ? component.data : {}
        },
        [findComponent]
    )

    const findComponentById = async (
        componentName: string
    ): Promise<ComponentRegisterConfig | undefined> => {
        return componentsRegistered.find((component) => component.name === componentName)
    }

    useEffect(() => {
        const pages = files.find((page) => page.name === 'pages')
        const options =
            pages?.children
                ?.filter((page) => page?.content?.pageName)
                .map((page) => {
                    const { content } = page
                    return {
                        value: content.path,
                        label: content.description || content.pageName,
                        metadata: {
                            path: content.path,
                            segments: content.segments,
                            pageName: content.pageName
                        }
                    }
                }) ?? []
        setPageOptions(options)
    }, [files])

    return {
        files,
        basePath,
        config,
        componentsRegistered,
        pageOptions,
        findComponent,
        findComponentById,
        getAcceptedChildren,
        getPropertiesComponent,
        getDataComponent,
        getChildPropertiesComponent,
        getInteractionsComponent,
        getRulesComponent,
        getComponentData,
        getPageData,
        fetchComponents,
        loadRegistryComponent
    }
}

export default useStudio
