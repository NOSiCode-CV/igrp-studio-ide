import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { generateId } from '@renderer/utils'
import type React from 'react'
import { COMPONENT } from '../../ComponentTypes'
import { useDroppedComponents } from '../../contexts/EditorContext'
import CompTools from './CompTools'

interface BoxContainerProps {
    group?: string
    className?: string
    comp: StructuredComponent
    parentComp?: StructuredComponent
    onEdit: () => void
    children: React.ReactElement
    path?: string
}

const BoxWrapper = ({
    comp,
    parentComp,
    children,
    group,
    className,
    onEdit,
    path
}: BoxContainerProps) => {
    const { id, componentName, children: components } = comp

    const {
        handleRemoveChildFromComponent,
        handleAddChildToComponent,
        handleUpdateChildComponent
    } = useDroppedComponents()

    const onClickBtnEdition = () => {
        onEdit()
    }

    const onClickDeleteComp = () => {
        handleRemoveChildFromComponent({ droppableId: id, index: 0 })
    }

    const onClickCloneComp = () => {
        // Create a deep copy of the component
        const cloneComponent = (component: StructuredComponent): StructuredComponent => {
            const newId = generateId(component.componentName)
            const newTag = `${component.tag}_copy`

            return {
                ...component,
                id: newId,
                tag: newTag,
                children: component.children?.map((child) => cloneComponent(child)) || []
            }
        }

        const clonedComponent = cloneComponent(comp)

        // Add the cloned component to the same parent
        if (parentComp) {
            // Find the index of the current component in its parent
            const currentIndex =
                parentComp.children?.findIndex((child) => child.id === comp.id) || 0
            // Add the cloned component right after the current component
            handleAddChildToComponent(
                { droppableId: parentComp.id, index: currentIndex + 1 },
                clonedComponent
            )
        }
    }

    const onClickStructure = (layout: string) => {
        const newLayout = layout.split(',').map((size) => parseInt(size.trim(), 10))

        if (componentName === COMPONENT.Columns) {
            const currentSizes = components.length
            newLayout.forEach((colSize, index) => {
                if (index < currentSizes) {
                    // if column exists, update size and move components
                    const currentCol = components[index]
                    const props = {
                        ...currentCol,
                        properties: {
                            variant: `span${colSize.toString()}`
                        }
                    }

                    // move components from current column to new one
                    if (currentCol.children.length > 0) {
                        props.children = [...currentCol.children]
                    }

                    handleUpdateChildComponent(components[index].id, props)
                } else {
                    // Create  a new column if does not exist
                    const childColumnId = generateId(`column_${index + 1}`)
                    const childColumn: StructuredComponent = {
                        id: childColumnId,
                        componentName: `column`,
                        label: `Column ${index + 1}`,
                        properties: {
                            variant: `span${colSize.toString()}`
                        },
                        children: [],
                        interactions: [],
                        tag: ''
                    }
                    handleAddChildToComponent({ droppableId: id, index }, childColumn)
                }
            })

            // Remove extra column
            if (newLayout.length < currentSizes) {
                const columnsToRemove = currentSizes - newLayout.length
                for (let i = 0; i < columnsToRemove; i++) {
                    handleRemoveChildFromComponent({
                        droppableId: components[newLayout.length + i].id,
                        index: 0
                    })
                }
            }
        }
    }

    return (
        <div className={cn('relative', group)} id={id}>
            <div
                className={cn(
                    `absolute -top-8 right-0 px-2 bg-gray-600 text-white rounded transition-opacity duration-200 shadow-lg z-50`,
                    className
                )}
            >
                <CompTools
                    path={path}
                    comp={comp}
                    parentComp={parentComp}
                    handleClickDeleteComp={onClickDeleteComp}
                    handleClickBtnEdition={onClickBtnEdition}
                    handleClickStructComp={onClickStructure}
                    handleClickCloneComp={onClickCloneComp}
                />
            </div>
            {children}
        </div>
    )
}

export default BoxWrapper
