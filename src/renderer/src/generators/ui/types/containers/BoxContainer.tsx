import React from "react";
import { useDroppedComponents } from "../../dnd/DroppedComponentsContext";
import CompTools from "../tools/CompTools";

interface BoxContainerProps {
    children: React.ReactElement,
    id: string,
    tag: string,
    onEdit: () => void,
    dragHandleProps?: any,
}

const BoxContainer = ({ children, id, tag, onEdit, dragHandleProps }: BoxContainerProps) => {

    const { removeComponent } = useDroppedComponents();

    const handleClickBtnEdition = () => {
        onEdit();
    }

    const handleClickDeleteComp = () => {
        removeComponent(id)
    };

    return (

        <React.Fragment>

            <div className="gen-declared-containers">
                <div id={id} className="gen-container-holder">
                    <CompTools
                        id={id}
                        handleClickDeleteComp={handleClickDeleteComp}
                        handleClickBtnEdition={handleClickBtnEdition}
                        tag={tag}
                        dragHandleProps={dragHandleProps}
                    />
                    <div className="container-contents">
                        {React.cloneElement(children, {
                            id,
                            tag
                        })}
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default BoxContainer;