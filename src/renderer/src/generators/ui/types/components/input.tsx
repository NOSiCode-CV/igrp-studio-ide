import { Label } from '@renderer/components/ui/label';
import { Input } from '@renderer/components/ui/input';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';

export interface InputTextProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const InputField: React.FC<InputTextProps> = ({ comp }) => {
    const { label, id: componentId } = comp;

    return (
        <div className="space-y-2">
            <Label htmlFor={componentId} className="form-label fw-medium fs-13">
                {label}
            </Label>
            <Input
                id={componentId}
                type="text"
                className="form-control"
                placeholder={''}
            />
        </div>
    );
};

export default InputField;
