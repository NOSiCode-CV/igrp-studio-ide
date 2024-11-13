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
        <div className="relative group/comp" id={id} >
            <div className="absolute top-0 right-0 px-2 bg-gray-600 text-white rounded opacity-0 group-hover/comp:opacity-100 transition-opacity duration-200 shadow-lg">
                <CompTools
                    id={id}
                    handleClickDeleteComp={handleClickDeleteComp}
                    handleClickBtnEdition={handleClickBtnEdition}
                    tag={tag}
                    dragHandleProps={dragHandleProps}
                />
            </div>
            <div className="container-contents">
                {React.cloneElement(children, {
                    id,
                    tag
                })}
            </div>
        </div>
    )
}

export default BoxContainer;