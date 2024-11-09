import { useDraggable } from '@dnd-kit/core';
import { useTranslation } from "react-i18next";
import styled from 'styled-components';
import { CSS } from '@dnd-kit/utilities';

const Item = styled.div`
    transition: background-color 0.2s ease;
`;

const DraggableSidebarItem = ({ item }) => {

    const { t } = useTranslation();
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: item.id
    });

    const style = {
        transform: CSS.Translate.toString(transform),
    };

    return (
        <Item  
            ref={setNodeRef} style={style} {...listeners} {...attributes}
            className="nav-link-custom flex-column fs-10 w-100 d-flex justify-content-center text-center border border-secondary-subtler rounded p-0 py-2"
            >
            <i className="ri-drag-move-2-line" />
            <i className={item.icon} />
            <span>{t(item.label)}</span>
        </Item>
    );
};


export default DraggableSidebarItem;
