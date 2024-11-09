import { FormGroup, Input, Label } from "reactstrap"
import { DroppedComponent } from "../../interfaces"

interface InputDateProps {
    comp: DroppedComponent,
    componentId: string,
    onEdit: () => void
}

const InputDate: React.FC<InputDateProps> = ({ comp, componentId }) => {

    const { label } = comp.config

    return (
        <FormGroup>
            <Label htmlFor={componentId} className="form-label fw-medium fs-13">{label}</Label>
            <Input type="date" className="form-control" id={componentId}
                placeholder=''
            />
        </FormGroup>
    )
}

export default InputDate