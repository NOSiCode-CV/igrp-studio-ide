interface ToolsProps {
    tag: string,
    dragHandleProps?: any,
    handleClickBtnEdition: () => void;
    handleClickDeleteComp: () => void;
    id: string
}
const CompTools = ({ handleClickBtnEdition, handleClickDeleteComp, dragHandleProps, tag }: ToolsProps) => {

    return (
        <div className="d-flex justify-content-end">
            <div className="w-100 box-tools gen-container-setts shadow-lg  gen-settings-holder d-flex align-items-center">
                <span className="gen-c-copy-i" title="Container Copied">*</span>
                <span className="c-holder-loading"></span>

                <span className="c-type me-2" style={{ fontSize: '10px', color: '#a7a7a7' }}>{tag}</span>

                <div className="btn btn-box-tool container-mover" {...dragHandleProps}>
                    <i className="ri-drag-move-2-fill"></i>
                </div>

                <a className="btn btn-box-tool container-clone gen-clone-btn" title="Clonar">
                    <i className="ri-file-copy-line"></i>
                </a>

                <a className="btn btn-box-tool container-edit gen-edition-btn" title="Editar"
                    onClick={handleClickBtnEdition}>
                    <i className="ri-settings-5-line"></i>
                </a>

                <a className="btn btn-box-tool container-remove" title="Remover"
                    onClick={handleClickDeleteComp}>
                    <i className="ri-delete-bin-line"></i>
                </a>

            </div>

        </div>
    )
}

export default CompTools