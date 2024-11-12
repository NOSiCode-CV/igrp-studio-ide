import { Copy, Move, Settings, Trash } from "lucide-react";

interface ToolsProps {
    tag: string,
    dragHandleProps?: any,
    handleClickBtnEdition: () => void;
    handleClickDeleteComp: () => void;
    id: string
}
const CompTools = ({ handleClickBtnEdition, handleClickDeleteComp, dragHandleProps, tag }: ToolsProps) => {

    return (
        <div className="flex justify-content-end  box-tools gen-container-setts shadow-lg  gen-settings-holder">
            <span className="gen-c-copy-i" title="Container Copied">*</span>
            <span className="c-holder-loading"></span>

            <span className="c-type me-2 text-xs">{tag}</span>

            <div className="btn btn-box-tool container-mover" {...dragHandleProps}>
                <Move className="h-4" />
            </div>

            <a className="btn btn-box-tool container-clone gen-clone-btn" title="Clonar">
                <Copy className="h-4" />
            </a>

            <a className="btn btn-box-tool container-edit gen-edition-btn" title="Editar"
                onClick={handleClickBtnEdition}>
                <Settings className="h-4" />
            </a>

            <a className="btn btn-box-tool container-remove" title="Remover"
                onClick={handleClickDeleteComp}>
                <Trash className="h-4" />
            </a>

        </div>
    )
}

export default CompTools