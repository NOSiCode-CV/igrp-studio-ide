import { FormGroup, Input, Label } from "reactstrap"
import { DroppedComponent } from "../../interfaces"

export interface InputTextProps {
    comp: DroppedComponent,
    componentId: string,
    onEdit: () => void
}

const UiText: React.FC<InputTextProps> = ({ componentId, comp }) => {

    const { placeholder, label } = comp.config

    return (
        <FormGroup>
            <Label htmlFor={componentId} className="form-label fw-medium fs-13">{label}</Label>
            <Input id={componentId}
                type="text"
                className="form-control"
                placeholder={placeholder}
            />
        </FormGroup>
    )
}

export default UiText