import { Label } from "@renderer/components/ui/label"
import { DroppedComponent } from "../../interfaces"
import { Input } from "@renderer/components/ui/input"

export interface InputTextProps {
    comp: DroppedComponent,
    componentId: string,
    onEdit: () => void
}

const UiText: React.FC<InputTextProps> = ({ componentId, comp }) => {

    const { placeholder, label } = comp.config

    return (
        <div className="space-y-2">
            <Label htmlFor={componentId} className="form-label fw-medium fs-13">{label}</Label>
            <Input id={componentId}
                type="text"
                className="form-control"
                placeholder={placeholder}
            />
        </div>
    )
}

export default UiText