import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { SidebarMenu, SidebarMenuItem } from '@renderer/components/ui/sidebar';
import DraggableElement from '../dnd/DraggableElement';
import {COMPONENT } from '../ComponentTypes';

const AppComponents = ({ searchTerm }: { searchTerm: string }) => {
    const [components, setComponents] = useState<any[]>([]);

    const selectState = (state: any) => state.PageBuilder;

    const selectProperties = createSelector(selectState, (studio) => ({
        basePath: studio.basePath,
        config: studio.config,
        files: studio.filesThree,
    }));

    const { files } = useSelector(selectProperties);

    useEffect(() => {
        if (files) {
            const componentsFolder = files.find(
                (page) => page.name === 'components'
            );

            if (componentsFolder && componentsFolder.children) {
                setComponents(componentsFolder.children);
            }
        }
    }, [files]);

    const filteredComponents = components.filter((comp) =>
        comp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <SidebarMenu className="grid grid-cols-2 gap-3 p-3 rounded-lg">
            {filteredComponents.map((item, key) => (
                <Droppable
                    droppableId={`${item.name}`}
                    key={item.name}
                    type={COMPONENT}
                    isDropDisabled={true}
                >
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            <SidebarMenuItem
                                key={key}
                                className="flex flex-col items-center justify-center bg-muted rounded-md shadow-sm"
                            >
                                <DraggableElement
                                    item={{
                                        label: item.content.name,
                                        id: item.content.name,
                                    }}
                                    index={key}
                                />
                            </SidebarMenuItem>
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            ))}
        </SidebarMenu>
    );
};

export default AppComponents;
