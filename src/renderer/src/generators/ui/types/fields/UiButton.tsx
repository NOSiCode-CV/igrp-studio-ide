import React from "react"
import BoxTools from "../tools/RowTools"
import { Link } from "react-router-dom"
import { DroppedComponent } from "../../interfaces"

export interface UiButtonProps {
    componentId: string,
    comp: DroppedComponent,
    onEdit: () => void
}

const UiButton = ({ componentId, comp, onEdit }: UiButtonProps) => {

    const { label } = comp.config

    return (
        <React.Fragment>
            <Link color="primary" type='button' className="gen-ctx-menu-holder btn btn-primary" to="/#"
                onClick={(e) => e.preventDefault()}>
                <span className="btn-text text-truncate">{label}</span>
                <BoxTools id={componentId} onEdit={onEdit} />
            </Link>
        </React.Fragment>
    )
}
export default UiButton