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
        <div className="box-tools gen-field-edt-options  shadow-lg gen-settings-holder d-flex align-items-center" >

            <button   className="btn btn-box-tool d-flex align-items-center justify-content-center  field-clone gen-clone-btn" title="">
                <i className="ri-file-copy-line"></i>
            </button>

            <button  className="btn btn-box-tool d-flex align-items-center justify-content-center  field-edit gen-edition-btn"
                title="" onClick={onEdit}>
                <i className="ri-settings-5-line"></i>
            </button>

            <button  className="btn btn-box-tool d-flex align-items-center justify-content-center  field-remove"
                onClick={onClickDeleteField}>
                <i className="ri-delete-bin-line"></i>
            </button>
        </div>
    )
}

export default RowTools