import { Label } from "@renderer/components/ui/label"
import { DroppedComponent } from "../../interfaces"
import { DatePicker } from "@renderer/components/date-picker"

interface InputDateProps {
    comp: DroppedComponent,
    componentId: string,
    onEdit: () => void
}

const InputDate: React.FC<InputDateProps> = ({ comp, componentId }) => {

    const { label } = comp.config

    return (
        <div className="flex flex-col space-y-3">
            <Label htmlFor={componentId} className="mb-2">{label}</Label>
            <DatePicker name={componentId}/>
        </div>
    )
}

export default InputDate