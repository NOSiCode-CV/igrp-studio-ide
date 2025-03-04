import { SidebarMenu, SidebarMenuItem } from '@renderer/components/ui/sidebar';
import { APP_COMPONENT } from '../ComponentTypes';
import useStudio from '@renderer/hooks/useStudio';
import Draggable from '@renderer/lib/dnd/Draggable';
import { GripHorizontal } from 'lucide-react';

const SidebarAppComponents = ({ searchTerm }: { searchTerm: string }) => {
    const { fetchComponents } = useStudio();

    const components = fetchComponents();

    const filteredComponents =
        components &&
        components.filter((comp) =>
            comp.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <SidebarMenu className="grid grid-cols-2 gap-3 p-3 rounded-lg">
            {filteredComponents.map((item, key) => (
                <SidebarMenuItem
                    key={key}
                    className="flex flex-col items-center justify-center bg-muted rounded-md shadow-xs"
                >
                    <Draggable
                        item={{
                            id: item.content.name,
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
                                    <item.content.icon className="w-6 h-6 text-gray-600" />
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
    );
};

export default SidebarAppComponents;
