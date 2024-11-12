import { Copy, Settings, Trash } from "lucide-react";
import { useDroppedComponents } from "../../dnd/DroppedComponentsContext"

interface ToolsProps {
    onEdit: () => void,
    id: string
}
const RowTools = ({ id, onEdit }: ToolsProps) => {

    const { removeComponentField } = useDroppedComponents();

    const onClickDeleteField = () => {
        removeComponentField(id)
    }

    return (
        <div className="box-tools gen-field-edt-options  gen-settings-holder shadow-lg  flex justify-end" >
            <button className="btn btn-box-tool flex align-items-center justify-center  field-clone gen-clone-btn" title="">
                <Copy className="h-4" />
            </button>

            <button className="btn btn-box-tool flex align-center justify-center  field-edit gen-edition-btn"
                title="" onClick={onEdit}>
                <Settings className="h-4" />
            </button>

            <button className="btn btn-box-tool flex align-items-center justify-center  field-remove"
                onClick={onClickDeleteField}>
                <Trash className="h-4" />
            </button>
        </div>
    )
}

export default RowTools