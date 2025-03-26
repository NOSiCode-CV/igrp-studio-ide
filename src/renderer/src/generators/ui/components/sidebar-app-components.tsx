import { SidebarMenu, SidebarMenuItem } from '@renderer/components/ui/sidebar';
import { APP_COMPONENT } from '../ComponentTypes';
import useStudio from '@renderer/hooks/useStudio';
import Draggable from '@renderer/lib/dnd/Draggable';
import { GripHorizontal } from 'lucide-react';
import { EmptyList } from '@renderer/components/empty-list';
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';

const SidebarAppComponents = ({ searchTerm }: { searchTerm: string }) => {
    const { fetchComponents } = useStudio();

    const components = fetchComponents();

    const filteredComponents =
        components &&
        components.filter((comp) =>
            comp.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <>
            {filteredComponents.length > 0 ? (
                <SidebarMenu className="grid grid-cols-2 gap-3 p-3 rounded-lg">
                    {filteredComponents.map((item, key) => (
                        <SidebarMenuItem
                            key={key}
                            className="flex flex-col items-center justify-center bg-muted rounded-md shadow-xs"
                        >
                            <Draggable
                                item={{
                                    id: item.content.name,
                                    label: item.content.name,
                                }}
                                className="w-full h-full"
                                dropZone={false}
                                type={APP_COMPONENT}
                            >
                                <div
                                    className="p-2 rounded-lg cursor-move flex flex-col items-center gap-2 
                            shadow-sm border text-xs border-gray-200 hover:shadow-md transition-shadow duration-200 bg-card"
                                >
                                    <GripHorizontal className="w-4 h-4 text-gray-400" />

                                    <div className="flex flex-col items-center gap-2">
                                        {item.content?.icon && (
                                            <IGRPIcon
                                                iconName={item.content.icon}
                                            />
                                        )}
                                        <span className=" text-gray-700 text-center">
                                            {item.content?.name}
                                        </span>
                                    </div>
                                </div>
                            </Draggable>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            ) : (
                <div className="p-4">
                    <EmptyList
                        title="No components created yet"
                        description="Components let you reuse designs in your application. To create a component."
                        shortcut="Command + Shift + P"
                        className="py-12"
                    />
                </div>
            )}
        </>
    );
};

export default SidebarAppComponents;
