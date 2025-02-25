import { GripHorizontal, Settings } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';

const DraggableElement = ({ item, index }) => {
    return (
        <Draggable draggableId={`${item.id}`} index={index}>
            {(provided, snapshot) => (
                <>
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`transition-colors duration-200 
                            ${snapshot.isDragging ? 'bg-blue-100' : 'bg-white'} 
                            flex flex-col items-center justify-center 
                            text-xs  w-full space-y-2 p-2 rounded-lg 
                            shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 `}
                    >
                        <GripHorizontal
                            className="h-4 w-4 text-gray-400 opacity-75"
                            aria-hidden="true"
                        />
                        {item.icon ? (
                            <item.icon className="h-6 w-6" />
                        ) : (
                            <Settings className="h-6 w-6" />
                        )}
                        <span>{item.label || 'Widget'}</span>
                    </div>
                    {snapshot.isDragging && (
                        <div
                            className="transition-colors duration-200 
                                bg-blue-100 flex flex-col 
                                items-center justify-center 
                                text-xs  p-2 w-full"
                        >
                            <GripHorizontal
                                className="h-4 w-4 text-gray-400 opacity-75"
                                aria-hidden="true"
                            />
                            {item.icon ? (
                                <item.icon className="h-6 w-6" />
                            ) : (
                                <Settings className="h-6 w-6" />
                            )}
                            <span>{item.label || 'Widget'}</span>
                        </div>
                    )}
                </>
            )}
        </Draggable>
    );
};

export default DraggableElement;
