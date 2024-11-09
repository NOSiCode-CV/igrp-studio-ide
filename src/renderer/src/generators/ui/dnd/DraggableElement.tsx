import { Draggable } from "react-beautiful-dnd";
import { useTranslation } from "react-i18next";
import styled from 'styled-components';

const Item = styled.div`
    transition: background-color 0.2s ease; 
`;

const Clone = styled(Item)`
    + div {
        display: none !important;
    }
`;

const DraggableElement = ({ item, index }) => {
    const { t } = useTranslation();

    return (
        <Draggable draggableId={`${item.id}`} index={index}>
            {(provided, snapshot) => (
                <>
                    <Item
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                            ...provided.draggableProps.style,
                            backgroundColor: snapshot.isDragging ? 'lightblue' : 'inherit',
                            maxWidth: '200px'
                        }}
                        className="nav-link-custom flex-column fs-10 w-100 d-flex justify-content-center text-center border border-secondary-subtler rounded p-0 py-2"
                    >
                        <i className="ri-drag-move-2-line fs-6 opacity-50" />
                        <i className={`${item.icon} fs-4`} />
                        <span>{t(item.label)}</span>
                    </Item>
                    {snapshot.isDragging && (
                        <Clone className="nav-link-custom flex-column fs-10 w-100 d-flex justify-content-center text-center border border-secondary-subtler rounded p-0 py-2">
                            <i className="ri-drag-move-2-line fs-6 opacity-50" />
                            <i className={`${item.icon} fs-4`} />
                            <span>{t(item.label)}</span>
                        </Clone>
                    )}
                </>
            )}
        </Draggable>
    );
};

export default DraggableElement;
