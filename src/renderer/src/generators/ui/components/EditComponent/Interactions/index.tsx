import { EmptyList } from '@renderer/components/empty-list';
import { Button } from '@renderer/components/ui/button';
import {
    DropdownMenuTrigger,
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuContent,
} from '@renderer/components/ui/dropdown-menu';
import useStudio from '@renderer/hooks/use-studio';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { MousePointer, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

const Interactions = ({
    comp,
    path,
}: {
    comp: StructuredComponent;
    path: string;
}) => {
    const { getInteractionsComponent } = useStudio();
    const [interactions, setInteractions] = useState({});

    const { componentName, id: componentId, properties } = comp;

    useEffect(() => {
        if (componentName)
            getInteractionsComponent(path, componentName).then((data) =>
                setInteractions(data)
            );
    }, [getInteractionsComponent, comp, componentName]);

    console.log(interactions);

    return (
        <div className="p-3">
            <DropdownMenu>
                <div className="flex flex-1 justify-between align-middle w-full">
                    <span>Element Trigger</span>
                    <DropdownMenuTrigger>
                        <Button variant={'secondary'} size={'icon'}>
                            <Plus />
                        </Button>
                    </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent  className='min-w-60'>
                    {Object.keys(interactions).map((int) => {
                        return <DropdownMenuItem>{int}</DropdownMenuItem>;
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            <EmptyList
                title="Element Trigger"
                description="Select an element on the canvas, then click + above to animate the selected element when a user interacts with it (such as on hover or click)."
                className="py-12"
                icon={<MousePointer />}
            />
        </div>
    );
};

export default Interactions;
