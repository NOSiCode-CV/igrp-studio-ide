import { Button } from '@renderer/components/ui/button';
import RowTools from '../tools/RowTools';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';

export interface UiButtonProps {
    index: number;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const UiButton = ({ comp, index }: UiButtonProps) => {
    const { props, id: componentId } = comp;

    const { label, variant, size, customClasses } = props;

    return (
        <div className="relative group">
            <Button
                onClick={(e) => e.preventDefault()}
                variant={variant}
                size={size}
                className={customClasses}
            >
                <span className="truncate">{label}</span>
            </Button>
            <div className="absolute top-0 right-0 mt-1 px-2 py-1 bg-gray-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                <RowTools id={componentId} onEdit={()=>console.log()} index={index} />
            </div>
        </div>
    );
};

export default UiButton;
