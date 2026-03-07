import Draggable from '@renderer/lib/dnd/Draggable'
import { cn } from '@renderer/lib/utils'
import type { CardComponentProps } from '../CardComponent'

const IGRPStudioParagraph = ({ comp }: CardComponentProps) => {
    const { id: componentId, properties, componentName } = comp
    const { content, className } = properties

    return (
        <Draggable
            key={comp.id}
            item={comp}
            index={0}
            dropTargetId={componentId}
            layout="horizontal"
            className="p-1"
        >
            <div className={cn('', className)}>{content || componentName}</div>
        </Draggable>
    )
}

export default IGRPStudioParagraph
