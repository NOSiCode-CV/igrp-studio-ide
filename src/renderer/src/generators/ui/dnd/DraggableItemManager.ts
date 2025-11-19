import { generateId } from '@renderer/utils'
import { Destination, DragEndResult, Source, StructuredComponent } from '@renderer/lib/dnd/types'
import { ComponentRegisterConfig, State } from '@igrp/igrp-studio-nextjs-engine/types'
import { getDefaultInteractions, getDefaultProperties, getRequiredDataSchema } from './helpers'

interface DragEndHandlers {
  handleAddChildToComponent: (destination: Destination, component: StructuredComponent) => void
  handleReorderChildInComponent: (
    draggableId: string,
    source: Source,
    destination: Destination
  ) => void
  generateTag: (name: string) => string
  addState?: (state: State) => void
  findComponent: (path: string, componentName: string) => Promise<ComponentRegisterConfig | null>
  showErrorToast: (message: string) => void
}

export const handleDragEnd = async (
  result: DragEndResult,
  handlers: DragEndHandlers
): Promise<void> => {
  /**
   * Validation: For each component that is dropped/moved, we must verify if the destination.{droppableId}
   * component has acceptChildren[].name. If it does, we check if the component being dropped is one of the accepted ones.
   * If not, we don't allow the drop. If acceptChildren is null/empty, we allow it.
   */

  const { draggableId, source, destination, mode, type }: DragEndResult = result

  if (!destination) {
    return
  }

  // Validate if the destination component accepts the dropped component
  const isDropAllowed = await validateDropPermission(
    source.componentName || draggableId,
    destination,
    handlers
  )

  if (!isDropAllowed) {
    handlers.showErrorToast(
      `Drop not allowed: Component '${source.componentName || draggableId}' cannot be dropped into '${destination.droppableName || destination.droppableId}'`
    )
    return
  }

  if (mode === 'MOVE') {
    handlers.handleReorderChildInComponent(draggableId, source, destination)
  } else {
    await handleDropComponent(draggableId, source, destination, type, handlers)
  }
}

/**
 * Validates if a component can be dropped into a destination based on acceptChildren configuration
 */
const validateDropPermission = async (
  draggableId: string,
  destination: Destination,
  handlers: DragEndHandlers
): Promise<boolean> => {
  try {
    // Add null checks for the destination properties
    if (!destination.droppablePath || !destination.droppableName) {
      return true
    }

    const destinationComponent = await handlers.findComponent(
      destination.droppablePath,
      destination.droppableName
    )

    if (!destinationComponent) {
      return true
    }

    // If acceptChildren is null, undefined, or empty array, allow the drop
    if (
      !destinationComponent.acceptedChildren ||
      destinationComponent.acceptedChildren.length === 0
    ) {
      return true
    }

    // Check if the dropped component is in the acceptedChildren list
    const isAccepted = destinationComponent.acceptedChildren.some(
      (acceptedChild) => acceptedChild.name === draggableId
    )

    return isAccepted
  } catch (error) {
    // In case of error, allow the drop (fail-safe behavior)
    return true
  }
}

const handleDropComponent = async (
  draggableId: string,
  source: Source,
  destination: Destination,
  type: string,
  handlers: DragEndHandlers
): Promise<void> => {
  const {
    label,
    properties,
    childrenTypes,
    interactions: interactionsProperties,
    allowTypes,
    data: dataProperties,
    defaultChildren
  } = source

  const componentId = generateId(draggableId)
  const tag = handlers.generateTag(draggableId)
  const data = getRequiredDataSchema(dataProperties)
  const interactions = getDefaultInteractions(interactionsProperties)
  const _properties = getDefaultProperties(properties, tag)

  // Create the component object
  const component: StructuredComponent = {
    id: componentId,
    tag,
    componentName: draggableId,
    label,
    type,
    children: [],
    interactions,
    allowTypes,
    data: data,
    properties: _properties
  }

  if (childrenTypes) {
    const childPromises = childrenTypes
      .filter((child) => child.defaultValue)
      .map(async (child: ComponentRegisterConfig) => {
        const childComponent = await createStructuredComponentRecursive(
          child,
          handlers.generateTag,
          handlers
        )
        return childComponent
      })
    const childComponents = await Promise.all(childPromises)
    component.children?.push(...childComponents)
  }

  if (defaultChildren) {
    for (const child of defaultChildren) {
      if (childrenTypes && !childrenTypes.some((childType) => childType.name === child.name)) {
        const register = await handlers.findComponent('', child.name)
        if (register) {
          const childComponent = await createStructuredComponentRecursive(
            register,
            handlers.generateTag,
            handlers
          )
          component.children?.push(childComponent)
        }
      }
    }
  }

  handlers.handleAddChildToComponent(destination, component)
}

// Recursive helper to create a StructuredComponent with nested childrenTypes
async function createStructuredComponentRecursive(
  child: ComponentRegisterConfig,
  generateTag: (name: string) => string,
  handlers: DragEndHandlers
) {
  const {
    name,
    label,
    properties,
    interactions: interactionsProperties,
    allowTypes,
    data: dataProperties,
    childrenTypes,
    defaultChildren
  } = child
  const childId = generateId(name)
  const tag = generateTag(name)
  const data = getRequiredDataSchema(dataProperties)
  const interactions = getDefaultInteractions(interactionsProperties)
  const _properties = getDefaultProperties(properties, tag)

  // Recursively create children if childrenTypes exist
  let children: StructuredComponent[] = []
  if (childrenTypes && Array.isArray(childrenTypes)) {
    const childPromises = childrenTypes
      .filter((grandChild) => grandChild.defaultValue)
      .map((grandChild: ComponentRegisterConfig) =>
        createStructuredComponentRecursive(grandChild, generateTag, handlers)
      )
    children = await Promise.all(childPromises)
  }

  // Handle defaultChildren recursively
  if (defaultChildren) {
    for (const defaultChild of defaultChildren) {
      if (
        childrenTypes &&
        !childrenTypes.some((childType) => childType.name === defaultChild.name)
      ) {
        const register = await handlers.findComponent('', defaultChild.name)
        if (register) {
          const defaultChildComponent = await createStructuredComponentRecursive(
            register,
            generateTag,
            handlers
          )
          children.push(defaultChildComponent)
        }
      }
    }
  }

  const childComponent: StructuredComponent = {
    id: childId,
    tag,
    componentName: name,
    label: label,
    children,
    interactions,
    allowTypes,
    data,
    properties: _properties
  }

  return childComponent
}
