import { GripHorizontal, Settings } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import { useTranslation } from "react-i18next";

const DraggableElement = ({ item, index }) => {
    const { t } = useTranslation();

    return (
        <Draggable draggableId={`${item.id}`} index={index}>
            {(provided, snapshot) => (
                <>
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`transition-colors duration-200 
                            ${snapshot.isDragging ? 'bg-blue-100' : 'bg-transparent'} 
                            flex flex-col items-center justify-center 
                            text-center text-xs  w-full space-y-1 p-2`}
                    >
                        <GripHorizontal className="h-4 w-4 text-gray-400 opacity-75" aria-hidden="true" />
                        {item.icon ? (<item.icon className="h-5 w-5" />) : (<Settings className="h-5 w-5"/>) }
                        <span>{t(item.label || 'Default Label')}</span>
                    </div>
                    {snapshot.isDragging && (
                        <div
                            className="transition-colors duration-200 
                                bg-blue-100 max-w-[200px] flex flex-col 
                                items-center justify-center text-center 
                                text-xs border border-gray-300 rounded p-2"
                        >
                            <GripHorizontal className="h-4 w-4 text-gray-400 opacity-75" aria-hidden="true" />
                            {item.icon ? (<item.icon className="h-5 w-5" />) : (<Settings className="h-5 w-5"/>) }
                            <span>{t(item.label || 'Default Label')}</span>
                        </div>
                    )}
                </>
            )}
        </Draggable>
    );
};

export default DraggableElement;