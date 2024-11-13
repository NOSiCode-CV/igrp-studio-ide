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
        <div className="flex justify-content-end shadow-lg align-middle">
            <div className="flex align-middle">
                <span className="gen-c-copy-i" title="Container Copied">*</span>
                <span className="c-holder-loading"></span>
                <span className="c-type me-2 text-xs">{tag}</span>
            </div>

            <button className="container-mover cursor-pointer" {...dragHandleProps}>
                <Move className="h-4" />
            </button>

            <button className="container-clone cursor-pointer" title="Clonar">
                <Copy className="h-4" />
            </button>

            <button className="container-edit gen-edition-btn cursor-pointer" title="Editar"
                onClick={handleClickBtnEdition}>
                <Settings className="h-4" />
            </button>

            <button className="container-remove cursor-pointer" title="Remover"
                onClick={handleClickDeleteComp}>
                <Trash className="h-4" />
            </button>

        </div>
    )
}

export default CompTools